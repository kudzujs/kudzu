import { useCart } from "../store"
import { Shell } from "../Shell"

export const layout = Shell

export default function Product() {
  const add = useCart(state => state.add)
  return <main data-route="product"><h1>Oak desk</h1><button data-add onClick={() => {
    add("oak")
    add("oak")
  }}>Add two</button></main>
}
