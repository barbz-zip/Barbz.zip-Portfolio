import {createImageUrlBuilder} from '@sanity/image-url';
import {sanityProjectId, sanityDataset} from './config.ts';
const builder = createImageUrlBuilder({projectId: sanityProjectId, dataset: sanityDataset});
export function metadataImageUrl(image: SanityImage, kind: 'favicon' | 'sharing') {
  return kind === 'favicon'
    ? builder.image(image).width(64).height(64).fit('crop').format('png').url()
    : builder.image(image).width(1200).height(630).fit('crop').format('jpg').quality(85).url();
}
export interface SanityImage {
  _type?: string;
  asset: {_id: string; url: string; metadata: {dimensions: {width: number; height: number}}};
  alt?: string;
  crop?: {top: number; bottom: number; left: number; right: number};
  hotspot?: {x: number; y: number; width: number; height: number};
}
export interface SanityVideo {
  _type: 'portfolioVideo';
  alt?: string;
  asset: {_id: string; url: string; mimeType: string};
  poster?: SanityImage;
}
export function imageFromSanity(image: SanityImage) {
  if (!image?.asset?.metadata?.dimensions) throw new Error('A published image is missing its asset or dimensions.');
  const {width, height} = image.asset.metadata.dimensions;
  const crop = image.crop;
  const croppedWidth = Math.max(1, Math.round(width * (1 - (crop?.left ?? 0) - (crop?.right ?? 0))));
  const croppedHeight = Math.max(1, Math.round(height * (1 - (crop?.top ?? 0) - (crop?.bottom ?? 0))));
  const hotspot = image.hotspot;
  const x = hotspot ? Math.max(0, Math.min(1, (hotspot.x - (crop?.left ?? 0)) * width / croppedWidth)) : .5;
  const y = hotspot ? Math.max(0, Math.min(1, (hotspot.y - (crop?.top ?? 0)) * height / croppedHeight)) : .5;
  return {
    src: builder.image(image).auto('format').quality(85).url(),
    alt: image.alt || '', width: croppedWidth, height: croppedHeight,
    position: `${x * 100}% ${y * 100}%`,
  };
}
export function mediaFromSanity(media: SanityImage | SanityVideo) {
  if (media._type === 'portfolioVideo') {
    const video = media as SanityVideo;
    const url = new URL(video.asset.url);
    if (url.protocol !== 'https:' || url.hostname !== 'cdn.sanity.io' || !url.pathname.startsWith(`/files/${sanityProjectId}/${sanityDataset}/`)) throw new Error('Unexpected video asset URL.');
    return {kind: 'video' as const, src: url.href, alt: video.alt || '', poster: video.poster ? imageFromSanity(video.poster).src : undefined};
  }
  return {kind: 'image' as const, ...imageFromSanity(media as SanityImage)};
}
