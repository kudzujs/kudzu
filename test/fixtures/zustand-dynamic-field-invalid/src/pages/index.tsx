import { useCart } from "../store"

export default function Page() {
  const field = "quantities"
  const quantities = useCart(state => state[field])
  return <output>{quantities.oak ?? 0}</output>
}
