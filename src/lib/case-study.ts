export function initCaseStudy(page: HTMLElement) {
  const controller = new AbortController();
  const { signal } = controller;
  const toggle = page.querySelector<HTMLButtonElement>('[data-expand-case]')!;
  const label = toggle.querySelector<HTMLElement>('[data-expand-label]')!;
  const sidebar = page.querySelector<HTMLElement>('[data-case-sidebar]')!;
  const mobile = window.matchMedia('(max-width: 800px)');
  let expanded = false;

  function setExpanded(value: boolean) {
    expanded = value && !mobile.matches;
    page.classList.toggle('is-expanded', expanded);
    sidebar.inert = expanded;
    sidebar.setAttribute('aria-hidden', String(expanded));
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.setAttribute('aria-label', expanded ? 'Show project description' : 'Expand project images');
    label.textContent = expanded ? 'Description' : 'full screen';
  }
  toggle.addEventListener('click', () => setExpanded(!expanded), { signal });
  mobile.addEventListener('change', () => { if (mobile.matches) setExpanded(false); }, { signal });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && expanded) setExpanded(false); }, { signal });
  return () => controller.abort();
}
