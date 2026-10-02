import type { TransitionBeforeSwapEvent } from 'astro:transitions/client';

import { sitePath, localPath } from './paths';

const RETURN_KEY = 'barbz-zip:return-to';

function returnPath(path: unknown) {
  const local = typeof path === 'string' ? localPath(path) : '/';
  return sitePath(local === '/index' || local === '/index/' ? '/index/' : '/');
}

export function prepareProjectReturn(event: TransitionBeforeSwapEvent) {
  const back = event.newDocument.querySelector<HTMLAnchorElement>('.case-back');
  if (!back) return;
  back.setAttribute('href', returnPath(event.navigationType === 'traverse'
    ? history.state?.[RETURN_KEY]
    : event.from.pathname));
}

export function rememberProjectReturn() {
  const back = document.querySelector<HTMLAnchorElement>('.case-back');
  if (back) history.replaceState({ ...history.state, [RETURN_KEY]: back.getAttribute('href') }, '');
}

export function restoreProjectReturn(page: HTMLElement) {
  const back = page.querySelector<HTMLAnchorElement>('.case-back');
  if (!back) return;
  let origin = history.state?.[RETURN_KEY];
  // New tabs use the referrer; reloads and history traversal keep their own entry.
  if (origin === undefined && document.referrer) {
    const referrer = new URL(document.referrer);
    if (referrer.origin === location.origin) origin = referrer.pathname;
  }
  back.setAttribute('href', returnPath(origin));
  rememberProjectReturn();
}
