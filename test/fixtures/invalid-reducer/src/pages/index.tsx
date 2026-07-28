import { useReducer } from "@kudzujs/core"

function reducer(state: number, action: number) {
  return state + action
}

export default function InvalidReducerPage() {
  const [count, dispatch] = useReducer(reducer, 0)
  return <button onClick={() => dispatch(1)}>{count}</button>
}
