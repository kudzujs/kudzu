import { useSearchParams } from "react-router-dom"

export default function Page() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get("q")
  const update = (previous: URLSearchParams) => previous
  return <button data-query={query} onClick={() => setSearchParams(update)}>Update</button>
}
