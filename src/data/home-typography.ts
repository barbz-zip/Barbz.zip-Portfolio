import fonts from './home-fonts.mjs';

export interface HomeTypography { fonts: string[] }

// The future Sanity adapter returns the homeTypography document in this shape.
export async function getHomeTypography(): Promise<HomeTypography> {
  return { fonts: [...fonts] };
}
