import { useSearchParams } from "react-router-dom"

export default function Page() {
  const [searchParams] = useSearchParams()
  const name = "q"
  const query = searchParams.get(name)
  return <main>{query}</main>
}
