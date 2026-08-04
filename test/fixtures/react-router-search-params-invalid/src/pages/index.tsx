import { useSearchParams } from "react-router-dom"

export default function Page() {
  const [searchParams, setSearchParams] = useSearchParams()
  return <button onClick={() => setSearchParams(searchParams)}>Update</button>
}
