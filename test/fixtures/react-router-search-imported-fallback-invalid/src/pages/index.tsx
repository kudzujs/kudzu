import { useSearchParams } from "react-router-dom"
import { QUESTION_ORDER_KEYS } from "../order"

export default function Page() {
  const [urlSearchParams] = useSearchParams()
  const fallbackIndex = 0
  const curOrder = urlSearchParams.get("order") || QUESTION_ORDER_KEYS[fallbackIndex]
  return <main>{curOrder}</main>
}
