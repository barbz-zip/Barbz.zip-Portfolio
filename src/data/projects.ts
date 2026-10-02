export interface ProjectPreview {
  id: string;
  slug: string;
  title: string;
  year: string;
  description: string;
  cover: { src: string; alt: string; crop?: 'gunga' | 'nursegrid' };
}

export interface CaseImage { src: string; alt: string }
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

// Local preview content. The future Sanity adapter returns this same contract.
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

export async function getProjects(): Promise<Project[]> {
  return projects.map((project): Project => ({
    ...project,
    caseStudy: project.id === 'nursegrid' ? nursegridCase : {
      services: project.description.replaceAll(' • ', ', '),
      paragraphs: ['(Case study in progress)'],
      credits: [],
      gallery: [{ key: 'opening', layout: 'single', orientation: 'landscape', images: [{ src: project.cover.src, alt: project.cover.alt }] }],
    },
  }));
}
