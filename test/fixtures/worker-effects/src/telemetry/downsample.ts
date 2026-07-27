export function downsample(values: number[], points: number) {
  if (values.length <= points) return values
  const width = values.length / points
  return Array.from({ length: points }, (_, index) => values[Math.min(values.length - 1, Math.floor(index * width))])
}
