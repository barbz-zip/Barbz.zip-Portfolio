import {sanityClient, useLocalContent} from '../lib/cms/client.ts';
import {settingsQuery} from '../lib/cms/queries.ts';
import type {SanityImage} from '../lib/cms/media.ts';
export interface SiteSettings {
  seoTitle?: string;
  seoDescription?: string;
  siteUrl: string;
  noIndex: boolean;
  shareTitle?: string;
  shareDescription?: string;
  favicon?: SanityImage;
  shareImage?: SanityImage;
}
export const defaultSettings: SiteSettings = {
  siteUrl: 'https://barbz-zip.github.io/Barbz.zip-Portfolio/',
  seoDescription: 'barbz.zip — graphic design and etc. An archive of graphic design projects.',
  noIndex: false,
};
export async function getSettings(): Promise<SiteSettings> {
  if (useLocalContent()) return defaultSettings;
  const settings = await sanityClient.fetch<SiteSettings | null>(settingsQuery);
  return {...defaultSettings, ...settings, siteUrl: settings?.siteUrl || defaultSettings.siteUrl};
}
