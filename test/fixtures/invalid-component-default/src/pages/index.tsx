import { useReducer } from "@kudzujs/core"
import { reducer } from "../reducer"

function Controls({ dispatch, editing = Boolean(false) }: { dispatch: (action: unknown) => void; editing?: boolean }) {
  return <button onClick={() => dispatch(editing)}>Invalid</button>
}

export default function InvalidComponentDefaultPage() {
  const [count, dispatch] = useReducer(reducer, 0)
  return <main><Controls dispatch={dispatch} />{count}</main>
}
