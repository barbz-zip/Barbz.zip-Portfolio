import { initGallery } from './gallery';
import { initProjectDialog } from './project-dialog';
import { initCaseStudy } from './case-study';
import { initMenu } from './menu';
import { initProjectIndex } from './project-index';
import { prepareProjectReturn, rememberProjectReturn, restoreProjectReturn } from './project-return';

let cleanups: Array<() => void> = [];
let activeMenu: HTMLElement | null = null;
let cleanupMenu: (() => void) | undefined;

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
  // The header persists across routes, including its indicator and listeners.
  const menu = document.querySelector<HTMLElement>('.menu');
  if (menu !== activeMenu) {
    cleanupMenu?.();
    activeMenu = menu;
    cleanupMenu = menu ? initMenu(menu) : undefined;
  }
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
