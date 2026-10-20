import {defineConfig} from 'sanity';
import {structureTool} from 'sanity/structure';
import {schemaTypes} from './schemaTypes';
import {HomeIcon} from '@sanity/icons/Home';
import {CogIcon} from '@sanity/icons/Cog';
import {UserIcon} from '@sanity/icons/User';

const singletons = new Set(['home', 'about', 'settings']);
export default defineConfig({
  name: 'barbz-zip', title: 'barbz.zip — BARBARA',
  projectId: 'uc4d6vam', dataset: 'production',
  plugins: [structureTool({structure: S => S.list().title('barbz.zip').items([
    S.listItem().title('HOME').icon(HomeIcon).child(S.document().schemaType('home').documentId('home').title('HOME')),
    S.documentTypeListItem('project').title('PROJECTS').child(S.documentTypeList('project').title('PROJECTS').defaultOrdering([{field: 'year', direction: 'desc'}, {field: 'title', direction: 'asc'}, {field: '_id', direction: 'asc'}])),
    S.listItem().title('ABOUT').icon(UserIcon).child(S.document().schemaType('about').documentId('about').title('ABOUT')),
    S.documentTypeListItem('dumpItem').title('DUMP').child(S.documentTypeList('dumpItem').title('DUMP').defaultOrdering([{field: 'order', direction: 'asc'}])),
    S.divider(),
    S.listItem().id('settings').title('SETTINGS').icon(CogIcon).child(S.document().schemaType('settings').documentId('settings').title('SETTINGS')),
  ])})],
  schema: {types: schemaTypes, templates: templates => templates.filter(template => !singletons.has(template.schemaType))},
  document: {
    actions: (actions, context) => singletons.has(context.schemaType)
      ? actions.filter(action => !['delete', 'duplicate'].includes(action.action || '')) : actions,
    newDocumentOptions: options => options.filter(option => !singletons.has(option.templateId)),
  },
});
