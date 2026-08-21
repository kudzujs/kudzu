import { useSearchParams } from "react-router-dom"

export default function Page() {
  const [urlSearchParams] = useSearchParams()
  const curPage = Math.max(1, Number(urlSearchParams.get("page")))
  return <main>{curPage}</main>
}
