import { Shell } from "../Shell"
import { useCart } from "../useCart"

export const layout = Shell

export default function Product() {
  const { add } = useCart()
  return <main data-route="product"><h1>Oak desk</h1><button data-add onClick={() => {
    add("oak")
    add("oak")
  }}>Add two</button></main>
}
