import { initGallery } from './gallery';
import { initProjectDialog } from './project-dialog';
import { initCaseStudy } from './case-study';
import { initMenu } from './menu';
import { initProjectIndex } from './project-index';
import { prepareProjectReturn, rememberProjectReturn, restoreProjectReturn } from './project-return';

let cleanups: Array<() => void> = [];

function cleanupPage() {
  cleanups.forEach(cleanup => cleanup());
  cleanups = [];
}

document.addEventListener('astro:before-swap', event => {
  prepareProjectReturn(event);
  cleanupPage();
});
document.addEventListener('astro:after-swap', rememberProjectReturn);
document.addEventListener('astro:page-load', () => {
  cleanupPage();
  document.querySelectorAll<HTMLElement>('.menu').forEach(menu => cleanups.push(initMenu(menu)));
  document.querySelectorAll<HTMLElement>('[data-gallery]').forEach(root => {
    const cleanup = initGallery(root);
    if (cleanup) cleanups.push(cleanup);
  });
  if (document.querySelector('[data-project-dialog]')) cleanups.push(initProjectDialog());
  const page = document.querySelector<HTMLElement>('[data-case-study]');
  if (page) {
    restoreProjectReturn(page);
    cleanups.push(initCaseStudy(page));
  }
  const index = document.querySelector<HTMLElement>('[data-project-index]');
  if (index) cleanups.push(initProjectIndex(index));
});
