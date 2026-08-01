import { useCart } from "../store"
import { Shell } from "../Shell"

export const layout = Shell

export default function Cart() {
  const quantities = useCart(state => state.quantities)
  const remove = useCart(state => state.remove)
  return <main data-route="cart"><h1>Cart</h1><output data-oak-quantity>{quantities.oak ?? 0}</output><button data-remove onClick={() => remove("oak")}>Remove</button></main>
}
