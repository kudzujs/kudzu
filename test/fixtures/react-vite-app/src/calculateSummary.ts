export function calculateSummary(value: number, multiplier: number) {
  return { total: value * multiplier, remaining: Math.max(0, 20 - value) }
}
