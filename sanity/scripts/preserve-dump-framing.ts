import {getCliClient} from 'sanity/cli';
import {dumpImages} from '../../src/data/dump.ts';
const client = getCliClient({apiVersion: '2026-10-20'});
if (client.config().projectId !== 'uc4d6vam' || client.config().dataset !== 'production') throw new Error('BARBARA only.');
const docs = await client.fetch<Array<{_id: string; order: number; title: string}>>('*[_type == "dumpItem" && !defined(displayWidth)]{_id,order,title}');
for (const doc of docs) {
  const source = [...dumpImages, ...dumpImages][doc.order];
  if (source?.title === doc.title) await client.patch(doc._id).setIfMissing({displayWidth: source.width}).commit();
}
console.log('Existing Dump dimensions preserved.');
