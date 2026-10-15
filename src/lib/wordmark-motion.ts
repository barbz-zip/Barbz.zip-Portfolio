export interface Axis { position: number; velocity: number; hit: boolean }

/** Reflect overshoot instead of losing distance at the viewport edge. */
export function advanceAxis(position: number, velocity: number, seconds: number, limit: number): Axis {
  if (limit <= 0) return { position: 0, velocity, hit: false };
  if (seconds <= 0) return { position: Math.max(0, Math.min(limit, position)), velocity, hit: false };
  const next = Math.max(0, Math.min(limit, position)) + velocity * seconds;
  if (next > 0 && next < limit) return { position: next, velocity, hit: false };
  const phase = ((next % (2 * limit)) + 2 * limit) % (2 * limit);
  const reflected = phase > limit ? 2 * limit - phase : phase;
  const direction = phase === 0 ? 1 : phase === limit ? -1 : phase < limit ? Math.sign(velocity) : -Math.sign(velocity);
  return { position: reflected, velocity: direction * Math.abs(velocity), hit: true };
}

export function pickFont(families: string[], current: string, random = Math.random): string | null {
  const choices = families.filter(family => family !== current);
  return choices.length ? choices[Math.min(choices.length - 1, Math.floor(random() * choices.length))] : null;
}
