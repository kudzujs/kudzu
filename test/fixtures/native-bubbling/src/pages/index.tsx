import { Parent } from "../Parent"

export default function NativeBubblingPage() {
  function controls(event: MouseEvent) {
    document.body.dataset.controls = (event.currentTarget as HTMLElement).id
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
  }

  function inner(event: MouseEvent) {
    document.body.dataset.order = (event.currentTarget as HTMLElement).id
    ;(event.currentTarget as HTMLElement).parentElement?.remove()
  }

  return <Parent>
    <a id="controls" href="#changed" onClick={controls}>Controls</a>
    <button id="inner" onClick={inner}>Bubble</button>
  </Parent>
}
