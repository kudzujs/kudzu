const includeVisible = true

export function selectVisible<T extends { visible: boolean }>(items: T[]) {
  return items.filter(item => item.visible === includeVisible)
}
