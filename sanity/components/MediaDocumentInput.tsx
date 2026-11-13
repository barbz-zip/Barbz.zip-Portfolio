import {useCallback, useEffect, useState} from 'react';
import {
  getValueAtPath, set, useClient, useGetFormValue, useWorkspaceSchemaId,
  type ObjectInputProps,
} from 'sanity';
import {mediaTasks, type MediaTask} from './media-tasks';
import {captureVideoFrames} from './video-poster';

const clientOptions = {apiVersion: 'vX'};

type Failure = {identity: string; message: string};
function MediaJob({identity, documentId, onChange, onFailure}: {
  identity: string; documentId: string; onChange: ObjectInputProps['onChange']; onFailure: (failure: Failure) => void;
}) {
  const client = useClient(clientOptions);
  const schemaId = useWorkspaceSchemaId();
  const getValue = useGetFormValue();

  useEffect(() => {
    const job: MediaTask = JSON.parse(identity);
    const controller = new AbortController();
    const {signal} = controller;
    const current = () => !signal.aborted && mediaTasks(getValue([])).some(t => JSON.stringify(t) === identity);
    async function run() {
      if (!current()) return;
      const asset = await client.getDocument(job.source, {signal});
      if (!asset?.url) throw new Error('The uploaded file is unavailable.');
      if (!current()) return;
      let url = asset.url;
      if (asset._type === 'sanity.fileAsset') {
        const mode = job.kind === 'poster' ? 'poster' : 'sequence';
        const frame = await captureVideoFrames(url, mode, signal);
        if (!current()) return;
        const image = await client.assets.upload('image', frame, {filename: `barbz-zip-${job.source}-${mode}.jpg`});
        if (!current()) return;
        if (job.kind === 'poster') {
          onChange([
            set({_type: 'portfolioImage', asset: {_type: 'reference', _ref: image._id}}, [...job.path, 'poster']),
            set({source: job.source, assetId: image._id}, [...job.path, 'generatedPoster']),
          ]);
          return;
        }
        url = image.url;
      }
      const doc = getValue([]) as Record<string, unknown>;
      const context = [doc.title, doc.name, doc.caption, doc.description, doc.shareTitle, doc.shareDescription]
        .filter(value => typeof value === 'string').join('. ').slice(0, 800);
      const target = [...job.path, 'alt'];
      const result = await client.agent.action.transform({
        schemaId, documentId, noWrite: true,
        instruction: asset._type === 'sanity.fileAsset'
          ? 'These are successive frames from one video, in reading order. Write one concise English alt text describing the subject and visible changes. Omit references to the frame sheet and do not infer sound. Editorial context: $context'
          : 'Write one concise English alt text for the visible artwork. Describe the subject, design and meaningful lettering. Use the editorial context only when supported by the image. Context: $context',
        instructionParams: {context: context || 'barbz.zip design portfolio'},
        target: {path: target, operation: {type: 'image-description', imageUrl: url}},
      });
      const description = getValueAtPath(result, target);
      if (typeof description !== 'string' || !description.trim()) throw new Error('Sanity returned no description.');
      const text = description.trim();
      if (current()) onChange([
        set(text, [...job.path, 'alt']),
        set({source: job.source, text}, [...job.path, 'generatedAlt']),
      ]);
    }
    // Let the upload patch reach the draft before asking Sanity to describe that field.
    const timer = window.setTimeout(() => void run().catch(reason => {
      if (current()) onFailure({identity, message: reason instanceof Error ? reason.message : 'Please try again.'});
    }), 1000);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [identity, documentId, client, schemaId, onChange, onFailure, getValue]);
  return null;
}

export function MediaDocumentInput(props: ObjectInputProps) {
  const [failures, setFailures] = useState<Failure[]>([]);
  const onFailure = useCallback((failure: Failure) => setFailures(list => [...list, failure]), []);
  const tasks = props.readOnly ? [] : mediaTasks(props.value);
  const keyFor = (task: MediaTask) => JSON.stringify(task);
  const job = tasks.find(task => !failures.some(failure => failure.identity === keyFor(task)));
  const activeFailures = failures.filter(failure => tasks.some(task => keyFor(task) === failure.identity));
  return <>
    {props.renderDefault(props)}
    {job && props.value?._id && <>
      <p role="status">Generating {job.kind === 'poster' ? 'video poster' : 'alternative text'}…</p>
      <MediaJob key={props.value._id} identity={keyFor(job)} documentId={props.value._id}
        onChange={props.onChange} onFailure={onFailure} />
    </>}
    {activeFailures.map(({identity, message}) => <p key={identity} role="status">
      Could not generate {JSON.parse(identity).kind === 'poster' ? 'the video poster' : 'alternative text'}. {message}{' '}
      <button type="button" onClick={() => setFailures(list => list.filter(f => f.identity !== identity))}>Retry</button>
    </p>)}
  </>;
}
