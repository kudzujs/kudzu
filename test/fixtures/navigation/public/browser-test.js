const waitFor = async (test, label = "timeout") => {
  for (let index = 0; index < 100; index++) {
    if (await test()) return
    await new Promise(resolve => setTimeout(resolve, 25))
  }
  throw new Error(label)
}

const requestCount = async url => fetch(`/request-count?url=${encodeURIComponent(url)}`).then(response => response.json())
const releaseProduct = value => document.body.productResolvers.shift()(value)

if (sessionStorage.kNavigationFallback) {
  sessionStorage.removeItem("kNavigationFallback")
  const preserved = sessionStorage.kNavigationPreserved === "chart"
  sessionStorage.removeItem("kNavigationPreserved")
  document.body.dataset.browserTest = preserved && document.querySelector('[data-route="broken"]') && document.querySelector("[data-layout]") ? "pass" : "fail-standalone-fallback"
} else if (location.pathname.startsWith("/shop/items/")) {
  try {
    const originalLayout = document.querySelector("[data-layout]")
    const item = () => document.querySelector('[data-route="item"]')
    const id = () => item()?.dataset.itemId
    await waitFor(() => id() === "oak" && document.querySelector("[data-item-derived]")?.textContent === "Selected oak")
    await waitFor(() => document.body.dataset.runtimeLog === "|setup oak")
    document.querySelector("[data-item-capture]").click()
    if (document.body.dataset.runtimeCapture !== "oak") throw new Error("direct-runtime-capture")
    document.querySelector('[data-route="item"] [data-route-count]').click()
    await waitFor(() => item().dataset.itemCount === "1")
    document.querySelector('a[href="/shop/product"]').click()
    await waitFor(() => document.querySelector('[data-route="product"]'))
    if (document.querySelector("[data-layout]") !== originalLayout) throw new Error("runtime-layout-product")
    document.querySelector("[data-item-a]").click()
    await waitFor(() => id() === "oak")
    if (item().dataset.itemCount !== "0") throw new Error("runtime-state-reset")
    await waitFor(async () => await requestCount("/shop/items/pine") === 1)
    document.querySelector('[data-route="item"] [data-item-b]').click()
    await waitFor(() => id() === "pine")
    if (document.querySelector("[data-item-direct]").textContent !== "pine" || document.querySelector("[data-item-derived]").textContent !== "Selected pine") throw new Error("runtime-bindings")
    if (document.querySelector("[data-layout]") !== originalLayout || document.body.dataset.runtimeLog !== "|setup oak|cleanup oak|setup oak|cleanup oak|setup pine") throw new Error(`runtime-order-${document.body.dataset.runtimeLog}`)
    if (await requestCount("/shop/items/pine") !== 1) throw new Error("runtime-prefetch-count")
    document.querySelector("[data-item-capture]").click()
    if (document.body.dataset.runtimeCapture !== "pine") throw new Error("runtime-cached-capture")
    history.back()
    await waitFor(() => id() === "oak")
    history.forward()
    await waitFor(() => id() === "pine")
    const beforeMalformed = item()
    let intercepted
    document.addEventListener("click", event => {
      intercepted = event.defaultPrevented
      event.preventDefault()
    }, { once: true })
    document.querySelector("[data-item-malformed]").dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }))
    if (intercepted || item() !== beforeMalformed || id() !== "pine") throw new Error("runtime-malformed-commit")
    document.querySelector("[data-item-new]").click()
    await waitFor(() => document.querySelector('[data-route="new-item"]'))
    if (document.querySelector("[data-layout]") !== originalLayout) throw new Error("runtime-exact-precedence")
    document.body.dataset.runtimeBrowserTest = "pass"
  } catch (error) {
    document.body.dataset.runtimeBrowserTest = `fail-${error.message}`
  }
} else if (location.pathname === "/shop/product") {
  try {
    const originalDocument = document
    const originalLayout = document.querySelector("[data-layout]")
    await waitFor(() => document.body.dataset.effectLog?.includes("|product dependency setup 0"))
    await waitFor(async () => await requestCount("/shop/cart?coupon=leaf") === 1 && await requestCount("/shop/chart") === 1 && await requestCount("/shop/broken") >= 1)
    if (await requestCount("/shop/outside") !== 0 || !document.querySelector('[data-route="product"]')) throw new Error("prefetch-scope")
    document.querySelector("[data-product-query]").dispatchEvent(new PointerEvent("pointerover", { bubbles: true }))
    await new Promise(resolve => setTimeout(resolve, 100))
    if (await requestCount("/shop/cart?coupon=leaf") !== 1) throw new Error("duplicate-prefetch")
    document.querySelector("[data-layout-count]").click()
    document.querySelector("[data-route-count]").click()
    await waitFor(() => document.querySelector("[data-layout-count]").textContent.includes("1") && document.querySelector("[data-route-count]").textContent.includes("1"))
    document.querySelector("[data-product-query]").click()
    await waitFor(() => document.querySelector('[data-route="cart"]'))
    releaseProduct("stale")
    await new Promise(resolve => setTimeout(resolve, 0))
    const runtime = await import("/shop/assets/kudzu.js")
    if (runtime.browserState.has("rs2")) throw new Error("stale-cart-state")
    if (await requestCount("/shop/cart?coupon=leaf") !== 1) throw new Error("duplicate-navigation-request")
    if (document !== originalDocument || document.querySelector("[data-layout]") !== originalLayout) throw new Error("identity")
    if (document.querySelector("[data-layout-count]").textContent !== "Layout 1" || document.querySelector("[data-route-count]").textContent !== "Route 0") throw new Error("state-lifetime")
    if (location.search !== "?coupon=leaf" || location.hash !== "#summary" || document.title !== "Cart" || document.activeElement.id !== "summary" || document.querySelector("[data-derived]").textContent !== "Cart derived 0") throw new Error("cart-location")
    document.querySelector("[data-route-count]").click()
    await waitFor(() => document.querySelector("[data-route-count]").textContent === "Route 1" && document.querySelector("[data-derived]").textContent === "Cart derived 1")
    history.back()
    await waitFor(() => document.querySelector('[data-route="product"]'))
    if (document.querySelector("[data-route-count]").textContent !== "Route 0" || document.querySelector("[data-layout-count]").textContent !== "Layout 1") throw new Error("back-state")
    history.forward()
    await waitFor(() => document.querySelector('[data-route="cart"]'))
    if (document.querySelector("[data-route-count]").textContent !== "Route 0") throw new Error("forward-state")
    document.querySelector("[data-product-query]").click()
    await waitFor(() => document.querySelector('[data-route="product"]'))
    await waitFor(() => document.body.productResolvers?.length === 2)
    releaseProduct("stale")
    await new Promise(resolve => setTimeout(resolve, 0))
    if (document.querySelector("[data-product-result]").textContent !== "pending") throw new Error("stale-revisited-state")
    releaseProduct("fresh")
    await waitFor(() => document.querySelector("[data-product-result]").textContent === "fresh")
    if (location.search !== "?view=full" || location.hash !== "#details" || document.title !== "Product" || document.activeElement.id !== "details") throw new Error("product-location")
    for (const selector of ['a[href="/shop/outside"]', "a[data-k-native]", "a[data-hash-only]"]) {
      let intercepted
      document.addEventListener("click", event => {
        intercepted = event.defaultPrevented
        event.preventDefault()
      }, { once: true })
      const event = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 })
      document.querySelector(selector).dispatchEvent(event)
      if (intercepted) throw new Error("native-anchor")
    }
    document.querySelector("[data-layout-count]").click()
    await waitFor(() => document.querySelector("[data-layout-count]").textContent === "Layout 2")
    await waitFor(() => document.body.dataset.effectLog.endsWith("|layout dependency setup 2"))
    if (document !== originalDocument || document.querySelector("[data-layout]") !== originalLayout) throw new Error("cycle-identity")
    dispatchEvent(new Event("product-check"))
    if (document.body.dataset.productEvents !== "1") throw new Error("duplicate-route-listener")
    const count = value => document.body.dataset.effectLog.split(value).length - 1
    if (count("|layout setup") !== 1 || count("|product setup") !== 3 || count("|cart setup") !== 2 || count("|product cleanup") !== 2 || count("|cart cleanup") !== 2) throw new Error("effect-counts")
    const dependencyCounts = [count("|layout dependency setup"), count("|layout dependency cleanup"), count("|product dependency setup"), count("|product dependency cleanup")]
    if (dependencyCounts.join() !== "3,2,4,3") throw new Error(`dependency-counts-${dependencyCounts}`)
    document.querySelector('a[href="/shop/chart"]').click()
    await waitFor(() => Number(document.querySelector("[data-chart]")?.dataset.sample) > 0, "chart-first-ready")
    if (document.body.dataset.streamSetups !== "1" || document.body.dataset.chartMounts !== "1") throw new Error("chart-first-mount")
    const firstSample = Number(document.body.dataset.streamSamples)
    const firstUpdates = Number(document.body.dataset.chartUpdates)
    document.querySelector("[data-ordinary]").click()
    await waitFor(() => document.querySelector('[data-route="cart"]'), "chart-first-departure")
    if (document.body.dataset.chartDisposals !== "1") throw new Error("chart-first-dispose")
    const unmountedUpdates = document.body.dataset.chartUpdates
    await waitFor(() => Number(document.body.dataset.streamSamples) > firstSample, "stream-transition")
    await new Promise(resolve => setTimeout(resolve, 30))
    if (document.body.dataset.chartUpdates !== unmountedUpdates) throw new Error("chart-unmounted-update")
    document.querySelector('a[href="/shop/chart"]').click()
    await waitFor(() => Number(document.querySelector("[data-chart]")?.dataset.sample) > 0, "chart-second-ready")
    if (document.body.dataset.streamSetups !== "1" || document.body.dataset.chartMounts !== "2" || document.body.dataset.chartDisposals !== "1") throw new Error("chart-second-mount")
    const secondSample = Number(document.body.dataset.streamSamples)
    const secondUpdates = Number(document.body.dataset.chartUpdates)
    await waitFor(() => Number(document.body.dataset.streamSamples) >= secondSample + 3, "chart-second-updates")
    if (Number(document.body.dataset.chartUpdates) - secondUpdates !== Number(document.body.dataset.streamSamples) - secondSample || firstUpdates > firstSample) throw new Error("chart-duplicate-listener")
    document.querySelector("[data-ordinary]").click()
    await waitFor(() => document.querySelector('[data-route="cart"]'), "chart-second-departure")
    if (document.body.dataset.chartDisposals !== "2") throw new Error("chart-second-dispose")
    document.querySelector('a[href="/shop/chart"]').click()
    await waitFor(() => Number(document.querySelector("[data-chart]")?.dataset.sample) > 0, "chart-third-ready")
    if (document.body.dataset.streamSetups !== "1" || document.body.dataset.chartMounts !== "3" || document.body.dataset.chartDisposals !== "2") throw new Error("chart-third-mount")
    const thirdSample = Number(document.body.dataset.streamSamples)
    const thirdUpdates = Number(document.body.dataset.chartUpdates)
    await waitFor(() => Number(document.body.dataset.streamSamples) >= thirdSample + 3, "chart-third-updates")
    if (Number(document.body.dataset.chartUpdates) - thirdUpdates !== Number(document.body.dataset.streamSamples) - thirdSample) throw new Error("chart-repeated-listener")
    const pagehide = persisted => {
      const event = new Event("pagehide")
      Object.defineProperty(event, "persisted", { value: persisted })
      dispatchEvent(event)
    }
    const beforePersisted = document.body.dataset.effectLog
    pagehide(true)
    await new Promise(resolve => setTimeout(resolve, 0))
    if (document.body.dataset.effectLog !== beforePersisted) throw new Error("persisted-disposal")
    pagehide(false)
    await new Promise(resolve => setTimeout(resolve, 0))
    if (!document.body.dataset.effectLog.endsWith("|cart cleanup|layout cleanup|layout dependency cleanup 2")) throw new Error("page-disposal-order")
    if (count("|product cleanup") !== 3 || count("|cart cleanup") !== 4 || count("|layout cleanup") !== 1 || count("|product dependency cleanup") !== 4 || count("|layout dependency cleanup") !== 3) throw new Error("disposal-counts")
    if (document.body.dataset.chartDisposals !== "3" || document.body.dataset.probeDisposal !== "|route|route|route|layout") throw new Error("probe-disposal-order")
    addEventListener("beforeunload", () => {
      sessionStorage.kNavigationPreserved = document.querySelector('[data-route="chart"]') ? "chart" : "removed"
    }, { once: true })
    sessionStorage.kNavigationFallback = "1"
    document.querySelector('a[href="/shop/broken"]').click()
  } catch (error) {
    document.body.dataset.browserTest = `fail-${error.message}`
  }
}
