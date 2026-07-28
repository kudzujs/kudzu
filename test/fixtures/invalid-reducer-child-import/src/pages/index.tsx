import { useReducer } from "@kudzujs/core"
import { Controls } from "../Controls"
import { reducer } from "../reducer"

export default function InvalidReducerChildImportPage() {
  const [count, dispatch] = useReducer(reducer, 0)
  return <main><Controls dispatch={dispatch} />{count}</main>
}
