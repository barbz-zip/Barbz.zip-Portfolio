import {wordmarkColor} from '../lib/wordmark-color.ts';
import {getHome} from './home.ts';
export interface HomeTypography { fonts: string[]; text?: string; color: string }
export async function getHomeTypography(): Promise<HomeTypography> {
  const home = await getHome();
  return {fonts: home.fonts, text: home.siteTitle, color: wordmarkColor(home.wordmarkColor)};
}
