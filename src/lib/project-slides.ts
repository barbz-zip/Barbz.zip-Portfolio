import type { Project, CaseImage } from '../data/projects';

export function projectSlides(project: Project): CaseImage[] {
  const seen = new Set<string>();
  const slides: CaseImage[] = [];
  for (const row of project.caseStudy.gallery) {
    for (const media of row.images) {
      if (seen.has(media.src)) continue;
      // Sanity images include cropped dimensions. Videos are measured when their metadata loads.
      if (media.kind !== 'video') {
        const landscape = media.width && media.height ? media.width > media.height : row.orientation === 'landscape';
        if (!landscape) continue;
      }
      seen.add(media.src);
      slides.push(media);
    }
  }
  return slides;
}
