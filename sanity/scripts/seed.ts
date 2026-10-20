import {getCliClient} from 'sanity/cli';
import {createReadStream} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {getLocalProjects} from '../../src/data/projects.ts';
import {about} from '../../src/data/about.ts';
import {dumpImages} from '../../src/data/dump.ts';
import {localHome} from '../../src/data/home.ts';

const client = getCliClient({apiVersion: '2026-10-20'});
if (client.config().projectId !== 'uc4d6vam' || client.config().dataset !== 'production') {
  throw new Error('This import only runs in BARBARA / Barbz.zip Portfolio / production.');
}
const assets = new Map<string, string>();
async function image(src: string, alt: string) {
  let id = assets.get(src);
  if (!id) {
    const path = fileURLToPath(new URL(`../../public${src}`, import.meta.url));
    const asset = await client.assets.upload('image', createReadStream(path), {filename: src.split('/').pop()});
    id = asset._id;
    assets.set(src, id);
  }
  return {_type: 'portfolioImage', asset: {_type: 'reference', _ref: id}, alt};
}
const key = () => randomUUID();
// Only create missing documents. Re-running never replaces editorial changes.
await client.createIfNotExists({_id: 'home', _type: 'home', ...localHome});
const aboutExists = await client.fetch('count(*[_id in ["about", "drafts.about"]])');
if (!aboutExists) {
  await client.createIfNotExists({_id: 'about', _type: 'about', ...about,
    portrait: await image(about.portrait, `Portrait of ${about.name} wearing a red jacket.`),
    recognitionsTitle: 'Recognitions', pressTitle: 'Press',
    recognitions: about.recognitions.map(item => ({_key: key(), _type: 'recognition', ...item})),
    press: about.press.map(item => ({_key: key(), _type: 'pressLink', ...item})),
  });
}
for (const project of await getLocalProjects()) {
  const exists = await client.fetch('count(*[_type == "project" && slug.current == $slug])', {slug: project.slug});
  if (exists) continue;
  const gallery = [];
  for (const row of project.caseStudy.gallery) {
    const images = [];
    for (const media of row.images) images.push({_key: key(), ...await image(media.src, media.alt)});
    gallery.push({_key: key(), _type: 'galleryRow', layout: row.layout, orientation: row.orientation, images});
  }
  await client.create({_type: 'project', title: project.title, slug: {_type: 'slug', current: project.slug},
    year: project.year, description: project.description,
    cover: await image(project.cover.src, project.cover.alt),
    caseStudy: {...project.caseStudy, credits: project.caseStudy.credits.map(credit => ({_key: key(), _type: 'credit', ...credit})), gallery},
  });
  console.log(`Imported project: ${project.title}`);
}
// Keep the eight items currently used for navigation testing, now editable separately.
for (const [order, item] of [...dumpImages, ...dumpImages].entries()) {
  const exists = await client.fetch('count(*[_type == "dumpItem" && order == $order])', {order});
  if (exists) continue;
  const media = await image(item.src, item.alt);
  // Match the framing already used in the prototype using editable Sanity crop metadata.
  const framing = {
    carton: {width: 1.7097, height: 1.0448, left: .3778, top: 0},
    trifold: {width: 1.0077, height: 1, left: .0027, top: 0},
    photograph: {width: 1.0455, height: 1.4042, left: .0188, top: .0459},
  }[item.id];
  const crop = framing ? {_type: 'sanity.imageCrop', left: framing.left / framing.width, right: Math.max(0, 1 - (framing.left + 1) / framing.width), top: framing.top / framing.height, bottom: Math.max(0, 1 - (framing.top + 1) / framing.height)} : undefined;
  await client.create({_type: 'dumpItem', title: item.title, description: item.description, displayWidth: item.width, order, image: {...media, ...(crop ? {crop} : {})}});
  console.log(`Imported dump image ${order + 1}: ${item.title}`);
}
console.log('BARBARA initial content import complete. Existing documents were preserved.');
