import { Shell } from "../Shell"
import { useCart } from "../useCart"

export const layout = Shell

export default function Cart() {
  const { quantities, remove } = useCart()
  return <main data-route="cart"><h1>Cart</h1><output data-oak-quantity>{quantities.oak ?? 0}</output><button data-remove onClick={() => remove("oak")}>Remove</button></main>
}
