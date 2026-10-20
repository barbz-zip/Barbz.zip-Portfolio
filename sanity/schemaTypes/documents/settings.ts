import {defineType, defineField} from 'sanity';
import {CogIcon} from '@sanity/icons/Cog';

export const settings = defineType({
  name: 'settings', title: 'Settings', type: 'document', icon: CogIcon,
  groups: [{name: 'identity', title: 'Identity', default: true}, {name: 'sharing', title: 'Sharing'}, {name: 'seo', title: 'SEO'}],
  initialValue: {siteUrl: 'https://barbz-zip.github.io/Barbz.zip-Portfolio/', noIndex: false},
  fields: [
    defineField({name: 'favicon', title: 'Favicon', type: 'image', group: 'identity', options: {hotspot: true, accept: 'image/png,image/jpeg,image/webp,image/svg+xml'}, description: 'Choose or upload an image, preferably square. The site generates a PNG icon.'}),
    defineField({name: 'shareImage', title: 'Sharing image', type: 'portfolioImage', group: 'sharing', description: 'Image for WhatsApp, LinkedIn and other social platforms. Recommended size: 1200 × 630 px.'}),
    defineField({name: 'shareTitle', title: 'Sharing title', type: 'string', group: 'sharing', description: 'Optional. Uses the page title when empty.'}),
    defineField({name: 'shareDescription', title: 'Sharing description', type: 'text', rows: 3, group: 'sharing', description: 'Uses the SEO description when empty.'}),
    defineField({name: 'seoTitle', title: 'Home SEO title', type: 'string', group: 'seo', description: 'Optional. Overrides the Home browser tab title without changing the animated text.', validation: rule => rule.max(60).warning('Keep the title under 60 characters when possible.')}),
    defineField({name: 'seoDescription', title: 'SEO description', type: 'text', rows: 3, group: 'seo', description: 'A summary of the portfolio for search engines.', validation: rule => rule.max(160).warning('Keep the description under 160 characters when possible.')}),
    defineField({name: 'siteUrl', title: 'Public site URL', type: 'url', group: 'seo', description: 'Full address, including the project path when needed. Used for canonical URLs.', validation: rule => rule.required().uri({scheme: ['https', 'http']}).custom(value => {
      if (!value) return true;
      try {const url = new URL(value); return (!url.search && !url.hash && !url.username && !url.password) || 'Use the public URL without query parameters, fragments or credentials.';} catch {return 'Enter a valid URL.';}
    })}),
    defineField({name: 'noIndex', title: 'Hide from search engines', type: 'boolean', group: 'seo', initialValue: false, description: 'Adds a noindex directive to every page. This does not restrict access to the site.'}),
  ],
  preview: {prepare: () => ({title: 'SETTINGS', subtitle: 'Favicon, sharing and SEO'})},
});
