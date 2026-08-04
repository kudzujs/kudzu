export function applyCommands(state, commands, commit, log = console.log) {
  if (commands.length === 1 && commands[0][0] !== "log") {
    const [operation, id, operand] = commands[0]
    const current = state.get(id)
    const value = operation === "add" ? current + operand : operand
    state.set(id, value)
    commit(id, value)
    return
  }
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
const stateReleaseHooks = []
const textTargets = new Map()
const mountedText = new WeakSet()

/* list-item-hooks */
const listItemHooks = new Map()

export function registerListItemHook(id, hook) {
  const hooks = listItemHooks.get(id) ?? new Set()
  hooks.add(hook)
  listItemHooks.set(id, hooks)
  return () => {
    hooks.delete(hook)
    if (!hooks.size) listItemHooks.delete(id)
  }
}

export function notifyListItem(id, root) {
  for (const hook of listItemHooks.get(id) ?? []) hook(root)
}
/* list-item-hooks-end */

export function registerCommitter(commit) {
  committers.push(commit)
}

export function registerMountHook(mount) {
  mountHooks.push(mount)
}

export function registerUnmountHook(unmount) {
  unmountHooks.push(unmount)
}

export function registerStateReleaseHook(release) {
  stateReleaseHooks.push(release)
}

export function releaseState(id) {
  for (const release of stateReleaseHooks) release(id)
  browserState.delete(id)
}

export function commitDom(id, value) {
  for (const node of textTargets.get(id) ?? []) {
    if (node.isConnected) node.textContent = value
    else textTargets.get(id).delete(node)
  }
  for (const commit of committers) commit(id)
}

export function mountText(root) {
  for (const node of matching(root, "[data-k-text]")) {
    if (mountedText.has(node)) continue
    mountedText.add(node)
    const id = node.dataset.kText
    if (browserState.has(id)) node.textContent = browserState.get(id)
    else browserState.set(id, JSON.parse(node.dataset.kValue))
    const targets = textTargets.get(id) ?? new Set()
    targets.add(node)
    textTargets.set(id, targets)
  }
}

function unmountText(root) {
  for (const node of matching(root, "[data-k-text]")) {
    const id = node.dataset.kText
    const targets = textTargets.get(id)
    targets?.delete(node)
    if (!targets?.size) textTargets.delete(id)
    mountedText.delete(node)
  }
}

export function mountDom(root) {
  mountText(root)
  for (const mount of mountHooks) mount(root)
}

export function unmountDom(root) {
  for (const unmount of unmountHooks) unmount(root)
  unmountText(root)
}

if (typeof document !== "undefined") {
  const initialState = document.body.dataset.kState
  if (initialState) for (const [id, value, compact] of JSON.parse(initialState)) browserState.set(id, compact ? value[1].map(row => Object.fromEntries(value[0].map((field, index) => [field, row[index]]))) : value)
  mountText(document)

  const eventNames = ["click", "input", "change"]
  for (const eventName of eventNames) {
    const directName = `kSetTrue${capitalize(eventName)}`
    const commandsName = `kOn${capitalize(eventName)}`
    const selector = `[data-k-set-true-${eventName}],[data-k-on-${eventName}]`
    document.addEventListener(eventName, event => {
      const direct = event.target.dataset?.[directName]
      if (direct) {
        browserState.set(direct, true)
        commitDom(direct, true)
        return
      }
      const commands = event.target.dataset?.[commandsName]
      if (commands) {
        applyCommands(browserState, JSON.parse(commands), commitDom)
        return
      }
      const target = event.target.closest?.(selector)
      if (!target) return
      const inheritedDirect = target.dataset[directName]
      if (inheritedDirect) {
        browserState.set(inheritedDirect, true)
        commitDom(inheritedDirect, true)
        return
      }
      applyCommands(browserState, JSON.parse(target.dataset[commandsName]), commitDom)
    })
  }
}

function matching(root, selector) {
  return [...(root.matches?.(selector) ? [root] : []), ...(root.querySelectorAll?.(selector) ?? [])]
}

function capitalize(value) {
  return value[0].toUpperCase() + value.slice(1)
}
