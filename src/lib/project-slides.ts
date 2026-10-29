import type { Project, CaseImage } from '../data/projects';

/** Use the case study order, with a cover fallback for projects without stills. */
export function projectSlides(project: Project): CaseImage[] {
  const seen = new Set<string>();
  const images = project.caseStudy.gallery.flatMap(row => row.images).filter(image => {
    if (image.kind === 'video' || seen.has(image.src)) return false;
    seen.add(image.src);
    return true;
  });
  return images.length ? images : [project.cover];
}
