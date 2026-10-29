import {defineQuery} from 'groq';
const image = `alt, crop, hotspot, asset->{_id, url, metadata{dimensions{width, height}}}`;
export const homeQuery = defineQuery(`*[_id == "home"][0]{siteTitle, footerText, email, readUrl, fonts, wordmarkColor}`);
export const projectsQuery = defineQuery(`*[_type == "project"] | order(year desc, title asc, _id asc){
  _id, title, "slug": slug.current, year, description, cover{${image}},
  caseStudy{services, paragraphs, credits[]{role, name}, gallery[]{_key, layout, orientation,
    images[]{_type, ${image}, poster{${image}}}
  }}
}`);
export const aboutQuery = defineQuery(`*[_id == "about"][0]{name, caption, portrait{${image}}, biography, recognitionsTitle, pressTitle, recognitions[]{icon,title,href}, press[]{title,href,continuation{title,href}}}`);
export const dumpQuery = defineQuery(`*[_type == "dumpItem"] | order(order asc, _createdAt asc){_id, title, description, displayWidth, image{${image}}}`);

export const settingsQuery = defineQuery(`*[_id == "settings"][0]{seoTitle, seoDescription, siteUrl, noIndex, shareTitle, shareDescription, favicon{${image}}, shareImage{${image}}}`);
