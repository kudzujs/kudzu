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

export function commitDom(id, value) {
  for (const node of document.querySelectorAll(`[data-k-text="${id}"]`)) {
    node.textContent = value
    node.dataset.kValue = JSON.stringify(value)
  }
}

if (typeof document !== "undefined") {
  for (const node of document.querySelectorAll("[data-k-text]")) {
    browserState.set(node.dataset.kText, JSON.parse(node.dataset.kValue))
  }

  for (const eventName of ["click", "input", "change"]) {
    document.addEventListener(eventName, event => {
      const target = event.target.closest(`[data-k-on-${eventName}]`)
      if (!target) return
      const commands = target.dataset[`kOn${capitalize(eventName)}`]
      applyCommands(browserState, JSON.parse(commands), commitDom)
    })
  }
}

function capitalize(value) {
  return value[0].toUpperCase() + value.slice(1)
}
