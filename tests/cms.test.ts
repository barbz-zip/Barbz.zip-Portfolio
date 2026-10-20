import test from 'node:test';
import assert from 'node:assert/strict';
import {validateProjectSlug, validateGalleryRow} from '../sanity/schemaTypes/validation.mjs';
import {imageFromSanity, mediaFromSanity, type SanityImage} from '../src/lib/cms/media.ts';

const image: SanityImage = {
  _type: 'portfolioImage', alt: 'Transparent artwork',
  asset: {_id: 'image-0123456789012345678901234567890123456789-1000x800-png', url: 'https://cdn.sanity.io/images/uc4d6vam/production/0123456789012345678901234567890123456789-1000x800.png', metadata: {dimensions: {width: 1000, height: 800}}},
  crop: {top: .1, bottom: .1, left: .2, right: .2},
};
test('CMS image URLs retain editable crop and correct intrinsic proportions', () => {
  const result = imageFromSanity(image);
  assert.equal(result.width, 600);
  assert.equal(result.height, 640);
  const url = new URL(result.src);
  assert.equal(url.searchParams.get('rect'), '200,80,600,640');
  assert.equal(url.searchParams.get('auto'), 'format');
  assert.equal(url.searchParams.has('bg'), false, 'PNG transparency is preserved');
});
test('CMS supports mixed media and optional video posters', () => {
  const video = {_type: 'portfolioVideo' as const, alt: 'Motion study', asset: {_id: 'file-test-mp4', url: 'https://cdn.sanity.io/files/uc4d6vam/production/test.mp4', mimeType: 'video/mp4'}};
  const mapped = mediaFromSanity(video);
  assert.equal(mapped.kind, 'video');
  assert.equal(mapped.src, video.asset.url);
  assert.equal(mediaFromSanity({...video, poster: image}).poster, imageFromSanity(image).src);
  assert.equal(validateGalleryRow({layout: 'pair', orientation: 'original', images: [image, video]}), true);
  assert.throws(() => mediaFromSanity({...video, asset: {...video.asset, url: 'https://example.com/video.mp4'}}));
});
test('CMS slugs cannot shadow pages or escape the project route', () => {
  for (const current of ['about', 'dump', 'index', 'studio', '../home', 'two/parts', 'Uppercase']) assert.notEqual(validateProjectSlug({current}), true);
  assert.equal(validateProjectSlug({current: 'nursegrid-2026'}), true);
});

test('canonical URLs support project subfolders and custom domains', async () => {
  const {canonicalUrl} = await import('../src/lib/seo.ts');
  assert.equal(canonicalUrl('https://barbz-zip.github.io/Barbz.zip-Portfolio', '/index/'), 'https://barbz-zip.github.io/Barbz.zip-Portfolio/index/');
  assert.equal(canonicalUrl('https://barbz.zip/', '/'), 'https://barbz.zip/');
  assert.equal(canonicalUrl('https://barbz.zip', '/nursegrid/'), 'https://barbz.zip/nursegrid/');
  assert.throws(() => canonicalUrl('javascript:alert(1)', '/'));
});
test('metadata images have social-compatible formats and explicit dimensions', async () => {
  const {metadataImageUrl} = await import('../src/lib/cms/media.ts');
  const favicon = new URL(metadataImageUrl(image, 'favicon'));
  const share = new URL(metadataImageUrl(image, 'sharing'));
  assert.equal(favicon.searchParams.get('fm'), 'png');
  assert.equal(favicon.searchParams.get('w'), '64');
  assert.equal(share.searchParams.get('fm'), 'jpg');
  assert.equal(share.searchParams.get('w'), '1200');
  assert.equal(share.searchParams.get('h'), '630');
});
