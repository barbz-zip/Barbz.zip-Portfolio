export const DEFAULT_WORDMARK_COLOR = '#f8f3ee';
export const HEX_COLOR = /^#(?:[\da-f]{3}|[\da-f]{6})$/i;

export function wordmarkColor(value?: string): string {
  if (!value || !HEX_COLOR.test(value)) return DEFAULT_WORDMARK_COLOR;
  return value.length === 4 ? `#${[...value.slice(1)].map(char => char + char).join('')}` : value;
}
