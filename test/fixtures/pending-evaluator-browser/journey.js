export async function run() {
  globalThis.__KUDZU_CONDITIONS__ = true
  globalThis.__KUDZU_TEXT_BINDINGS__ = true
  globalThis.__pendingGates = {}
  globalThis.__pendingReads = {}
  const descriptors = []
  const check = (actual, expected, message) => {
    if (actual !== expected) throw new Error(`${message}: ${JSON.stringify(actual)} !== ${JSON.stringify(expected)}`)
  }
  for (const kind of ["attribute", "text", "condition"]) {
    for (const action of ["unmount", "remount", "release", "release-remount", "commit"]) {
      const id = `${kind}-${action}`
      let resolve
      globalThis.__pendingGates[id] = { promise: new Promise(done => { resolve = done }), resolve: () => resolve() }
      globalThis.__pendingReads[id] = 0
      descriptors.push({ id, kind, action, module: "data:text/javascript," + encodeURIComponent(`await globalThis.__pendingGates[${JSON.stringify(id)}].promise; export function read(context) { globalThis.__pendingReads[${JSON.stringify(id)}]++; return context.get("value") }`), handler: "read", states: { value: id, other: `${id}-other` }, scope: {}, scopeStates: {}, scopeBindings: {}, initial: false })
    }
  }
  document.body.dataset.kTextBindings = JSON.stringify(descriptors)
  const { browserState, commitDom, mountDom, releaseState, unmountDom } = await import("/shared-runtime.js")
  const { loadEvaluator } = await import("/binding-runtime.js")
  const results = []
  for (const [index, descriptor] of descriptors.entries()) {
    const { id, kind, action } = descriptor
    const active = action === "remount" || action === "release-remount" || action === "commit"
    const capability = kind === "condition" ? "conditions" : "bindings"
    const root = document.createElement("div")
    if (kind === "attribute") {
      root.dataset.kBindAttrs = JSON.stringify([{ ...descriptor, target: "data-value" }])
      root.dataset.value = "initial"
    } else if (kind === "text") root.innerHTML = `<!--k-text:${index}-->initial<!--k-text-end-->`
    else {
      root.innerHTML = '<template><template data-k-true><b data-branch="true">true</b></template><template data-k-false><b data-branch="false">false</b></template></template><b data-branch="false">false</b><template></template>'
      root.firstElementChild.dataset.kIf = JSON.stringify({ ...descriptor, kind: "ternary", owned: { false: [[`${id}-child`, 7]] } })
      root.lastElementChild.dataset.kIfEnd = id
    }
    document.body.append(root)
    const value = () => kind === "attribute" ? root.dataset.value : root.textContent
    const initial = kind === "condition" ? "false" : "initial"
    browserState.set(id, true)
    browserState.set(`${id}-other`, 0)
    mountDom(root, [capability])
    if (action.startsWith("release")) {
      releaseState(`${id}-other`)
      if (kind === "condition") check(browserState.has(`${id}-child`), false, `${id}: released child`)
      browserState.set(`${id}-other`, 1)
      mountDom(root, [capability])
    }
    if (action !== "release" && action !== "commit") {
      unmountDom(root, [capability])
      root.remove()
      document.body.append(root)
      if (kind === "condition") check(browserState.has(`${id}-child`), false, `${id}: unmounted child`)
      if (active) mountDom(root, [capability])
    }
    const latest = action !== "commit"
    browserState.set(id, latest)
    commitDom(id, latest)
    check(value(), initial, `${id}: output before loading`)
    globalThis.__pendingGates[id].resolve()
    await loadEvaluator(descriptor)
    await new Promise(resolve => setTimeout(resolve, 0))
    check(globalThis.__pendingReads[id], active ? 1 : 0, `${id}: initial reads`)
    check(value(), active ? String(latest) : initial, `${id}: output after loading`)
    browserState.set(id, !latest)
    commitDom(id, !latest)
    check(globalThis.__pendingReads[id], active ? 2 : 0, `${id}: commit reads`)
    check(value(), active ? String(!latest) : initial, `${id}: output after commit`)
    if (kind === "condition") check(root.querySelectorAll("[data-branch]").length, 1, `${id}: one live branch`)
    unmountDom(root, [capability])
    root.remove()
    releaseState(id)
    releaseState(`${id}-other`)
    check(browserState.has(`${id}-child`), false, `${id}: final child cleanup`)
    results.push(id)
  }
  check(browserState.size, 0, "all test state released")
  return results
}
