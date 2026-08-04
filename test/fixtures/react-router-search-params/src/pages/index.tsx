import { useEffect } from "@kudzujs/core"
import { Link, useSearchParams as useQuery } from "react-router-dom"

export default function Page() {
  const [searchParams] = useQuery()
  const query = searchParams.get("q")
  const empty = searchParams.get("empty")
  const missing = searchParams.get("missing")
  const duplicate = searchParams.get("dup")
  const encoded = searchParams.get("encoded")

  useEffect(() => {
    document.body.dataset.effectQuery = `${query}|${empty}|${missing}|${duplicate}|${encoded}`
  }, [query, empty, missing, duplicate, encoded])

  function mark() {
    document.body.dataset.eventQuery = `${query}|${empty}|${missing}|${duplicate}|${encoded}`
  }

  return <main data-query={query} data-empty={empty} data-missing={missing} data-encoded={encoded}>
    <p data-query-text>{query}</p>
    <p data-empty-text>{empty}</p>
    <p data-missing-text>{missing}</p>
    <p data-duplicate-text>{duplicate}</p>
    <p data-encoded-text>{encoded}</p>
    <Link data-next to="/?q=next">Next</Link>
    <button onClick={mark}>Mark</button>
  </main>
}
