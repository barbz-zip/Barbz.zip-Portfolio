/** Enlarge at the viewport center and recede toward either edge. */
export function dumpImagePresence(center: number, viewportHeight: number, imageHeight: number) {
  const range = Math.max(1, (viewportHeight + imageHeight) / 2);
  const proximity = 1 - Math.min(1, Math.abs(center - viewportHeight / 2) / range);
  const eased = proximity * proximity * (3 - 2 * proximity);
  return { scale: .55 + (1.12 - .55) * eased, brightness: .35 + .65 * eased };
}
