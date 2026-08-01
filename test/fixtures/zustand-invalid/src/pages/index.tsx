import { useCart } from "../store"

export default function Page() {
  const count = useCart(state => Object.keys(state.quantities).length)
  return <p>{count}</p>
}
