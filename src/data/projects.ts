import {sanityClient, useLocalContent} from '../lib/cms/client.ts';
import {projectsQuery} from '../lib/cms/queries.ts';
import {imageFromSanity, mediaFromSanity, type SanityImage, type SanityVideo} from '../lib/cms/media.ts';
import {validateGalleryRow, validateProjectSlug} from '../../sanity/schemaTypes/validation.mjs';
export interface ProjectPreview {
  id: string;
  slug: string;
  title: string;
  year: string;
  description: string;
  cover: { src: string; alt: string; position?: string; crop?: 'gunga' | 'nursegrid' };
}

export interface CaseImage { src: string; alt: string; kind?: 'image' | 'video'; poster?: string; width?: number; height?: number; position?: string }
export type GalleryRow = {
  key: string;
  orientation: 'landscape' | 'portrait' | 'original';
} & ({ layout: 'single'; images: [CaseImage] } | { layout: 'pair'; images: [CaseImage, CaseImage] });

export interface CaseStudy {
  services: string;
  paragraphs: string[];
  credits: Array<{ role: string; name: string }>;
  gallery: GalleryRow[];
}
export interface Project extends ProjectPreview { caseStudy: CaseStudy }

// Local fixtures are also used for the initial CMS import.
// Each project is stored once; the gallery creates only presentation copies.
const projects: ProjectPreview[] = [
  { id: 'chelsea', slug: 'chelsea-film-festival', title: 'Chelsea Film Festival', year: '2025', description: 'Graphic Design • Typography', cover: { src: '/images/projects/chelsea.png', alt: 'Chelsea Film Festival, white typography over a black and pink texture.' } },
  { id: 'gunga-web', slug: 'ginga', title: 'Ginga', year: '2025', description: 'Creative Direction • Graphic Design', cover: { src: '/images/projects/gunga-web.png', alt: 'Ginga identity displayed on a television on a wooden cabinet.' } },
  { id: 'nursegrid', slug: 'nursegrid', title: 'Nursegrid Recap', year: '2025', description: 'Graphic Design • 2025 Recap', cover: { src: '/images/projects/nursegrid.png', alt: 'Nursegrid 2025 recap, colorful geometric numbers on a blue background.', crop: 'nursegrid' } },
  { id: 'gunga', slug: 'gunga', title: 'Gunga', year: '2025', description: 'Visual Identity • Graphic Design', cover: { src: '/images/projects/gunga.png', alt: 'Gunga identity, a circular typographic composition in pink, green and black.', crop: 'gunga' } },
  { id: 'fruittella', slug: 'fruittella', title: 'Fruittella', year: '2025', description: 'Graphic Design • Lettering', cover: { src: '/images/projects/pink.png', alt: 'Fruittella, red three-dimensional lettering on a pink background.' } },
];

const nursegridCover: CaseImage = { src: '/images/projects/nursegrid.png', alt: 'Nursegrid 2025 Recap, blue visual identity with colorful geometric numbers.' };
const nursegridVertical: CaseImage = { src: '/images/projects/nursegrid-vertical.png', alt: 'Nursegrid Recap graphic composition in purple, blue and yellow.' };

const nursegridCase: CaseStudy = {
  services: 'Art Direction, Campaign Visual Identity, Motion Graphics',
  paragraphs: [
    '(Case study in progress)',
    'This page currently includes the motion work I’ve completed so far for Nursegrid’s 2025 Recap, an end-of-year “Wrapped”-style experience for nurses. Nursegrid is a workforce platform built for nurses, and this recap reached 600K+ users. I worked as the motion & brand designer, defining the visual system and bringing it to life through animation, in close collaboration with product designers and the dev team.',
  ],
  credits: [],
  gallery: [
    { key: 'opening', layout: 'single', orientation: 'landscape', images: [nursegridCover] },
    { key: 'details', layout: 'pair', orientation: 'portrait', images: [nursegridVertical, nursegridVertical] },
    { key: 'recap', layout: 'single', orientation: 'landscape', images: [nursegridCover] },
    { key: 'details-ending', layout: 'pair', orientation: 'portrait', images: [nursegridVertical, nursegridVertical] },
  ],
};

export async function getLocalProjects(): Promise<Project[]> {
  return projects.map((project): Project => ({
    ...project,
    caseStudy: project.id === 'nursegrid' ? nursegridCase : {
      services: project.description.replaceAll(' • ', ', '),
      paragraphs: ['(Case study in progress)'],
      credits: [],
      gallery: [{ key: 'opening', layout: 'single', orientation: 'landscape', images: [{ src: project.cover.src, alt: project.cover.alt }] }],
    },
  })).sort((a, b) => b.year.localeCompare(a.year) || a.title.localeCompare(b.title, 'en') || a.id.localeCompare(b.id));
}

interface CmsProject {
  _id: string; title: string; slug: string; year: string; description: string; cover: SanityImage;
  caseStudy: {services?: string; paragraphs?: string[]; credits?: CaseStudy['credits'];
    gallery: Array<{_key: string; layout: GalleryRow['layout']; orientation: GalleryRow['orientation']; images: Array<SanityImage | SanityVideo>}>};
}
export async function getProjects(): Promise<Project[]> {
  if (useLocalContent()) return getLocalProjects();
  const documents = await sanityClient.fetch<CmsProject[]>(projectsQuery);
  const slugs = new Set<string>();
  return documents.map(doc => {
    if (validateProjectSlug({current: doc.slug}) !== true || slugs.has(doc.slug)) throw new Error(`Invalid or duplicate project URL: ${doc.slug}`);
    slugs.add(doc.slug);
    const detail = doc.caseStudy;
    const gallery = (detail?.gallery || []).map(row => {
      if (validateGalleryRow(row) !== true) throw new Error(`Invalid gallery row in ${doc.title}`);
      return {key: row._key, layout: row.layout, orientation: row.orientation, images: row.images.map(mediaFromSanity)} as GalleryRow;
    });
    return {id: doc._id, slug: doc.slug, title: doc.title, year: doc.year, description: doc.description,
      cover: imageFromSanity(doc.cover), caseStudy: {services: detail?.services || '', paragraphs: detail?.paragraphs || [], credits: detail?.credits || [], gallery}};
  });
}
