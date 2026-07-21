export default function NativeInvalidControlsPage() {
  function blocked(event: MouseEvent) {
    const alias = event
    const { preventDefault: cancel, stopPropagation } = alias
    cancel()
    stopPropagation()
    event.stopImmediatePropagation()
  }

  return <button onClick={blocked}>Blocked</button>
}
