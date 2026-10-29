import {ColorInput} from '../../components/ColorInput';
import {DEFAULT_WORDMARK_COLOR, HEX_COLOR} from '../../../src/lib/wordmark-color';
import {defineType, defineField, defineArrayMember} from 'sanity';
import {HomeIcon} from '@sanity/icons/Home';
import homeFonts from '../../../src/data/home-fonts.mjs';
import {googleFontFamily, validateFontLinks} from '../../../src/lib/google-fonts.mjs';

export const home = defineType({
  name: 'home', title: 'Home', type: 'document', icon: HomeIcon,
  initialValue: {siteTitle: 'barbz.zip', footerText: 'graphic design and etc.', fonts: homeFonts, wordmarkColor: DEFAULT_WORDMARK_COLOR},
  fields: [
    defineField({name: 'siteTitle', title: 'Site title / animated text', type: 'string', description: 'The title on the home browser tab and the bouncing text.', validation: rule => rule.required().max(60)}),
    defineField({name: 'wordmarkColor', title: 'Animated text color', type: 'string', initialValue: DEFAULT_WORDMARK_COLOR, description: 'Color of the bouncing text behind the Home gallery. Choose a color or enter a HEX value. Default: #f8f3ee.', components: {input: ColorInput}, validation: rule => rule.custom(value => !value || HEX_COLOR.test(value) ? true : 'Enter a HEX color such as #f8f3ee or #fff.')}),
    defineField({name: 'footerText', title: 'Bottom-center text', type: 'string', validation: rule => rule.required()}),
    defineField({name: 'email', title: 'Contact email', type: 'string', description: 'Copied when the contact icon is clicked. Leave empty to disable.', validation: rule => rule.email()}),
    defineField({name: 'readUrl', title: 'Read — external link', type: 'url', description: 'Opens in a new tab. Leave empty to disable.', validation: rule => rule.uri({scheme: ['https', 'http']})}),
    defineField({name: 'fonts', title: 'Google Fonts links', type: 'array', description: 'Paste one Google Fonts family link per entry. Fonts load on demand for the animated text.', of: [defineArrayMember({type: 'url', validation: rule => rule.required().custom(value => googleFontFamily(value) ? true : 'Enter a Google Fonts link for one font family.')})], validation: rule => rule.required().min(1).custom(validateFontLinks)}),
  ],
  preview: {prepare: () => ({title: 'HOME', subtitle: 'Text, typography and menu links'})},
});
