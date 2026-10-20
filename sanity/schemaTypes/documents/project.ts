import {defineType, defineField, defineArrayMember} from 'sanity';
import {DocumentIcon} from '@sanity/icons/Document';
import {validateProjectSlug} from '../validation.mjs';
export const project = defineType({
  name: 'project', title: 'Project', type: 'document', icon: DocumentIcon,
  fields: [
    defineField({name: 'title', title: 'Project name', type: 'string', validation: rule => rule.required()}),
    defineField({name: 'slug', title: 'URL', type: 'slug', options: {source: 'title', maxLength: 96}, validation: rule => rule.required().custom(validateProjectSlug)}),
    defineField({name: 'year', title: 'Year', type: 'string', description: 'Projects appear from newest to oldest. Same-year projects sort alphabetically.', validation: rule => rule.required().regex(/^\d{4}$/, {name: 'four-digit year'})}),
    defineField({name: 'description', title: 'Attributes / short description', type: 'string', description: 'Shared by the home pop-up and the index list.', validation: rule => rule.required()}),
    defineField({name: 'cover', title: 'Cover image', type: 'portfolioImage', validation: rule => rule.required()}),
    defineField({name: 'order', title: 'Legacy order', type: 'number', hidden: true, readOnly: true, deprecated: {reason: 'Projects are now sorted by year. Retained only for existing documents.'}}),
    defineField({name: 'caseStudy', title: 'Project page', type: 'object', fields: [
      defineField({name: 'services', title: 'Services', type: 'string'}),
      defineField({name: 'paragraphs', title: 'Description paragraphs', type: 'array', of: [defineArrayMember({type: 'text'})]}),
      defineField({name: 'credits', title: 'Credits', type: 'array', of: [defineArrayMember({type: 'object', name: 'credit', fields: [defineField({name: 'role', type: 'string', validation: rule => rule.required()}), defineField({name: 'name', type: 'string', validation: rule => rule.required()})], preview: {select: {title: 'name', subtitle: 'role'}}})]}),
      defineField({name: 'gallery', title: 'Gallery', description: 'Drag rows to reorder. Each row holds one or two images/videos, with independent framing.', type: 'array', of: [defineArrayMember({type: 'galleryRow'})], validation: rule => rule.required().min(1)}),
    ], validation: rule => rule.required()}),
  ],
  orderings: [{title: 'Year — newest first', name: 'yearDescending', by: [{field: 'year', direction: 'desc'}, {field: 'title', direction: 'asc'}, {field: '_id', direction: 'asc'}]}],
  preview: {select: {title: 'title', subtitle: 'description', media: 'cover'}},
});
