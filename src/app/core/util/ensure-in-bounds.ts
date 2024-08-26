export function ensureInBounds(value: number, boundValue: number): number {
  return value ? (value < boundValue ? value : boundValue) : boundValue;
}
