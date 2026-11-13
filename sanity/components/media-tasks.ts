type KeyPath = (string | {_key: string})[];
type Media = {
  _type: string;
  asset?: {_ref?: string};
  alt?: string;
  generatedAlt?: {source: string; text: string};
  poster?: Media;
  generatedPoster?: {source: string; assetId: string};
};
export interface MediaTask {
  kind: 'poster' | 'describe';
  path: KeyPath;
  source: string;
  previous?: string;
}

export function mediaTasks(document: unknown): MediaTask[] {
  const tasks: MediaTask[] = [];
  function visit(value: unknown, path: KeyPath) {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item?._key) visit(item, [...path, {_key: item._key}]);
      }
      return;
    }
    const media = value as Media;
    if (!['portfolioImage', 'portfolioVideo'].includes(media._type)) {
      for (const [field, child] of Object.entries(value)) visit(child, [...path, field]);
      return;
    }
    const source = media.asset?._ref;
    if (!source) return;
    const needsAlt = !media.alt?.trim() || (media.generatedAlt?.source !== source && media.generatedAlt?.text === media.alt);
    if (media._type === 'portfolioImage') {
      if (needsAlt) tasks.push({kind: 'describe', path, source, previous: media.alt});
      return;
    }
    const poster = media.poster;
    const previous = poster?.asset?._ref;
    const automaticPoster = media.generatedPoster?.assetId === previous && !!previous;
    if (!previous || (automaticPoster && media.generatedPoster?.source !== source)) {
      tasks.push({kind: 'poster', path, source, previous});
      return;
    }
    visit(poster, [...path, 'poster']);
    if (needsAlt) tasks.push({kind: 'describe', path, source, previous: media.alt});
  }
  visit(document, []);
  return tasks;
}
