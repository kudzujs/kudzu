const waitFor = async test => {
  for (let index = 0; index < 100; index++) {
    if (await test()) return
    await new Promise(resolve => setTimeout(resolve, 25))
  }
  throw new Error("timeout")
}
const requestCount = path => fetch(`/request-count?path=${encodeURIComponent(path)}`).then(response => response.json())
const notIntercepted = selector => {
  let prevented
  document.addEventListener("click", event => {
    prevented = event.defaultPrevented
    event.preventDefault()
  }, { once: true })
  document.querySelector(selector).dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }))
  return !prevented
}

try {
  if (location.pathname === "/app/alpha") {
    const shell = document.querySelector('[data-shell="a"]')
    document.querySelector("[data-layout-count]").click()
    document.querySelector("[data-route-count]").click()
    await waitFor(() => document.querySelector("[data-layout-count]").textContent === "A 1")
    document.querySelector("[data-item]").click()
    await waitFor(() => document.querySelector('[data-route="item"]')?.dataset.id === "oak")
    if (document.querySelector('[data-shell="a"]') !== shell || document.querySelector("[data-layout-count]").textContent !== "A 1" || document.querySelector("[data-route-count]").textContent !== "Route 0" || document.body.dataset.itemEffect !== "oak") throw new Error("group-a-lifetimes")
    if (!notIntercepted("[data-cross]") || await requestCount("/app/beta") !== 0) throw new Error("cross-group")
    if (!notIntercepted("[data-native-exact]") || await requestCount("/app/items/native") !== 0) throw new Error("ungrouped-runtime-overlap")
    document.body.dataset.navigationGroupsTest = "pass"
  } else if (location.pathname === "/app/beta") {
    if (!document.querySelector('[data-shell="b"]') || document.querySelector('[data-shell="a"]')) throw new Error("group-b-load")
    const shell = document.querySelector('[data-shell="b"]')
    document.querySelector("[data-layout-count]").click()
    document.querySelector("[data-route-count]").click()
    await waitFor(() => document.querySelector("[data-layout-count]").textContent === "B 1")
    document.querySelector("[data-gamma]").click()
    await waitFor(() => document.querySelector('[data-route="gamma"]'))
    if (document.querySelector('[data-shell="b"]') !== shell || document.querySelector("[data-layout-count]").textContent !== "B 1" || document.querySelector("[data-route-count]").textContent !== "Route 0") throw new Error("group-b-lifetimes")
    if (!notIntercepted("[data-outside]") || await requestCount("/app/outside") !== 0) throw new Error("outside-native")
    document.body.dataset.navigationGroupsTest = "pass"
  } else if (location.pathname === "/app/outside") {
    document.body.dataset.navigationGroupsTest = !document.body.dataset.kApplication && !document.querySelector('[src*="kudzu-navigation"]') ? "pass" : "fail-outside"
  }
} catch (error) {
  document.body.dataset.navigationGroupsTest = `fail-${error.message}`
}
