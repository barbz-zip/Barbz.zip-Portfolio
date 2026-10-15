const SVG_NS = 'http://www.w3.org/2000/svg';
const WIDTH = 1454.16;
const HEIGHT = 384.34;
const CELL = 40;

/** Keep the original vector, replacing only cells close to the pointer. */
export function initPixelWordmark(root: HTMLElement) {
  const source = root.querySelector<HTMLImageElement>('img')!;
  const overlay = root.querySelector<SVGSVGElement>('.dump-pixels')!;
  const controller = new AbortController();
  const { signal } = controller;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let ready = false;
  let hovered = false;
  let frame = 0;
  let previousTime = 0;
  let amount = 0;
  let pointerX = 0;
  let pointerY = 0;
  let radius = 100;
  const cells: Array<{ x: number; y: number; mask: SVGRectElement; tile?: SVGRectElement }> = [];

  function svgElement<K extends keyof SVGElementTagNameMap>(tag: K, attributes: Record<string, string | number>) {
    const element = document.createElementNS(SVG_NS, tag);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
    return element;
  }

  function prepare() {
    if (ready || signal.aborted || !source.naturalWidth) return;
    // Read alpha once to identify the letter strokes. The visible effect uses SVG rectangles.
    const sample = document.createElement('canvas');
    sample.width = Math.ceil(WIDTH);
    sample.height = Math.ceil(HEIGHT);
    const context = sample.getContext('2d', { willReadFrequently: true });
    if (!context) return;
    context.drawImage(source, 0, 0, WIDTH, HEIGHT);
    const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
    const defs = svgElement('defs', {});
    const mask = svgElement('mask', { id: 'barbz-zip-local-pixels', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: WIDTH, height: HEIGHT });
    mask.append(svgElement('rect', { width: WIDTH, height: HEIGHT, fill: 'white' }));
    defs.append(mask);
    const original = svgElement('image', { href: source.currentSrc || source.src, width: WIDTH, height: HEIGHT, mask: 'url(#barbz-zip-local-pixels)' });
    const tiles = svgElement('g', { fill: 'white', opacity: .5 });
    for (let y = 0; y < HEIGHT; y += CELL) {
      for (let x = 0; x < WIDTH; x += CELL) {
        const width = Math.min(CELL, WIDTH - x);
        const height = Math.min(CELL, HEIGHT - y);
        let occupied = 0;
        let count = 0;
        for (let sy = y + 2; sy < y + height; sy += 4) {
          for (let sx = x + 2; sx < x + width; sx += 4) {
            if (pixels[(Math.floor(sy) * sample.width + Math.floor(sx)) * 4 + 3] > 32) occupied++;
            count++;
          }
        }
        // Leave empty space untouched, and quantize only the actual letter shape.
        if (!occupied) continue;
        const cutout = svgElement('rect', { x, y, width, height, fill: 'black', opacity: 0 });
        mask.append(cutout);
        const tile = occupied / count >= .28
          ? svgElement('rect', { x, y, width, height, opacity: 0 }) : undefined;
        if (tile) tiles.append(tile);
        cells.push({ x: x + width / 2, y: y + height / 2, mask: cutout, tile });
      }
    }
    overlay.replaceChildren(defs, original, tiles);
    ready = true;
    if (hovered) schedule();
  }

  function draw() {
    root.toggleAttribute('data-pixelated', amount > .001);
    for (const cell of cells) {
      const distance = Math.hypot(cell.x - pointerX, cell.y - pointerY);
      const strength = distance < radius * amount ? 1 : 0;
      cell.mask.setAttribute('opacity', String(strength));
      cell.tile?.setAttribute('opacity', String(strength));
    }
  }
  function animate(time: number) {
    frame = 0;
    const elapsed = previousTime ? Math.min(time - previousTime, 50) : 16;
    previousTime = time;
    const target = hovered && !reduced.matches ? 1 : 0;
    amount += (target - amount) * (1 - Math.exp(-elapsed / 85));
    if (Math.abs(target - amount) < .001) amount = target;
    draw();
    if (amount !== target) frame = requestAnimationFrame(animate);
    else previousTime = 0;
  }
  function schedule() {
    if (ready && !signal.aborted && !frame) frame = requestAnimationFrame(animate);
  }
  function leave() { hovered = false; schedule(); }
  root.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || reduced.matches) return;
    const rect = root.getBoundingClientRect();
    pointerX = (event.clientX - rect.left) * WIDTH / rect.width;
    pointerY = (event.clientY - rect.top) * HEIGHT / rect.height;
    radius = 95 * WIDTH / rect.width;
    hovered = true;
    if (!ready) prepare();
    schedule();
  }, { signal });
  root.addEventListener('pointerleave', leave, { signal });
  window.addEventListener('blur', leave, { signal });
  document.addEventListener('visibilitychange', leave, { signal });
  reduced.addEventListener('change', () => {
    hovered = false;
    amount = 0;
    cancelAnimationFrame(frame);
    frame = previousTime = 0;
    draw();
  }, { signal });
  source.addEventListener('load', () => { if (hovered) prepare(); }, { signal });
  return () => {
    controller.abort();
    cancelAnimationFrame(frame);
    delete root.dataset.pixelated;
    overlay.replaceChildren();
  };
}
