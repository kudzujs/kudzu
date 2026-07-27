import { useEffect, useState } from "@kudzujs/core"
import { startTelemetry } from "./chart"

export function Shell({ children }: { children?: unknown }) {
  const [layoutCount, setLayoutCount] = useState(0)

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
      <nav>
        <a href="/shop/product">Product</a>
        <a href="/shop/cart">Cart</a>
        <a href="/shop/chart">Chart</a>
        <a href="/shop/outside">Outside</a>
        <a href="/shop/cart" data-k-native>Native cart</a>
        <a href="/shop/broken">Broken</a>
      </nav>
    </header>
    {children}
  </div>
}
