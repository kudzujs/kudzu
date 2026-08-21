import { useSearchParams } from "react-router-dom"

export default function NegativeFallback() {
  const [urlSearchParams] = useSearchParams()
  const offset = Number(urlSearchParams.get("offset")) || -1
  return <main data-offset={offset}>{offset}</main>
}
