import { browserState, mountDom, notifyListItem, registerCommitter, registerMountHook, registerUnmountHook, unmountDom } from "./shared-runtime.js"

const listTargets = new Map()
const listRegistrations = new WeakMap()
const mountedLists = new WeakSet()
const imports = __KUDZU_LIST_ASYNC_PARTS__ ? new Map() : undefined
const revisions = __KUDZU_LIST_ASYNC_PARTS__ ? new WeakMap() : undefined
const itemParts = new WeakMap()
const listItems = new WeakMap()
const ownedLists = __KUDZU_NESTED_LISTS__ ? new WeakMap() : undefined
const conditionOwners = __KUDZU_LIST_CONDITIONS__ ? new WeakMap() : undefined
const conditionTemplates = __KUDZU_LIST_CONDITIONS__ ? new WeakMap() : undefined
const itemPartsSelector = `[data-k-list-text]${__KUDZU_LIST_ATTRIBUTES__ ? ",[data-k-list-attrs]" : ""}${__KUDZU_LIST_EVENTS__ ? ",[data-k-list-events]" : ""}${__KUDZU_LIST_EXPRESSIONS__ ? ",[data-k-list-expression]" : ""}${__KUDZU_LIST_EXPRESSION_ATTRIBUTES__ ? ",[data-k-list-expression-attrs]" : ""}${__KUDZU_LIST_CONDITIONS__ ? ",[data-k-list-condition]" : ""}${__KUDZU_LIST_EFFECTS__ ? ",[data-k-effects]" : ""}`
const childPrototypes = __KUDZU_NESTED_LISTS__ ? new WeakMap() : undefined

function commitLists(id) {
  const lists = listTargets.get(id)
  if (!lists) return
  for (const list of lists) {
    if (!list.start.isConnected) unregisterList(list.start)
    else updateList(list)
  }
}

registerCommitter(commitLists)
registerMountHook(mountLists)
registerUnmountHook(unmountLists)

if (typeof document !== "undefined") mountDom(document)

function mountLists(root) {
  let owner = root.nodeType === Node.ELEMENT_NODE ? root : root.parentElement
  while (owner && !listItems.has(owner)) owner = owner.parentElement
  if (owner) fillListParts(root, listItemParts(root), listItems.get(owner), 0)
  for (const start of matching(root, "template[data-k-list]")) {
    if (mountedLists.has(start)) continue
    mountedLists.add(start)
    const descriptor = JSON.parse(start.dataset.kList)
    const end = findEnd(start, descriptor.id)
    const roots = listRoots(start, end)
    const nested = __KUDZU_NESTED_LISTS__ ? mountNestedPrototype(start, descriptor, roots) : undefined
    const templateRoot = __KUDZU_NESTED_LISTS__ ? nested.templateRoot : start.content.firstElementChild
    if (__KUDZU_LIST_ROW_STATES__ && descriptor.rowStates) for (let index = 0; index < roots.length; index++) initializeRowStates(descriptor, descriptor.keys[index])
    const parts = listItemPartPlan(templateRoot, descriptor.nested)
    for (const root of roots) {
      if (__KUDZU_LIST_CONDITIONS__ && descriptor.conditions) {
        const initialParts = listItemParts(root, descriptor.nested)
        mapListConditionTemplates(parts.conditions, initialParts.conditions)
      } else mapListItemParts(parts, root, descriptor.nested)
    }
    if (__KUDZU_LIST_SEEDS__ && descriptor.seed && !browserState.has(descriptor.state)) browserState.set(descriptor.state, roots.map((root, index) => seedListItem(root, descriptor, index)))
    const items = browserState.get(descriptor.state)
    const list = {
      start,
      descriptor,
      ...(__KUDZU_NESTED_LISTS__ ? { templateRoot, ...(nested.childPrototype ? { childPrototype: nested.childPrototype } : {}) } : {}),
      parts,
      seedFields: __KUDZU_LIST_SEEDS__ && descriptor.seed && Object.keys(descriptor.seed),
      roots: new Map(roots.map((node, index) => [keyToken(descriptor.keys[index]), node])),
      values: new Map(),
      items: undefined,
      container: roots[0]?.parentNode,
      boundary: end,
      ...(__KUDZU_NESTED_LISTS__ && descriptor.ownerField ? { owner: nested.owner } : {})
    }
    if (__KUDZU_NESTED_LISTS__ && descriptor.ownerField) {
      if (!list.owner) throw new Error("Nested keyed list has no parent row")
      if (ownedLists.has(list.owner)) throw new Error("Keyed list rows support one nested keyed list")
      ownedLists.set(list.owner, list)
      listRegistrations.set(start, { list, owner: list.owner })
    } else {
      register(listTargets, descriptor.state, list)
      listRegistrations.set(start, { state: descriptor.state, list })
    }
    updateList(list)
  }
}

function unmountLists(root) {
  for (const start of matching(root, "template[data-k-list]")) unregisterList(start)
}

function unregisterList(start) {
  const registration = listRegistrations.get(start)
  if (registration) {
    if (__KUDZU_NESTED_LISTS__ && registration.owner) {
      if (ownedLists.get(registration.owner) === registration.list) ownedLists.delete(registration.owner)
    } else {
      const lists = listTargets.get(registration.state)
      lists?.delete(registration.list)
      if (!lists?.size) listTargets.delete(registration.state)
    }
    if (__KUDZU_LIST_ROW_STATES__ && registration.list.descriptor.rowStates) for (const token of registration.list.roots.keys()) deleteRowStates(registration.list.descriptor, token)
  }
  listRegistrations.delete(start)
  mountedLists.delete(start)
}

function updateList(list) {
  const items = __KUDZU_NESTED_LISTS__ && list.descriptor.ownerField
    ? listItems.get(list.owner)?.[list.descriptor.ownerField]
    : browserState.get(list.descriptor.state)
  if (!Array.isArray(items)) throw new Error(list.descriptor.ownerField ? `Nested keyed list property "${list.descriptor.ownerField}" must remain an array` : "Keyed list state must remain an array")
  if (__KUDZU_NESTED_LISTS__ && (list.descriptor.child || list.descriptor.ownerField) && list.items && updateNestedList(list, items)) return
  if (__KUDZU_NESTED_LISTS__ && list.descriptor.child) validateChildLists(items, list.descriptor.child)
  if (list.descriptor.reducer && list.items && updateReducerList(list, items)) return
  const entries = []
  const keys = new Set()
  const seen = new Set()
  for (const item of items) {
    const key = item?.[list.descriptor.key]
    if (!validListKey(key)) throw new Error(`Keyed list key "${list.descriptor.key}" must be a string or finite number`)
    assertListItem(item)
    const seededValue = __KUDZU_LIST_SEEDS__ ? list.seedFields && seededListValue(item, list.seedFields, list.descriptor.seed) : undefined
    if (seededValue === undefined) assertListValue(item, seen, true)
    const token = keyToken(key)
    if (keys.has(token)) throw new Error(`Duplicate keyed list key: ${String(key)}`)
    keys.add(token)
    entries.push({ item, key, token, value: seededValue === undefined ? JSON.stringify(item) : seededValue })
  }
  if (list.values.size && entries.every(entry => !list.values.has(entry.token) || list.values.get(entry.token) === entry.value)) {
    const currentTokens = [...list.roots.keys()]
    const nextTokens = entries.map(entry => entry.token)
    if (nextTokens.length === currentTokens.length && nextTokens.every((token, index) => token === currentTokens[currentTokens.length - index - 1])) {
      const parent = list.container ?? list.start.parentNode
      const reordered = parent.ownerDocument.createDocumentFragment()
      reordered.append(...nextTokens.map(token => list.roots.get(token)))
      parent.insertBefore(reordered, list.boundary)
      list.roots = new Map(nextTokens.map(token => [token, list.roots.get(token)]))
      list.container ??= parent
      return
    }
    if (nextTokens.length === currentTokens.length - 1) {
      const removed = currentTokens.find(token => !keys.has(token))
      const removedIndex = currentTokens.indexOf(removed)
      if (removed && nextTokens.every((token, index) => token === currentTokens[index >= removedIndex ? index + 1 : index])) {
        removeListRoot(list, removed)
        list.roots = new Map(nextTokens.map(token => [token, list.roots.get(token)]))
        return
      }
    }
    if (nextTokens.length === currentTokens.length + 1 && currentTokens.every((token, index) => token === nextTokens[index])) {
      const entry = entries.at(-1)
      addListRoot(list, entry)
      return
    }
  }
  const next = []
  const values = new Map()
  const parent = list.container ?? list.start.parentNode
  const additions = parent.ownerDocument.createDocumentFragment()
  let added = false
  for (const { item, key, token, value } of entries) {
    let node = list.roots.get(token)
    if (!node) {
      node = (__KUDZU_NESTED_LISTS__ ? list.templateRoot : list.start.content.firstElementChild)?.cloneNode(true)
      if (node?.dataset.kListRoot !== list.descriptor.id) node = undefined
      if (!node) throw new Error("Keyed list template has no root element")
      node.removeAttribute("data-k-list-root")
      if (__KUDZU_NESTED_LISTS__ && list.childPrototype) childPrototypes.set(node, list.childPrototype)
      if (__KUDZU_LIST_ROW_STATES__ && list.descriptor.rowStates) initializeRowStates(list.descriptor, key, node)
      mapListItemParts(list.parts, node, list.descriptor.nested)
      fillListItem(node, item, list.descriptor.nested)
      additions.append(node)
      added = true
    } else if (list.values.get(token) !== value) {
      fillListItem(node, item, list.descriptor.nested)
      if (__KUDZU_LIST_ITEM_HOOKS__) notifyListItem(list.descriptor.state, node)
    }
    next.push([token, node])
    values.set(token, value)
  }
  for (const [token, node] of list.roots) {
    if (keys.has(token)) continue
    if (__KUDZU_LIST_MOUNTS__ && list.descriptor.mount) {
      unmountDom(node)
      node.remove()
    } else node.remove()
    if (__KUDZU_LIST_ROW_STATES__ && list.descriptor.rowStates) deleteRowStates(list.descriptor, token)
  }
  if (added) {
    if (__KUDZU_LIST_MOUNTS__ && list.descriptor.mount) {
      const addedNodes = [...additions.childNodes]
      parent.insertBefore(additions, list.boundary)
      for (const node of addedNodes) mountDom(node)
    } else parent.insertBefore(additions, list.boundary)
    list.container ??= parent
  }
  let anchor = list.boundary
  let misplaced = 0
  for (let index = next.length - 1; index >= 0; index--) {
    const node = next[index][1]
    if (node.nextSibling !== anchor) misplaced++
    anchor = node
  }
  if (misplaced > next.length / 2) {
    const reordered = parent.ownerDocument.createDocumentFragment()
    reordered.append(...next.map(([, node]) => node))
    parent.insertBefore(reordered, list.boundary)
  } else if (misplaced) {
    anchor = list.boundary
    for (let index = next.length - 1; index >= 0; index--) {
      const node = next[index][1]
      if (node.nextSibling !== anchor) parent.insertBefore(node, anchor)
      anchor = node
    }
  }
  list.roots = new Map(next)
  list.values = values
  list.items = items
}

function updateNestedList(list, items) {
  const previous = list.items
  if (items === previous) return false
  if (items.length === previous.length && items.every((item, index) => item === previous[index])) {
    list.items = items
    return true
  }
  if (items.length === previous.length && items.every((item, index) => item === previous[previous.length - index - 1])) {
    const tokens = [...list.roots.keys()].reverse()
    const parent = list.container ?? list.start.parentNode
    const reordered = parent.ownerDocument.createDocumentFragment()
    reordered.append(...tokens.map(token => list.roots.get(token)))
    parent.insertBefore(reordered, list.boundary)
    list.roots = new Map(tokens.map(token => [token, list.roots.get(token)]))
    list.items = items
    list.container ??= parent
    return true
  }
  if (items.length === previous.length - 1) {
    let removed = 0
    while (removed < items.length && items[removed] === previous[removed]) removed++
    if (items.every((item, index) => item === previous[index >= removed ? index + 1 : index])) {
      removeListRoot(list, keyToken(previous[removed]?.[list.descriptor.key]))
      list.roots = new Map(items.map(item => {
        const token = keyToken(item[list.descriptor.key])
        return [token, list.roots.get(token)]
      }))
      list.items = items
      return true
    }
  }
  if (items.length === previous.length + 1 && previous.every((item, index) => item === items[index])) {
    const entry = nestedListEntry(list, items.at(-1))
    if (list.roots.has(entry.token)) throw new Error(`Duplicate keyed list key: ${String(entry.key)}`)
    addListRoot(list, entry)
    list.items = items
    return true
  }
  if (items.length !== previous.length) return false
  let changed = -1
  for (let index = 0; index < items.length; index++) {
    if (items[index] === previous[index]) continue
    if (changed !== -1) return false
    changed = index
  }
  if (changed === -1) return false
  const item = items[changed]
  if (item?.[list.descriptor.key] !== previous[changed]?.[list.descriptor.key]) return false
  const entry = nestedListEntry(list, item)
  const node = list.roots.get(entry.token)
  if (!node) return false
  if (list.values.get(entry.token) !== entry.value) {
    fillListItem(node, item, list.descriptor.nested)
    if (__KUDZU_LIST_ITEM_HOOKS__) notifyListItem(list.descriptor.state, node)
    list.values.set(entry.token, entry.value)
  }
  list.items = items
  return true
}

function nestedListEntry(list, item) {
  const key = item?.[list.descriptor.key]
  if (!validListKey(key)) throw new Error(`Keyed list key "${list.descriptor.key}" must be a string or finite number`)
  assertListItem(item)
  if (list.descriptor.child) validateChildLists([item], list.descriptor.child)
  assertListValue(item, new Set(), true)
  return { item, key, token: keyToken(key), value: JSON.stringify(item) }
}

function updateReducerList(list, items) {
  const previous = list.items
  if (items.length === previous.length && items.every((item, index) => item === previous[index])) {
    list.items = items
    return true
  }
  if (items.length === previous.length && items.every((item, index) => item === previous[previous.length - index - 1])) {
    const tokens = [...list.roots.keys()].reverse()
    const parent = list.container ?? list.start.parentNode
    const reordered = parent.ownerDocument.createDocumentFragment()
    reordered.append(...tokens.map(token => list.roots.get(token)))
    parent.insertBefore(reordered, list.boundary)
    list.roots = new Map(tokens.map(token => [token, list.roots.get(token)]))
    list.items = items
    list.container ??= parent
    return true
  }
  if (items.length === previous.length - 1) {
    let removed = 0
    while (removed < items.length && items[removed] === previous[removed]) removed++
    if (items.every((item, index) => item === previous[index >= removed ? index + 1 : index])) {
      removeListRoot(list, keyToken(previous[removed]?.[list.descriptor.key]))
      list.roots = new Map(items.map(item => {
        const token = keyToken(item[list.descriptor.key])
        return [token, list.roots.get(token)]
      }))
      list.items = items
      return true
    }
  }
  if (items.length === previous.length + 1 && previous.every((item, index) => item === items[index])) {
    const item = items.at(-1)
    const key = item?.[list.descriptor.key]
    if (!validListKey(key)) throw new Error(`Keyed list key "${list.descriptor.key}" must be a string or finite number`)
    assertListItem(item)
    const seen = new Set()
    const seededValue = __KUDZU_LIST_SEEDS__ ? list.seedFields && seededListValue(item, list.seedFields, list.descriptor.seed) : undefined
    if (seededValue === undefined) assertListValue(item, seen, true)
    const token = keyToken(key)
    if (list.roots.has(token)) throw new Error(`Duplicate keyed list key: ${String(key)}`)
    addListRoot(list, { item, key, token, value: seededValue === undefined ? JSON.stringify(item) : seededValue })
    list.items = items
    return true
  }
  return false
}

function addListRoot(list, { item, key, token, value }) {
  let node = (__KUDZU_NESTED_LISTS__ ? list.templateRoot : list.start.content.firstElementChild)?.cloneNode(true)
  if (node?.dataset.kListRoot !== list.descriptor.id) node = undefined
  if (!node) throw new Error("Keyed list template has no root element")
  node.removeAttribute("data-k-list-root")
  if (__KUDZU_NESTED_LISTS__ && list.childPrototype) childPrototypes.set(node, list.childPrototype)
  if (__KUDZU_LIST_ROW_STATES__ && list.descriptor.rowStates) initializeRowStates(list.descriptor, key, node)
  mapListItemParts(list.parts, node, list.descriptor.nested)
  fillListItem(node, item, list.descriptor.nested)
  const parent = list.container ?? list.start.parentNode
  parent.insertBefore(node, list.boundary)
  if (__KUDZU_LIST_MOUNTS__ && list.descriptor.mount) mountDom(node)
  list.roots.set(token, node)
  list.values.set(token, value)
  list.container ??= parent
}

function removeListRoot(list, token) {
  const node = list.roots.get(token)
  if (__KUDZU_LIST_MOUNTS__ && list.descriptor.mount) unmountDom(node)
  node.remove()
  if (__KUDZU_LIST_ROW_STATES__ && list.descriptor.rowStates) deleteRowStates(list.descriptor, token)
  list.roots.delete(token)
  list.values.delete(token)
}

function fillListItem(root, item, nested = false) {
  listItems.set(root, item)
  const revision = __KUDZU_LIST_ASYNC_PARTS__ ? (revisions.get(root) ?? 0) + 1 : 0
  if (__KUDZU_LIST_ASYNC_PARTS__) revisions.set(root, revision)
  const parts = listItemParts(root, nested)
  fillListParts(root, parts, item, revision)
  if (__KUDZU_NESTED_LISTS__) {
    const child = ownedLists.get(root)
    if (child) updateList(child)
  }
}

function fillListParts(root, parts, item, revision) {
  if (__KUDZU_LIST_EFFECTS__) for (const node of parts.effects) node.dataset.kEffectItem = JSON.stringify(item)
  for (const [node, field] of parts.directTexts) {
    const text = item?.[field]
    const value = text == null ? "" : String(text)
    const current = node.firstChild
    if (current?.nodeType === Node.TEXT_NODE && !current.nextSibling) {
      if (current.data !== value) current.data = value
    } else {
      node.textContent = value
    }
  }
  if (__KUDZU_LIST_TEXT_RANGES__) {
    for (const [marker, field] of parts.texts) patchListText(marker, "template[data-k-list-text-end]", item?.[field])
  }
  if (__KUDZU_LIST_ATTRIBUTES__) {
    for (const [node, attributes] of parts.attributes) {
      for (const [target, field] of attributes) patchBinding(node, target, item?.[field])
    }
  }
  if (__KUDZU_LIST_EVENTS__) {
    for (const [node, events] of parts.events) {
      for (const [event, native] of JSON.parse(events)) {
        native.scope = Object.fromEntries(Object.entries(native.scope).map(([name, value]) => [name, value?.type === "list-item" ? serializeItem(item) : value]))
        node.dataset[`kNative${capitalize(event)}`] = JSON.stringify(native)
      }
    }
  }
  if (__KUDZU_LIST_EXPRESSIONS__) {
    for (const [marker, descriptor] of parts.expressions) {
      evaluate(descriptor, item).then(value => {
        if (revisions.get(root) === revision && root.isConnected) patchListText(marker, "template[data-k-list-expression-end]", value)
      }).catch(error => console.error(error))
    }
  }
  if (__KUDZU_LIST_EXPRESSION_ATTRIBUTES__) {
    for (const [node, attributes] of parts.expressionAttributes) {
      for (const [target, module, handler] of attributes) {
        evaluate({ module, handler }, item).then(value => {
          if (revisions.get(root) === revision && root.isConnected) patchBinding(node, target, value)
        }).catch(error => console.error(error))
      }
    }
  }
  if (__KUDZU_LIST_CONDITIONS__) {
    for (const [marker, descriptor] of parts.conditions) {
      evaluate(descriptor, item).then(value => {
        if (revisions.get(root) === revision && root.isConnected) updateListCondition(marker, descriptor.kind, value, item)
      }).catch(error => console.error(error))
    }
  }
}

function listItemParts(root, nested = false) {
  let parts = itemParts.get(root)
  if (parts) return parts
  parts = { directTexts: [], texts: [], attributes: [], events: [], expressions: [], expressionAttributes: [], conditions: [], effects: [] }
  for (const node of nested ? ownedElements(root).filter(node => node.matches(itemPartsSelector)) : matching(root, itemPartsSelector)) {
    if (node.hasAttribute("data-k-list-text")) (node.tagName === "TEMPLATE" ? parts.texts : parts.directTexts).push([node, node.dataset.kListText])
    if (__KUDZU_LIST_ATTRIBUTES__ && node.hasAttribute("data-k-list-attrs")) parts.attributes.push([node, JSON.parse(node.dataset.kListAttrs)])
    if (__KUDZU_LIST_EVENTS__ && node.hasAttribute("data-k-list-events")) parts.events.push([node, node.dataset.kListEvents])
    if (__KUDZU_LIST_EXPRESSIONS__ && node.hasAttribute("data-k-list-expression")) parts.expressions.push([node, JSON.parse(node.dataset.kListExpression)])
    if (__KUDZU_LIST_EXPRESSION_ATTRIBUTES__ && node.hasAttribute("data-k-list-expression-attrs")) parts.expressionAttributes.push([node, JSON.parse(node.dataset.kListExpressionAttrs)])
    if (__KUDZU_LIST_CONDITIONS__ && node.hasAttribute("data-k-list-condition")) {
      const encoded = node.dataset.kListCondition || conditionTemplates.get(node)?.dataset.kListCondition
      parts.conditions.push([node, encoded ? JSON.parse(encoded) : undefined])
      conditionOwners.set(node, root)
    }
    if (__KUDZU_LIST_EFFECTS__ && node.hasAttribute("data-k-effects")) parts.effects.push(node)
  }
  itemParts.set(root, parts)
  return parts
}

function listItemPartPlan(template, nested = false) {
  const source = nested ? ownedElements(template) : [template, ...template.querySelectorAll("*")]
  const indexes = new Map(source.map((node, index) => [node, index]))
  const parts = listItemParts(template, nested)
  return {
    directTexts: parts.directTexts.map(([node, field]) => [indexes.get(node), field]),
    texts: __KUDZU_LIST_TEXT_RANGES__ ? parts.texts.map(([node, field]) => [indexes.get(node), field]) : [],
    attributes: __KUDZU_LIST_ATTRIBUTES__ ? parts.attributes.map(([node, attributes]) => [indexes.get(node), attributes]) : [],
    events: __KUDZU_LIST_EVENTS__ ? parts.events.map(([node, events]) => [indexes.get(node), events]) : [],
    expressions: __KUDZU_LIST_EXPRESSIONS__ ? parts.expressions.map(([node, descriptor]) => [indexes.get(node), descriptor]) : [],
    expressionAttributes: __KUDZU_LIST_EXPRESSION_ATTRIBUTES__ ? parts.expressionAttributes.map(([node, attributes]) => [indexes.get(node), attributes]) : [],
    conditions: __KUDZU_LIST_CONDITIONS__ ? parts.conditions.map(([node, descriptor]) => [indexes.get(node), descriptor, node]) : [],
    effects: __KUDZU_LIST_EFFECTS__ ? parts.effects.map(node => indexes.get(node)) : []
  }
}

function mapListItemParts(parts, root, nested = false) {
  const target = nested ? ownedElements(root) : [root, ...root.querySelectorAll("*")]
  itemParts.set(root, {
    directTexts: parts.directTexts.map(([index, field]) => [target[index], field]),
    texts: __KUDZU_LIST_TEXT_RANGES__ ? parts.texts.map(([index, field]) => [target[index], field]) : [],
    attributes: __KUDZU_LIST_ATTRIBUTES__ ? parts.attributes.map(([index, attributes]) => [target[index], attributes]) : [],
    events: __KUDZU_LIST_EVENTS__ ? parts.events.map(([index, events]) => [target[index], events]) : [],
    expressions: __KUDZU_LIST_EXPRESSIONS__ ? parts.expressions.map(([index, descriptor]) => [target[index], descriptor]) : [],
    expressionAttributes: __KUDZU_LIST_EXPRESSION_ATTRIBUTES__ ? parts.expressionAttributes.map(([index, attributes]) => [target[index], attributes]) : [],
    conditions: __KUDZU_LIST_CONDITIONS__ ? parts.conditions.map(([index, descriptor]) => {
      conditionOwners.set(target[index], root)
      return [target[index], descriptor]
    }) : [],
    effects: __KUDZU_LIST_EFFECTS__ ? parts.effects.map(index => target[index]) : []
  })
}

function mapListConditionTemplates(planned, initial) {
  if (planned.length !== initial.length) throw new Error("Keyed list condition markers do not match its template")
  for (let index = 0; index < initial.length; index++) {
    const marker = initial[index][0]
    initial[index][1] ??= planned[index][1]
    if (!marker.content.querySelector("template[data-k-list-true],template[data-k-list-false]")) conditionTemplates.set(marker, planned[index][2])
  }
}

function updateListCondition(marker, kind, value, item) {
  const current = listConditionKey(kind, value)
  if (marker.dataset.kListCurrent === current) return
  let end = marker.nextSibling
  while (end && !(end.nodeType === Node.ELEMENT_NODE && end.matches("template[data-k-list-condition-end]"))) end = end.nextSibling
  if (!end) throw new Error("Keyed list condition marker has no end")
  for (let node = marker.nextSibling; node && node !== end;) {
    const next = node.nextSibling
    unmountDom(node)
    node.remove()
    node = next
  }
  const falseText = kind === "and" && !value ? renderFalsy(value) : ""
  const selector = value ? "template[data-k-list-true]" : "template[data-k-list-false]"
  const branch = marker.content.querySelector(selector) ?? conditionTemplates.get(marker)?.content.querySelector(selector)
  if (!falseText && !branch) throw new Error("Keyed list condition marker has no branch template")
  const fragment = falseText
    ? marker.ownerDocument.createDocumentFragment()
    : branch.content.cloneNode(true)
  if (falseText) fragment.append(marker.ownerDocument.createTextNode(falseText))
  const nodes = [...fragment.childNodes]
  const revision = (revisions.get(marker) ?? 0) + 1
  revisions.set(marker, revision)
  fillListParts(marker, listItemParts(fragment), item, revision)
  end.parentNode.insertBefore(fragment, end)
  marker.dataset.kListCurrent = current
  const owner = conditionOwners.get(marker)
  if (owner) itemParts.delete(owner)
  for (const node of nodes) mountDom(node)
}

function listConditionKey(kind, value) {
  return value ? "true" : kind === "and" ? `false:${renderFalsy(value)}` : "false"
}

function renderFalsy(value) {
  return value === false || value == null || value === true ? "" : String(value)
}

function validateChildLists(items, child) {
  for (const item of items) {
    const children = item?.[child.field]
    if (!Array.isArray(children)) throw new Error(`Nested keyed list property "${child.field}" must remain an array`)
    const keys = new Set()
    for (const entry of children) {
      const key = entry?.[child.key]
      if (!validListKey(key)) throw new Error(`Keyed list key "${child.key}" must be a string or finite number`)
      assertListItem(entry)
      assertListValue(entry, new Set(), true)
      const token = keyToken(key)
      if (keys.has(token)) throw new Error(`Duplicate keyed list key: ${String(key)}`)
      keys.add(token)
    }
  }
}

function listOwner(start) {
  let owner = start.parentElement
  while (owner && !listItems.has(owner)) owner = owner.parentElement
  return owner
}

function mountNestedPrototype(start, descriptor, roots) {
  const owner = descriptor.ownerField ? listOwner(start) : undefined
  const prototypeStart = owner ? childPrototypes.get(owner) : undefined
  const templateRoot = prototypeStart?.content.firstElementChild ?? start.content.firstElementChild
  if (!templateRoot) throw new Error("Nested keyed list has no shared row prototype")
  const childPrototype = descriptor.child ? findChildPrototype(templateRoot, descriptor.child.field) : undefined
  if (descriptor.child && !childPrototype) throw new Error("Keyed list template has no nested row prototype")
  if (childPrototype) for (const root of roots) childPrototypes.set(root, childPrototype)
  if (prototypeStart && start !== prototypeStart) start.content.replaceChildren()
  return { owner, childPrototype, templateRoot }
}

function findChildPrototype(root, field) {
  for (const element of root.children) {
    if (element.matches("template[data-k-list]")) {
      if (JSON.parse(element.dataset.kList).ownerField === field) return element
      const nested = findChildPrototype(element.content, field)
      if (nested) return nested
    } else {
      const nested = findChildPrototype(element, field)
      if (nested) return nested
    }
  }
}

function ownedElements(root) {
  const elements = []
  const visit = node => {
    elements.push(node)
    for (let child = node.firstElementChild; child;) {
      if (child.matches("template[data-k-list]")) {
        const end = findEnd(child, JSON.parse(child.dataset.kList).id)
        elements.push(child, end)
        child = end.nextElementSibling
      } else {
        const next = child.nextElementSibling
        visit(child)
        child = next
      }
    }
  }
  visit(root)
  return elements
}

function listRoots(start, end) {
  const roots = []
  for (let node = start.nextSibling; node && node !== end; node = node.nextSibling) {
    if (node.nodeType === Node.ELEMENT_NODE) roots.push(node)
  }
  return roots
}

function seedListItem(root, descriptor, index) {
  const item = { [descriptor.key]: descriptor.keys[index] }
  const parts = itemParts.get(root)
  for (const [node, field] of parts.directTexts) item[field] = seedValue(node.textContent, descriptor.seed[field])
  for (const [marker, field] of parts.texts) item[field] = seedValue(rangeText(marker, "template[data-k-list-text-end]"), descriptor.seed[field])
  return item
}

function seedValue(value, type) {
  if (type === "number") return Number(value)
  if (type === "boolean") return value === "true"
  if (type === "null") return null
  return value
}

function rangeText(marker, endSelector) {
  let value = ""
  for (let node = marker.nextSibling; node && !(node.nodeType === Node.ELEMENT_NODE && node.matches(endSelector)); node = node.nextSibling) value += node.textContent
  return value
}

function patchListText(marker, endSelector, value) {
  let end = marker.nextSibling
  while (end && !(end.nodeType === Node.ELEMENT_NODE && end.matches(endSelector))) end = end.nextSibling
  if (!end) throw new Error("Keyed list text marker has no end")
  const text = value == null ? "" : String(value)
  const current = marker.nextSibling
  if (current?.nodeType === Node.TEXT_NODE && current.nextSibling === end) {
    if (current.data !== text) current.data = text
    return
  }
  const range = marker.ownerDocument.createRange()
  range.setStartAfter(marker)
  range.setEndBefore(end)
  range.deleteContents()
  end.before(marker.ownerDocument.createTextNode(text))
}

function evaluate(descriptor, item) {
  let module = imports.get(descriptor.module)
  if (!module) {
    module = import(descriptor.module)
    imports.set(descriptor.module, module)
  }
  return module.then(exports => {
    const value = exports[descriptor.handler](item)
    if (value && typeof value.then === "function") throw new Error("Derived keyed list item expressions must return synchronous values")
    return value
  })
}

function serializeItem(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number") return value
  if (Array.isArray(value)) return { type: "array", value: value.map(serializeItem) }
  return { type: "object", nullPrototype: false, value: Object.entries(value).map(([key, entry]) => [key, serializeItem(entry)]) }
}

function patchBinding(node, target, value) {
  /* list-style */
  if (target === "disabled") {
    node.toggleAttribute("disabled", Boolean(value))
  } else if (target === "checked") {
    node.checked = Boolean(value)
  } else if (target === "value") {
    const next = value == null ? "" : String(value)
    if (node.value !== next) node.value = next
  } else if (target === "class" && (value == null || value === false)) {
    node.removeAttribute("class")
  } else if (target === "class") {
    node.setAttribute("class", String(value))
  } else if (value == null || (value === false && !isStringBooleanAttribute(target))) {
    node.removeAttribute(target)
  } else {
    node.setAttribute(target, value === true && !isStringBooleanAttribute(target) ? "" : String(value))
  }
}

function keyToken(key) {
  return `${typeof key}:${key}`
}

function initializeRowStates(descriptor, key, root) {
  const token = keyToken(key)
  const replacements = new Map()
  for (const state of descriptor.rowStates) {
    const id = rowStateId(state.id, token)
    if (!browserState.has(id)) browserState.set(id, state.initialValue)
    replacements.set(state.id, id)
  }
  for (const marker of descriptor.rowConditions ?? []) replacements.set(marker, rowStateId(marker, token))
  if (root) replaceRowIds(root, replacements)
}

function deleteRowStates(descriptor, token) {
  for (const state of descriptor.rowStates) browserState.delete(rowStateId(state.id, token))
}

function rowStateId(id, token) {
  return id.replace("$k", encodeURIComponent(token))
}

function replaceRowIds(root, replacements) {
  const replace = node => {
    for (const attribute of [...node.attributes]) {
      if (!attribute.name.startsWith("data-k-")) continue
      let value = attribute.value
      for (const [template, id] of replacements) if (value.includes(template)) value = value.replaceAll(template, id)
      if (value !== attribute.value) attribute.value = value
    }
    for (const child of node.children) replace(child)
    for (const child of node.content?.children ?? []) replace(child)
  }
  replace(root)
}

function validListKey(key) {
  return typeof key === "string" || typeof key === "number" && Number.isFinite(key)
}

function assertListItem(item) {
  const prototype = item && typeof item === "object" ? Object.getPrototypeOf(item) : undefined
  if (!item || Array.isArray(item) || prototype !== Object.prototype) throw new Error("Keyed list items must be ordinary plain objects")
}

function seededListValue(item, fields, seed) {
  const keys = Reflect.ownKeys(item)
  if (fields.length === 1) {
    const field = fields[0]
    if (keys.length !== 1 || keys[0] !== field) return undefined
    const descriptor = Object.getOwnPropertyDescriptor(item, field)
    if (!descriptor.enumerable) throw new Error("Keyed list items must not contain non-enumerable properties")
    if (!("value" in descriptor)) throw new Error("Keyed list items must not contain accessors")
    const value = descriptor.value
    const type = value === null ? "null" : typeof value
    return type === seed[field] && !(type === "number" && (!Number.isFinite(value) || Object.is(value, -0))) ? value : undefined
  }
  if (keys.length !== fields.length || keys.some(key => typeof key !== "string" || !fields.includes(key))) return undefined
  const values = []
  for (const field of fields) {
    const descriptor = Object.getOwnPropertyDescriptor(item, field)
    if (!descriptor.enumerable) throw new Error("Keyed list items must not contain non-enumerable properties")
    if (!("value" in descriptor)) throw new Error("Keyed list items must not contain accessors")
    const value = descriptor.value
    const type = value === null ? "null" : typeof value
    if (type !== seed[field] || type === "number" && (!Number.isFinite(value) || Object.is(value, -0))) return undefined
    values.push(value)
  }
  return values.length === 1 ? values[0] : JSON.stringify(values)
}

function assertListValue(value, seen, root = false) {
  if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0)) return
  if (!value || typeof value !== "object") throw new Error("Keyed list items must contain only JSON-safe values")
  if (seen.has(value)) throw new Error("Keyed list items must not contain cycles")
  if (!root && !Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype) throw new Error("Keyed list items must contain only arrays and ordinary plain objects")
  seen.add(value)
  const keys = Reflect.ownKeys(value)
  if (keys.some(key => typeof key === "symbol")) throw new Error("Keyed list items must not contain symbols")
  if (Array.isArray(value) && keys.some(key => key !== "length" && !/^(0|[1-9]\d*)$/.test(key))) throw new Error("Keyed list arrays must not contain custom properties")
  if (Array.isArray(value) && Object.keys(value).length !== value.length) throw new Error("Keyed list arrays must not contain holes")
  for (const key of keys) {
    if (Array.isArray(value) && key === "length") continue
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    if (!descriptor.enumerable) throw new Error("Keyed list items must not contain non-enumerable properties")
    if (!("value" in descriptor)) throw new Error("Keyed list items must not contain accessors")
    assertListValue(descriptor.value, seen)
  }
  seen.delete(value)
}

function findEnd(start, id) {
  for (let node = start.nextElementSibling; node; node = node.nextElementSibling) {
    if (node.matches("template[data-k-list-end]") && node.dataset.kListEnd === id) return node
  }
  throw new Error("Keyed list marker has no end")
}

function register(targets, id, entry) {
  const entries = targets.get(id) ?? new Set()
  entries.add(entry)
  targets.set(id, entries)
}

function matching(root, selector) {
  return [...(root.matches?.(selector) ? [root] : []), ...(root.querySelectorAll?.(selector) ?? [])]
}

function isStringBooleanAttribute(name) {
  return name.startsWith("aria-") || name.startsWith("data-")
}

function capitalize(value) {
  return value[0].toUpperCase() + value.slice(1)
}
