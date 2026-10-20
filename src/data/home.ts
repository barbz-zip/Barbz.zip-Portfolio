import fonts from './home-fonts.mjs';
import {sanityClient, useLocalContent} from '../lib/cms/client.ts';
import {homeQuery} from '../lib/cms/queries.ts';
import {validateFontLinks} from '../lib/google-fonts.mjs';
export interface HomeContent {siteTitle: string; footerText: string; fonts: string[]; email?: string; readUrl?: string}
export const localHome: HomeContent = {siteTitle: 'barbz.zip', footerText: 'graphic design and etc.', fonts: [...fonts]};
export async function getHome(): Promise<HomeContent> {
  if (useLocalContent()) return localHome;
  const home = await sanityClient.fetch<HomeContent | null>(homeQuery);
  if (!home) throw new Error('Publish HOME in the BARBARA Studio before building the site.');
  if (validateFontLinks(home.fonts) !== true) throw new Error('HOME contains an invalid font list.');
  if (home.readUrl && !/^https?:\/\//i.test(home.readUrl)) throw new Error('HOME Read link must use HTTP or HTTPS.');
  return home;
}
