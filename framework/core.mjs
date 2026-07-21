const signalMarker = Symbol("kudzu.signal")
const behaviorMarker = Symbol("kudzu.behavior")
const nativeBehaviorMarker = Symbol("kudzu.nativeBehavior")
const bindingMarker = Symbol("kudzu.binding")

let renderContext

export function useState(initialValue, name) {
  if (!renderContext) {
    throw new Error("useState() can only run while rendering a Kudzu component")
  }

  const id = `s${renderContext.nextState++}`
  const signal = {
    [signalMarker]: true,
    id,
    value: initialValue,
    valueOf() {
      return this.value
    },
    toString() {
      return String(this.value)
    }
  }

  renderContext.states[id] = { name: name ?? id, initialValue }
  return [signal, () => {
    throw new Error("State setters are compiled into ordered browser behaviors")
  }]
}

export function behavior(commands) {
  return {
    [behaviorMarker]: true,
    commands: commands.map(([operation, signal, value]) => {
      if (!signal?.[signalMarker]) throw new Error("A compiled behavior must target framework state")
      return [operation, signal.id, value]
    })
  }
}

export function nativeBehavior(module, handler, states, scope) {
  return {
    [nativeBehaviorMarker]: true,
    module,
    handler,
    states: Object.fromEntries(states.map(([name, signal]) => {
      if (!signal?.[signalMarker]) throw new Error("A native behavior must target framework state")
      return [name, signal.id]
    })),
    scope: Object.fromEntries(scope.map(([name, value]) => [name, serializeCapture(name, value, new Set())]))
  }
}

export function binding(value, module, handler, states, scope) {
  const scopeStates = {}
  const serializedScope = {}
  const scopeBindings = {}
  for (const [name, entry] of scope) {
    if (entry?.[signalMarker]) scopeStates[name] = entry.id
    else if (entry?.[bindingMarker]) scopeBindings[name] = bindingDescriptor(entry)
    else serializedScope[name] = serializeCapture(name, entry, new Set())
  }
  return {
    [bindingMarker]: true,
    value,
    module,
    handler,
    states: Object.fromEntries(states.map(([name, signal]) => {
      if (!signal?.[signalMarker]) throw new Error("A reactive binding must target framework state")
      return [name, signal.id]
    })),
    scope: serializedScope,
    scopeStates,
    scopeBindings
  }
}

export function bindingValue(value) {
  return value?.[signalMarker] || value?.[bindingMarker] ? value.value : value
}

function bindingDescriptor(value) {
  return { module: value.module, handler: value.handler, states: value.states, scope: value.scope, scopeStates: value.scopeStates, scopeBindings: value.scopeBindings }
}

function serializeCapture(name, value, seen) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value
  if (typeof value === "number") {
    return Number.isFinite(value) && !Object.is(value, -0) ? value : { type: "number", value: String(value) }
  }
  if (value === undefined) return { type: "undefined" }
  if (typeof value !== "object") throw new Error(`Native capture "${name}" is not serializable: ${typeof value}`)
  if (seen.has(value)) throw new Error(`Native capture "${name}" is not serializable: cycle`)

  seen.add(value)
  try {
    if (Array.isArray(value)) {
      return { type: "array", value: Array.from(value, entry => serializeCapture(name, entry, seen)) }
    }
    const prototype = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) {
      throw new Error(`Native capture "${name}" is not serializable: ${value.constructor?.name ?? "non-plain object"}`)
    }
    if (Object.getOwnPropertySymbols(value).length) throw new Error(`Native capture "${name}" is not serializable: symbol`)
    const entries = []
    for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
      if (!descriptor.enumerable) continue
      if (!("value" in descriptor)) throw new Error(`Native capture "${name}" is not serializable: accessor`)
      entries.push([key, serializeCapture(name, descriptor.value, seen)])
    }
    return { type: "object", nullPrototype: prototype === null, value: entries }
  } finally {
    seen.delete(value)
  }
}

export async function renderPage(component, metadata = {}) {
  renderContext = { nextState: 0, states: {}, events: [], bindings: [], hasBehaviors: false, hasNativeBehaviors: false }

  try {
    const body = await renderNode({ type: component, props: {} })
    const title = escapeHtml(metadata.title ?? "Kudzu")
    const head = renderMetadata(metadata)
    const styles = metadata.styles === false
      ? ""
      : '<link rel="stylesheet" href="/assets/style.css">'
    const runtime = renderContext.hasBehaviors
      ? '<script type="module" src="/assets/kudzu.js"></script>'
      : ""
    const nativeRuntime = renderContext.hasNativeBehaviors
      ? '<script type="module" src="/assets/kudzu-native.js"></script>'
      : ""
    const state = renderContext.hasBehaviors
      ? ` data-k-state="${escapeAttribute(JSON.stringify(Object.entries(renderContext.states).map(([id, entry]) => [id, entry.initialValue])))}"`
      : ""

    return {
      html: `<!doctype html>\n<html lang="${escapeAttribute(metadata.lang ?? "en")}">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${title}</title>\n${head}${styles}\n</head>\n<body${state}>\n${body}\n${runtime}\n${nativeRuntime}\n</body>\n</html>\n`,
      hasBehaviors: renderContext.hasBehaviors,
      plan: {
        states: Object.entries(renderContext.states).map(([id, state]) => ({ id, ...state })),
        events: renderContext.events,
        bindings: renderContext.bindings
      }
    }
  } finally {
    renderContext = undefined
  }
}

function renderMetadata(metadata) {
  const tags = []
  const meta = (name, content, property = false) => {
    if (content) tags.push(`<meta ${property ? "property" : "name"}="${escapeAttribute(name)}" content="${escapeAttribute(content)}">`)
  }

  if (metadata.description) meta("description", metadata.description)
  if (metadata.themeColor) meta("theme-color", metadata.themeColor)
  if (metadata.url) tags.push(`<link rel="canonical" href="${escapeAttribute(metadata.url)}">`)
  if (metadata.icon) tags.push(`<link rel="icon" href="${escapeAttribute(metadata.icon)}">`)
  if (metadata.appleTouchIcon) tags.push(`<link rel="apple-touch-icon" href="${escapeAttribute(metadata.appleTouchIcon)}">`)
  if (metadata.manifest) tags.push(`<link rel="manifest" href="${escapeAttribute(metadata.manifest)}">`)

  meta("og:title", metadata.title, true)
  meta("og:description", metadata.description, true)
  meta("og:type", metadata.type ?? "website", true)
  meta("og:url", metadata.url, true)
  meta("og:image", metadata.image, true)
  if (metadata.image) {
    meta("og:image:width", "1200", true)
    meta("og:image:height", "630", true)
    meta("og:image:alt", metadata.imageAlt ?? metadata.title, true)
  }
  meta("og:site_name", metadata.siteName, true)
  meta("og:locale", metadata.locale, true)
  meta("twitter:card", metadata.twitterCard ?? (metadata.image ? "summary_large_image" : undefined))
  meta("twitter:title", metadata.title)
  meta("twitter:description", metadata.description)
  meta("twitter:image", metadata.twitterImage ?? metadata.image)

  return tags.length ? `${tags.join("\n")}\n` : ""
}

async function renderNode(node) {
  if (node == null || node === false || node === true) return ""
  if (Array.isArray(node)) {
    let html = ""
    for (const child of node) html += await renderNode(child)
    return html
  }
  if (node?.[signalMarker]) {
    return `<span data-k-text="${node.id}" data-k-value="${escapeAttribute(JSON.stringify(node.value))}">${escapeHtml(node.value)}</span>`
  }
  if (typeof node === "string" || typeof node === "number" || typeof node === "bigint") {
    return escapeHtml(node)
  }
  if (node instanceof Promise) return renderNode(await node)
  if (!node || typeof node !== "object" || !("type" in node)) {
    throw new Error(`Cannot render ${String(node)}`)
  }

  if (node.type === Symbol.for("kudzu.fragment")) return renderNode(node.props.children)
  if (typeof node.type === "function") return renderNode(await node.type(node.props))

  const tag = node.type
  const props = node.props ?? {}
  let attributes = ""

  for (const [rawName, value] of Object.entries(props)) {
    if (rawName === "children" || rawName === "key") continue

    if (/^on[A-Z]/.test(rawName)) {
      const event = rawName.slice(2).toLowerCase()
      if (value?.[behaviorMarker]) {
        const commands = JSON.stringify(value.commands)
        attributes += ` data-k-on-${event}="${escapeAttribute(commands)}"`
        renderContext.events.push({ event, commands: value.commands })
      } else if (value?.[nativeBehaviorMarker]) {
        const native = { module: value.module, handler: value.handler, states: value.states, scope: value.scope }
        attributes += ` data-k-native-${event}="${escapeAttribute(JSON.stringify(native))}"`
        renderContext.events.push({ event, native })
        renderContext.hasNativeBehaviors = true
      } else {
        throw new Error(`${rawName} must reference a compilable event handler`)
      }
      renderContext.hasBehaviors = true
      continue
    }

    const name = rawName === "className" ? "class" : rawName === "htmlFor" ? "for" : rawName
    const target = name === "class" || name === "disabled" || name === "value" ? name : undefined
    if (target && (value?.[signalMarker] || value?.[bindingMarker])) {
      const initialValue = value[signalMarker] ? value.value : value.value
      const reactive = value[signalMarker] || Object.keys(value.states).length > 0 || Object.keys(value.scopeStates).length > 0 || Object.keys(value.scopeBindings).length > 0
      if (!reactive) {
        attributes += renderAttribute(name, initialValue)
        continue
      }
      const descriptor = value[signalMarker]
        ? { state: value.id }
        : bindingDescriptor(value)
      attributes += renderAttribute(name, initialValue)
      attributes += ` data-k-bind-${target}="${escapeAttribute(JSON.stringify(descriptor))}"`
      renderContext.bindings.push({ target, ...descriptor })
      renderContext.hasBehaviors = true
      continue
    }

    if (value == null || value === false) continue
    if (value === true) {
      attributes += ` ${name}`
    } else if (name === "style" && typeof value === "object") {
      const style = Object.entries(value).map(([property, entry]) => `${toKebabCase(property)}:${entry}`).join(";")
      attributes += ` style="${escapeAttribute(style)}"`
    } else {
      attributes += ` ${name}="${escapeAttribute(value)}"`
    }
  }

  const voidElements = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"])
  if (voidElements.has(tag)) return `<${tag}${attributes}>`
  return `<${tag}${attributes}>${await renderNode(props.children)}</${tag}>`
}

function renderAttribute(name, value) {
  if (name === "disabled") return value ? " disabled" : ""
  if (name === "value") return value == null ? "" : ` value="${escapeAttribute(value)}"`
  if (value == null || value === false) return ""
  return ` ${name}="${escapeAttribute(value)}"`
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("'", "&#39;")
}

function toKebabCase(value) {
  return value.replace(/[A-Z]/g, character => `-${character.toLowerCase()}`)
}
