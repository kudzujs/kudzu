import { useReducer } from "react"
import { reducer } from "../reducer"

const suffix = "!"

export default function Page() {
  const [state] = useReducer(reducer, "initial", value => ({ value: value + suffix }))
  return <main>{state.value}</main>
}
