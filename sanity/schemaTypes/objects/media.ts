import {defineType, defineField, defineArrayMember} from 'sanity';
import {ImageIcon} from '@sanity/icons/Image';
import {PlayIcon} from '@sanity/icons/Play';
import {validateGalleryRow} from '../validation.mjs';

const generatedAlt = defineField({
  name: 'generatedAlt', type: 'object', hidden: true,
  fields: [defineField({name: 'source', type: 'string'}), defineField({name: 'text', type: 'string'})],
});
const altField = defineField({
  name: 'alt', title: 'Alternative text', type: 'string',
  description: 'Generated from the artwork and editorial context. You can edit this text.',
  validation: rule => rule.required(),
});

export const portfolioImage = defineType({
  name: 'portfolioImage', title: 'Image', type: 'image', icon: ImageIcon,
  options: {hotspot: true},
  fields: [altField, generatedAlt],
  validation: rule => rule.assetRequired(),
});
export const portfolioVideo = defineType({
  name: 'portfolioVideo', title: 'Video', type: 'file', icon: PlayIcon,
  options: {accept: 'video/mp4,video/webm'},
  description: 'MP4 (H.264) or WebM. Videos play automatically, muted, in a loop, without controls.',
  fields: [
    altField, generatedAlt,
    defineField({name: 'generatedPoster', type: 'object', hidden: true, fields: [
      defineField({name: 'source', type: 'string'}), defineField({name: 'assetId', type: 'string'}),
    ]}),
    defineField({name: 'poster', title: 'Poster image', type: 'portfolioImage', description: 'Created from the first frame. You can replace it with another image.'}),
  ],
  validation: rule => rule.assetRequired(),
});
export const galleryRow = defineType({
  name: 'galleryRow', title: 'Media row', type: 'object', icon: ImageIcon,
  initialValue: {layout: 'single', orientation: 'original'},
  validation: rule => rule.custom(validateGalleryRow),
  fields: [
    defineField({name: 'layout', title: 'Arrangement', type: 'string', options: {layout: 'radio', list: [{title: 'One media item', value: 'single'}, {title: 'Two side by side', value: 'pair'}]}, validation: rule => rule.required()}),
    defineField({name: 'orientation', title: 'Framing', type: 'string', options: {list: [{title: 'Original proportions', value: 'original'}, {title: 'Portrait', value: 'portrait'}, {title: 'Landscape', value: 'landscape'}]}, validation: rule => rule.required()}),
    defineField({name: 'images', title: 'Images and videos', type: 'array', description: 'Upload one or two files. Drag to reorder; rows can mix images and videos.', of: [defineArrayMember({type: 'portfolioImage'}), defineArrayMember({type: 'portfolioVideo'})], validation: rule => rule.required().min(1).max(2)}),
  ],
  preview: {select: {layout: 'layout', orientation: 'orientation', media: 'images.0'}, prepare: ({layout, orientation, media}) => ({title: layout === 'pair' ? 'Two side by side' : 'One media item', subtitle: orientation, media: media?._type === 'portfolioVideo' ? PlayIcon : media})},
});
