import { useReducer } from "@kudzujs/core"
import { Row } from "../Row"
import { reducer } from "../reducer"

export default function Page() {
  const [items, dispatch] = useReducer(reducer, [{ id: 1, title: "First" }])
  return <ul>{items.map(item => <Row key={item.id} item={item} dispatch={dispatch} />)}</ul>
}
