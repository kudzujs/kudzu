import { Parent } from "../Parent"

export default function NativeBubblingPage() {
  function inner(event: MouseEvent) {
    document.body.dataset.order = (event.currentTarget as HTMLElement).id
    ;(event.currentTarget as HTMLElement).parentElement?.remove()
  }

  return <Parent><button id="inner" onClick={inner}>Bubble</button></Parent>
}
