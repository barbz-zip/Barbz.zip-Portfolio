import {defineType, defineField, defineArrayMember} from 'sanity';
import {UserIcon} from '@sanity/icons/User';
const linkFields = [
  defineField({name: 'title', title: 'Text', type: 'string', validation: rule => rule.required()}),
  defineField({name: 'href', title: 'Link', type: 'url', validation: rule => rule.uri({scheme: ['http', 'https']})}),
];
export const about = defineType({
  name: 'about', title: 'About', type: 'document', icon: UserIcon,
  fields: [
    defineField({name: 'name', type: 'string', validation: rule => rule.required()}),
    defineField({name: 'caption', title: 'Portrait caption', type: 'string'}),
    defineField({name: 'portrait', type: 'portfolioImage', validation: rule => rule.required()}),
    defineField({name: 'biography', title: 'Biography paragraphs', type: 'array', of: [defineArrayMember({type: 'text'})], validation: rule => rule.required().min(1)}),
    defineField({name: 'recognitionsTitle', title: 'Recognitions heading', type: 'string', initialValue: 'Recognitions'}),
    defineField({name: 'recognitions', type: 'array', of: [defineArrayMember({name: 'recognition', type: 'object', fields: [defineField({name: 'icon', title: 'Emoji', type: 'string'}), ...linkFields], preview: {select: {title: 'title'}}})]}),
    defineField({name: 'pressTitle', title: 'Press heading', type: 'string', initialValue: 'Press'}),
    defineField({name: 'press', type: 'array', of: [defineArrayMember({name: 'pressLink', type: 'object', fields: [...linkFields, defineField({name: 'continuation', title: 'Additional link', type: 'object', fields: linkFields})], preview: {select: {title: 'title'}}})]}),
  ],
  preview: {select: {title: 'name', media: 'portrait'}},
});
