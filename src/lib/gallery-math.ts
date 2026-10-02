/** Stable in both directions, including large trackpad deltas. */
export function wrap(value: number, length: number): number {
  return length > 0 ? ((value % length) + length) % length : 0;
}

export function copiesFor(viewport: number, cycle: number): number {
  return cycle > 0 ? Math.max(3, Math.ceil(viewport / cycle) + 2) : 1;
}
