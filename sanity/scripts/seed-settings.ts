import {getCliClient} from 'sanity/cli';
import {createReadStream} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {defaultSettings} from '../../src/data/settings.ts';
const client = getCliClient({apiVersion: '2026-10-20'});
if (client.config().projectId !== 'uc4d6vam' || client.config().dataset !== 'production') throw new Error('BARBARA only.');
const exists = await client.fetch('count(*[_id in ["settings", "drafts.settings"]])');
if (!exists) {
  const favicon = await client.assets.upload('image', createReadStream(fileURLToPath(new URL('../../public/images/zip.png', import.meta.url))), {filename: 'barbz-zip-favicon.png'});
  await client.createIfNotExists({_id: 'settings', _type: 'settings', ...defaultSettings, favicon: {_type: 'image', asset: {_type: 'reference', _ref: favicon._id}}});
  console.log('Created SETTINGS using the existing site icon and metadata.');
} else console.log('Existing SETTINGS preserved.');
