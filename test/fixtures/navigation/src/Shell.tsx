import { useEffect, useRef, useState } from "@kudzujs/core"
import { startTelemetry } from "./chart"

export function Shell({ children }: { children?: unknown }) {
  const [layoutCount, setLayoutCount] = useState(0)
  const layoutRef = useRef<HTMLSpanElement | null>(null)

  async function updateLayoutLate() {
    await new Promise<void>(resolve => {
      ;(document.body as any).nativeDisposalResolver = resolve
    })
    layoutRef.current?.setAttribute("data-resolved", "true")
    setLayoutCount(value => value + 1)
  }

  useEffect(() => {
    document.body.dataset.effectLog = `${document.body.dataset.effectLog ?? ""}|layout setup`
    return () => {
      document.body.dataset.effectLog += "|layout cleanup"
    }
  }, [])

  useEffect(() => {
    const stop = startTelemetry()
    return () => {
      stop()
      document.body.dataset.probeDisposal = `${document.body.dataset.probeDisposal ?? ""}|layout`
    }
  }, [])

  useEffect(() => {
    document.body.dataset.effectLog += `|layout dependency setup ${layoutCount}`
    return () => {
      document.body.dataset.effectLog += `|layout dependency cleanup ${layoutCount}`
    }
  }, [layoutCount])

  return <div data-layout>
    <header>
      <button data-layout-count onClick={() => setLayoutCount(value => value + 1)}>Layout {layoutCount}</button>
      <button data-layout-late onClick={updateLayoutLate}>Late layout</button>
      <span ref={layoutRef} data-layout-ref />
      <nav>
        <a href="/shop/product">Product</a>
        <a href="/shop/cart">Cart</a>
        <a href="/shop/chart">Chart</a>
        <a href="/shop/outside">Outside</a>
        <a href="/shop/cart" data-k-native>Native cart</a>
        <a href="/shop/broken">Broken</a>
        <a data-item-a href="/shop/items/oak">Oak item</a>
        <a data-item-b href="/shop/items/pine">Pine item</a>
        <a data-item-new href="/shop/items/new">New item</a>
        <a data-item-malformed href="/shop/items/%2F">Malformed item</a>
      </nav>
    </header>
    {children}
  </div>
}
