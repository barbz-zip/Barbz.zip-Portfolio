import {getHome} from './home.ts';
export interface HomeTypography { fonts: string[]; text?: string }
export async function getHomeTypography(): Promise<HomeTypography> {
  const home = await getHome();
  return {fonts: home.fonts, text: home.siteTitle};
}
