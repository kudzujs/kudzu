export function applyCommands(state, commands, commit, log = console.log) {
  const changed = new Set()

  for (const [operation, id, operand] of commands) {
    const current = state.get(id)
    if (operation === "log") {
      log(operand, current)
      continue
    }
    state.set(id, operation === "add" ? current + operand : operand)
    changed.add(id)
  }

  for (const id of changed) commit(id, state.get(id))
}

export const browserState = new Map()
const committers = []
const mountHooks = []
const unmountHooks = []

export function registerCommitter(commit) {
  committers.push(commit)
}

export function registerMountHook(mount) {
  mountHooks.push(mount)
}

export function registerUnmountHook(unmount) {
  unmountHooks.push(unmount)
}

export function commitDom(id, value) {
  for (const node of document.querySelectorAll(`[data-k-text="${id}"]`)) node.textContent = value
  for (const commit of committers) commit(id)
}

export function mountText(root) {
  for (const node of matching(root, "[data-k-text]")) {
    const id = node.dataset.kText
    if (browserState.has(id)) node.textContent = browserState.get(id)
    else browserState.set(id, JSON.parse(node.dataset.kValue))
  }
}

export function mountDom(root) {
  mountText(root)
  for (const mount of mountHooks) mount(root)
}

export function unmountDom(root) {
  for (const unmount of unmountHooks) unmount(root)
}

if (typeof document !== "undefined") {
  const initialState = document.body.dataset.kState
  if (initialState) for (const [id, value, compact] of JSON.parse(initialState)) browserState.set(id, compact ? value[1].map(row => Object.fromEntries(value[0].map((field, index) => [field, row[index]]))) : value)
  mountText(document)

  const eventNames = ["click", "input", "change"]
  for (const eventName of eventNames) {
    document.addEventListener(eventName, event => {
      const target = event.target.closest(`[data-k-on-${eventName}]`)
      if (!target) return
      const commands = target.dataset[`kOn${capitalize(eventName)}`]
      applyCommands(browserState, JSON.parse(commands), commitDom)
    })
  }
}

function matching(root, selector) {
  return [...(root.matches?.(selector) ? [root] : []), ...(root.querySelectorAll?.(selector) ?? [])]
}

function capitalize(value) {
  return value[0].toUpperCase() + value.slice(1)
}
