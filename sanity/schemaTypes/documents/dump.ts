import {defineType, defineField} from 'sanity';
import {ImagesIcon} from '@sanity/icons/Images';
export const dumpItem = defineType({
  name: 'dumpItem', title: 'Dump image', type: 'document', icon: ImagesIcon,
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: rule => rule.required()}),
    defineField({name: 'image', title: 'Image', type: 'portfolioImage', validation: rule => rule.required()}),
    defineField({name: 'description', title: 'Description', type: 'text', validation: rule => rule.required()}),
    defineField({name: 'displayWidth', title: 'Desktop image width', type: 'number', description: 'Optional width in pixels for Scroll View. Proportions are preserved; mobile always fits the screen.', validation: rule => rule.positive().max(1400)}),
    defineField({name: 'order', title: 'Order in Scroll and Grid views', type: 'number', initialValue: 0, validation: rule => rule.required().integer().min(0)}),
  ],
  orderings: [{title: 'Website order', name: 'websiteOrder', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'title', subtitle: 'description', media: 'image'}},
});
