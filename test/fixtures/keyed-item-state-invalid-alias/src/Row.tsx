import { useState } from "@kudzujs/core"
import type { Action, Item } from "./reducer"

export function Row({ item, dispatch }: { item: Item; dispatch: (action: Action) => void }) {
  const initial = item
  const [draft] = useState(initial)
  return <li><button onClick={() => dispatch({ type: "rename", id: item.id, title: draft.title })}>{item.title}</button></li>
}
