import { useState } from "react"
import useDebounce from "./useDebounce"

export function Search() {
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebounce(query, 80)
  return <section id="search">
    <input id="query" value={query} onInput={event => setQuery(event.currentTarget.value)} />
    <output id="debounced">{debouncedQuery}</output>
  </section>
}
