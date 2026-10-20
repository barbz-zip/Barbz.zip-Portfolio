import {createClient} from '@sanity/client';
import {sanityProjectId, sanityDataset, sanityApiVersion} from './config.ts';

export const sanityClient = createClient({
  projectId: sanityProjectId, dataset: sanityDataset, apiVersion: sanityApiVersion,
  useCdn: false, perspective: 'published', requestTagPrefix: 'barbz-zip',
});
// Explicit local fixtures for offline development and unit tests. No secret is exposed.
export function useLocalContent() {
  return ((import.meta as ImportMeta & {env?: Record<string, string>}).env?.SANITY_CONTENT ?? process.env.SANITY_CONTENT) !== 'sanity';
}
