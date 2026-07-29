import { useReducer, useState } from "@kudzujs/core"
import { reducer } from "../reducer"

function Controls({ dispatch }: { dispatch: (action: unknown) => void }) {
  const [active, setActive] = useState(false)
  return <button className={active ? "active" : ""} onClick={() => {
    setActive(true)
    dispatch(null)
  }}>Invalid</button>
}

export default function InvalidReducerRowStatePage() {
  const [count, dispatch] = useReducer(reducer, 0)
  return <main><Controls dispatch={dispatch} />{count}</main>
}
