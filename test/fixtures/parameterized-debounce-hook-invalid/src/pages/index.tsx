import { useState } from "react"
import useDebounce from "../useDebounce"

export default function Page() {
  const [query, setQuery] = useState("")
  const [delay] = useState(80)
  const debouncedQuery = useDebounce(query, delay)
  return <button onClick={() => setQuery("next")}>{debouncedQuery}</button>
}
