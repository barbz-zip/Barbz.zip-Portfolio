import {defineType, defineField, defineArrayMember} from 'sanity';
import {ImageIcon} from '@sanity/icons/Image';
import {PlayIcon} from '@sanity/icons/Play';
import {validateGalleryRow} from '../validation.mjs';

export const portfolioImage = defineType({
  name: 'portfolioImage', title: 'Image', type: 'image', icon: ImageIcon,
  options: {hotspot: true},
  fields: [defineField({name: 'alt', title: 'Alternative text', type: 'string', validation: rule => rule.required()})],
  validation: rule => rule.assetRequired(),
});
export const portfolioVideo = defineType({
  name: 'portfolioVideo', title: 'Video', type: 'file', icon: PlayIcon,
  options: {accept: 'video/mp4,video/webm'},
  description: 'MP4 (H.264) or WebM. Videos play automatically, muted, in a loop, without controls.',
  fields: [
    defineField({name: 'alt', title: 'Video description', type: 'string', validation: rule => rule.required()}),
    defineField({name: 'poster', title: 'Poster image', type: 'portfolioImage', description: 'Shown while loading or if autoplay is unavailable.'}),
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
