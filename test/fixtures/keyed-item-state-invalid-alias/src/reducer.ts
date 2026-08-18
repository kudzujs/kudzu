export type Item = { id: number; title: string }
export type Action = { type: "rename"; id: number; title: string }

export function reducer(items: Item[], action: Action) {
  return action.type === "rename" ? items.map(item => item.id === action.id ? { ...item, title: action.title } : item) : items
}
