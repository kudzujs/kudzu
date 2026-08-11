import { browserState, mountDom, notifyListItem, registerCommitter, registerMountHook, registerUnmountHook, releaseState, unmountDom } from "./shared-runtime.js"
import { selectCollection } from "./collection-selector.js"
const loadListEvaluator = descriptor => import("./binding-runtime.js").then(module => module.loadEvaluator(descriptor))

const listTargets = new Map()
const listRegistrations = new WeakMap()
const listLoads = new WeakMap()
const mountedLists = new WeakSet()
const imports = __KUDZU_LIST_ASYNC_PARTS__ ? new Map() : undefined
const revisions = __KUDZU_LIST_ASYNC_PARTS__ ? new WeakMap() : undefined
const itemParts = new WeakMap()
const listItems = new WeakMap()
const listIndexes = __KUDZU_LIST_INDEXES__ ? new WeakMap() : undefined
const ownershipPaths = __KUDZU_LIST_ROW_HOOKS__ ? new WeakMap() : undefined
const rowReplacements = __KUDZU_LIST_ROW_HOOKS__ ? new WeakMap() : undefined
const ownedLists = __KUDZU_NESTED_LISTS__ ? new WeakMap() : undefined
const conditionOwners = __KUDZU_LIST_CONDITIONS__ ? new WeakMap() : undefined
const conditionTemplates = __KUDZU_LIST_CONDITIONS__ ? new WeakMap() : undefined
const itemPartsSelector = `[data-k-list-text]${__KUDZU_LIST_ATTRIBUTES__ ? ",[data-k-list-attrs]" : ""}${__KUDZU_LIST_EVENTS__ ? ",[data-k-list-events]" : ""}${__KUDZU_LIST_EXPRESSIONS__ ? ",[data-k-list-expression]" : ""}${__KUDZU_LIST_EXPRESSION_ATTRIBUTES__ ? ",[data-k-list-expression-attrs]" : ""}${__KUDZU_LIST_CONDITIONS__ ? ",[data-k-list-condition]" : ""}${__KUDZU_LIST_EFFECTS__ ? ",[data-k-effects]" : ""}`
const childPrototypes = __KUDZU_NESTED_LISTS__ ? new WeakMap() : undefined
const itemPartPlans = __KUDZU_NESTED_LISTS__ ? new WeakMap() : undefined

function commitLists(id) {
  const lists = listTargets.get(id)
  if (!lists) return
  for (const list of lists) {
    if (!list.start.isConnected) unregisterList(list.start)
    else {
      if (list.updateStates.has(id)) updateList(list)
      if (list.expressionStates.has(id)) updateListExpressions(list)
    }
  }
}

registerCommitter(commitLists)
registerMountHook(mountLists)
registerUnmountHook(unmountLists)

if (typeof document !== "undefined") mountDom(document)

function mountLists(root) {
  let owner = root.nodeType === Node.ELEMENT_NODE ? root : root.parentElement
  while (owner && !listItems.has(owner)) owner = owner.parentElement
  if (owner) fillListParts(root, listItemParts(root), listItems.get(owner), 0, __KUDZU_LIST_INDEXES__ ? listIndexes.get(owner) ?? 0 : 0)
  for (const start of matching(root, "template[data-k-list]")) {
    if (mountedLists.has(start)) continue
    mountedLists.add(start)
    const descriptor = JSON.parse(start.dataset.kList)
    const end = findEnd(start, descriptor.id)
    const roots = listRoots(start, end)
    const nested = __KUDZU_NESTED_LISTS__ ? mountNestedPrototype(start, descriptor, roots) : undefined
    const templateRoot = __KUDZU_NESTED_LISTS__ ? nested.templateRoot : listTemplateRoot(start, descriptor)
    if (__KUDZU_LIST_ROW_HOOKS__) for (let index = 0; index < roots.length; index++) initializeGeneralRowHooks(descriptor, descriptor.keys[index], roots[index], nested?.owner)
    const parts = listItemPartPlan(templateRoot, descriptor.nested)
    const staticRows = __KUDZU_STATIC_COLLECTIONS__ && descriptor.static && parts.directFill ? new Map() : undefined
    for (const root of roots) {
      if (__KUDZU_LIST_CONDITIONS__ && descriptor.conditions) {
        if (__KUDZU_NESTED_LISTS__ && descriptor.ownerField) itemPartPlans.set(root, parts)
        const initialParts = listItemParts(root, descriptor.nested)
        mapListConditionTemplates(parts.conditions, initialParts.conditions)
      } else mapListItemParts(parts, root, descriptor.nested)
    }
    if (__KUDZU_LIST_SEEDS__ && descriptor.seed && !browserState.has(descriptor.state)) browserState.set(descriptor.state, roots.map((root, index) => seedListItem(root, descriptor, index)))
    const items = browserState.get(descriptor.state)
    const staticEntries = __KUDZU_STATIC_COLLECTIONS__ && descriptor.static && descriptor.key !== null && !descriptor.indexed && descriptor.selector?.every(operation => operation[0] === "filter") && parts.directFill
      ? cacheStaticListEntries(descriptor, items)
      : undefined
    const list = {
      start,
      descriptor,
      templateRoot,
      ...(__KUDZU_NESTED_LISTS__ && nested.childPrototypes?.size ? { childPrototypes: nested.childPrototypes } : {}),
      parts,
      ...(__KUDZU_STATIC_COLLECTIONS__ && staticRows ? { staticRows } : {}),
      ...(__KUDZU_STATIC_COLLECTIONS__ && staticEntries ? { staticEntries, staticPositions: staticEntries.positions } : {}),
      seedFields: __KUDZU_LIST_SEEDS__ && (descriptor.seed || descriptor.valueSeed) && Object.keys(descriptor.seed ?? descriptor.valueSeed),
      valueSeed: __KUDZU_LIST_SEEDS__ && (descriptor.seed ?? descriptor.valueSeed),
      roots: new Map(roots.map((node, index) => [keyToken(descriptor.keys[index]), node])),
      ...(__KUDZU_LIST_STABLE_FAST_PATHS__ ? { orderedRoots: roots } : {}),
      values: new Map(),
      items: undefined,
      updateStates: new Set(),
      expressionStates: new Set(descriptor.expressionStates ?? []),
      container: roots[0]?.parentNode,
      boundary: end,
      ...(__KUDZU_NESTED_LISTS__ && descriptor.ownerField ? { owner: nested.owner } : {})
    }
    if (__KUDZU_NESTED_LISTS__ && descriptor.ownerField) {
      if (!list.owner) throw new Error("Nested keyed list has no parent row")
      const lists = ownedLists.get(list.owner) ?? new Map()
      if (lists.has(descriptor.id)) throw new Error(`Duplicate nested keyed list ID: ${descriptor.id}`)
      lists.set(descriptor.id, list)
      ownedLists.set(list.owner, lists)
      listRegistrations.set(start, { list, owner: list.owner })
    } else if (descriptor.source) {
      const load = {}
      listLoads.set(start, load)
      loadListEvaluator(descriptor.source).then(evaluator => {
        if (listLoads.get(start) !== load || !start.isConnected) return
        list.sourceEvaluator = evaluator
        const updateStates = [...new Set([...evaluator.stateIds, ...(__KUDZU_COLLECTION_SELECTORS__ ? Object.values(descriptor.selectorStates ?? {}) : [])])]
        const states = [...new Set([...updateStates, ...list.expressionStates])]
        list.updateStates = new Set(updateStates)
        for (const state of states) register(listTargets, state, list)
        listRegistrations.set(start, { states, list })
        updateList(list)
      }).catch(error => console.error(error))
    } else {
      const updateStates = [descriptor.state, ...(__KUDZU_COLLECTION_SELECTORS__ ? Object.values(descriptor.selectorStates ?? {}) : [])]
      const states = [...new Set([...updateStates, ...list.expressionStates])]
      list.updateStates = new Set(updateStates)
      for (const state of states) register(listTargets, state, list)
      listRegistrations.set(start, { states, list })
    }
    if (!descriptor.source) updateList(list)
  }
}

function unmountLists(root) {
  for (const start of matching(root, "template[data-k-list]")) unregisterList(start)
}

function unregisterList(start) {
  listLoads.delete(start)
  const registration = listRegistrations.get(start)
  if (registration) {
    if (__KUDZU_NESTED_LISTS__ && registration.owner) {
      const lists = ownedLists.get(registration.owner)
      if (lists?.get(registration.list.descriptor.id) === registration.list) lists.delete(registration.list.descriptor.id)
      if (!lists?.size) ownedLists.delete(registration.owner)
    } else {
      if (registration.states) {
        for (const state of registration.states) {
          const lists = listTargets.get(state)
          lists?.delete(registration.list)
          if (!lists?.size) listTargets.delete(state)
        }
      } else {
        const lists = listTargets.get(registration.state)
        lists?.delete(registration.list)
        if (!lists?.size) listTargets.delete(registration.state)
      }
    }
    if (__KUDZU_LIST_ROW_HOOKS__ && registration.list.descriptor.rowStates) for (const node of registration.list.roots.values()) deleteRowStates(registration.list.descriptor, ownershipPaths.get(node))
  }
  listRegistrations.delete(start)
  mountedLists.delete(start)
}

function updateList(list) {
  if (list.sourceEvaluator) browserState.set(list.descriptor.state, list.sourceEvaluator.read())
  let items = __KUDZU_NESTED_LISTS__ && list.descriptor.ownerField
    ? listItems.get(list.owner)?.[list.descriptor.ownerField]
    : browserState.get(list.descriptor.state)
  if (__KUDZU_NESTED_LISTS__ && list.descriptor.ownerField && items == null) items = []
  if (__KUDZU_COLLECTION_SELECTORS__) items = selectCollection(items, list.descriptor.selector, name => browserState.get(list.descriptor.selectorStates?.[name]))
  if (!Array.isArray(items)) throw new Error(list.descriptor.ownerField ? `Nested keyed list property "${list.descriptor.ownerField}" must remain an array` : "Keyed list state must remain an array")
  if (__KUDZU_NESTED_LISTS__ && (list.descriptor.children || list.descriptor.ownerField) && !list.descriptor.indexed && !list.descriptor.selector && list.descriptor.key !== null && list.items && updateNestedList(list, items)) return
  if (__KUDZU_NESTED_LISTS__ && list.descriptor.children) validateChildLists(items, list.descriptor.children)
  if (list.descriptor.reducer && !list.descriptor.selector && list.descriptor.key !== null && list.items && updateReducerList(list, items)) return
  if (__KUDZU_LIST_STABLE_FAST_PATHS__ && list.descriptor.key !== null && !list.descriptor.indexed && !list.descriptor.selector && !list.descriptor.reducer && !list.descriptor.children && !list.descriptor.ownerField && list.items && updateStableList(list, items)) return
  if (__KUDZU_STATIC_COLLECTIONS__ && list.staticEntries && updateStaticFilterList(list, items)) return
  const entries = []
  const keys = new Set()
  const seen = new Set()
  const referenceOnly = usesItemReferences(list)
  for (const [index, item] of items.entries()) {
    const key = list.descriptor.key === null ? index : item?.[list.descriptor.key]
    if (!validListKey(key)) throw new Error(`Keyed list key "${list.descriptor.key}" must be a string or finite number`)
    assertListItem(item)
    const seededValue = __KUDZU_LIST_SEEDS__ ? list.seedFields && seededListValue(item, list.seedFields, list.valueSeed, !referenceOnly) : undefined
    if (seededValue === undefined) assertListValue(item, seen, true)
    const token = keyToken(key)
    if (keys.has(token)) throw new Error(`Duplicate keyed list key: ${String(key)}`)
    keys.add(token)
    entries.push({ item, index, key, token, value: referenceOnly ? item : seededValue === undefined ? JSON.stringify(item) : seededValue })
  }
  if (list.items === undefined && list.parts.directFill && entries.length === list.roots.size) {
    const roots = __KUDZU_LIST_STABLE_FAST_PATHS__ ? list.orderedRoots : [...list.roots.values()]
    if (entries.every((entry, index) => list.roots.get(entry.token) === roots[index])) {
      for (let index = 0; index < entries.length; index++) {
        const entry = entries[index]
        listItems.set(roots[index], entry.item)
        if (__KUDZU_LIST_INDEXES__) listIndexes.set(roots[index], index)
        if (!referenceOnly) list.values.set(entry.token, entry.value)
      }
      list.items = items
      return
    }
  }
  if (list.descriptor.key !== null && !list.descriptor.indexed && !list.descriptor.selector && (referenceOnly || list.values.size) && entries.every(entry => {
    const root = list.roots.get(entry.token)
    return !root || (referenceOnly ? listItems.get(root) === entry.item : list.values.get(entry.token) === entry.value)
  })) {
    const currentTokens = [...list.roots.keys()]
    const nextTokens = entries.map(entry => entry.token)
    if (nextTokens.length === currentTokens.length && nextTokens.every((token, index) => token === currentTokens[currentTokens.length - index - 1])) {
      const nextRoots = nextTokens.map(token => [token, list.roots.get(token)])
      const parent = list.container ?? list.start.parentNode
      const reordered = parent.ownerDocument.createDocumentFragment()
      reordered.append(...nextRoots.map(([, node]) => node))
      parent.insertBefore(reordered, list.boundary)
      list.roots = new Map(nextRoots)
      if (__KUDZU_LIST_STABLE_FAST_PATHS__) list.orderedRoots = nextRoots.map(([, node]) => node)
      list.container ??= parent
      list.items = items
      return
    }
    if (nextTokens.length === currentTokens.length - 1) {
      const removed = currentTokens.find(token => !keys.has(token))
      const removedIndex = currentTokens.indexOf(removed)
      if (removed && nextTokens.every((token, index) => token === currentTokens[index >= removedIndex ? index + 1 : index])) {
        removeListRoot(list, removed)
        if (__KUDZU_LIST_STABLE_FAST_PATHS__) list.orderedRoots = nextTokens.map(token => list.roots.get(token))
        list.items = items
        return
      }
    }
    if (nextTokens.length === currentTokens.length + 1 && currentTokens.every((token, index) => token === nextTokens[index])) {
      const entry = entries.at(-1)
      addListRoot(list, entry)
      list.items = items
      return
    }
  }
  const next = []
  const values = new Map()
  const parent = list.container ?? list.start.parentNode
  const additions = parent.ownerDocument.createDocumentFragment()
  let added = false
  for (const { item, index, key, token, value } of entries) {
    let node = list.roots.get(token)
    if (!node) {
      const staticRoot = __KUDZU_STATIC_COLLECTIONS__ ? list.staticRows?.get(token)?.cloneNode(true) : undefined
      node = staticRoot ?? list.templateRoot?.cloneNode(true)
      if (!staticRoot && node?.dataset.kListRoot !== list.descriptor.id) node = undefined
      if (!node) throw new Error("Keyed list template has no root element")
      node.removeAttribute("data-k-list-root")
      if (__KUDZU_NESTED_LISTS__ && list.childPrototypes) childPrototypes.set(node, list.childPrototypes)
      if (__KUDZU_LIST_ROW_HOOKS__) initializeGeneralRowHooks(list.descriptor, key, node, list.owner)
      if (staticRoot) listItems.set(node, item)
      else if (list.parts.directFill) {
        listItems.set(node, item)
        fillStructuralListParts(list.parts, node, item)
      } else fillListItem(node, item, list.descriptor.nested, index, mapListItemParts(list.parts, node, list.descriptor.nested))
      additions.append(node)
      added = true
    } else if ((referenceOnly ? listItems.get(node) !== item : list.values.get(token) !== value) || list.descriptor.indexed || list.descriptor.key === null) {
      fillListItem(node, item, list.descriptor.nested, index)
      if (__KUDZU_LIST_ITEM_HOOKS__) notifyListItem(list.descriptor.state, node)
    }
    next.push([token, node])
    if (!referenceOnly) values.set(token, value)
  }
  for (const [token, node] of list.roots) {
    if (keys.has(token)) continue
    if (list.descriptor.fastRelease) node.remove()
    else if (__KUDZU_LIST_MOUNTS__ && list.descriptor.mount) {
      unmountDom(node)
      node.remove()
    } else node.remove()
    if (__KUDZU_LIST_ROW_HOOKS__ && list.descriptor.rowStates) deleteRowStates(list.descriptor, ownershipPaths.get(node))
  }
  let ordered = false
  if (added) {
    const addedNodes = __KUDZU_LIST_MOUNTS__ && list.descriptor.mount ? [...additions.childNodes] : undefined
    let seenAddition = false
    let interleaved = false
    for (const [, node] of next) {
      if (node.parentNode === additions) seenAddition = true
      else if (seenAddition) {
        interleaved = true
        break
      }
    }
    if (interleaved) {
      const run = parent.ownerDocument.createDocumentFragment()
      for (const [, node] of next) {
        if (node.parentNode === additions) run.append(node)
        else if (run.firstChild) parent.insertBefore(run, node)
      }
      if (run.firstChild) parent.insertBefore(run, list.boundary)
      ordered = true
    } else parent.insertBefore(additions, list.boundary)
    if (addedNodes?.length > 32 && addedNodes.length * 2 > next.length && addedNodes.length * 2 > parent.children.length && !list.descriptor.children && !list.descriptor.ownerField) mountDom(parent)
    else if (addedNodes) for (const node of addedNodes) mountDom(node)
    list.container ??= parent
  }
  let anchor = list.boundary
  let misplaced = 0
  if (!ordered) {
    for (let index = next.length - 1; index >= 0; index--) {
      const node = next[index][1]
      if (node.nextSibling !== anchor) misplaced++
      anchor = node
    }
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
  if (__KUDZU_LIST_STABLE_FAST_PATHS__) list.orderedRoots = next.map(([, node]) => node)
  list.values = values
  list.items = items
}

function updateStaticFilterList(list, items) {
  const entries = new Array(items.length)
  for (let index = 0; index < items.length; index++) {
    const entry = list.staticEntries.get(items[index])
    if (!entry || !list.roots.has(entry.token) && !list.staticRows.has(entry.token)) return false
    entries[index] = entry
  }
  let selectedIndex = 0
  for (const [token, node] of list.roots) {
    const position = list.staticPositions.get(token)
    while (entries[selectedIndex]?.position < position) selectedIndex++
    if (entries[selectedIndex]?.token === token) {
      selectedIndex++
      continue
    }
    list.staticRows.set(token, node)
    node.remove()
  }
  const parent = list.container ?? list.start.parentNode
  const run = parent.ownerDocument.createDocumentFragment()
  const next = new Array(entries.length)
  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index]
    let node = list.roots.get(entry.token)
    if (!node) {
      node = list.staticRows.get(entry.token).cloneNode(true)
      listItems.set(node, entry.item)
      run.append(node)
    } else if (run.firstChild) parent.insertBefore(run, node)
    next[index] = [entry.token, node]
  }
  if (run.firstChild) parent.insertBefore(run, list.boundary)
  list.roots = new Map(next)
  if (__KUDZU_LIST_STABLE_FAST_PATHS__) list.orderedRoots = next.map(([, node]) => node)
  list.values.clear()
  list.items = items
  list.container ??= parent
  return true
}

function cacheStaticListEntries(descriptor, items) {
  if (!Array.isArray(items)) return undefined
  const entries = new WeakMap()
  const positions = new Map()
  const keys = new Set()
  const seen = new Set()
  for (let position = 0; position < items.length; position++) {
    const item = items[position]
    assertListItem(item)
    assertListValue(item, seen, true)
    const key = item[descriptor.key]
    if (!validListKey(key)) throw new Error(`Keyed list key "${descriptor.key}" must be a string or finite number`)
    const token = keyToken(key)
    if (keys.has(token)) throw new Error(`Duplicate keyed list key: ${String(key)}`)
    keys.add(token)
    entries.set(item, { item, key, token, value: item, position })
    positions.set(token, position)
  }
  entries.positions = positions
  return entries
}

/* stable-list-fast-path */
function updateStableList(list, items) {
  const previous = list.items
  const referenceOnly = usesItemReferences(list)
  if (items.length < previous.length) return false
  const appending = items.length > previous.length
  const keys = new Set()
  const seen = new Set()
  const keyField = list.descriptor.key
  const fragment = list.start.ownerDocument.createDocumentFragment()
  for (let index = 0; index < items.length; index++) {
    const item = items[index]
    assertListItem(item)
    const seededValue = __KUDZU_LIST_SEEDS__ ? list.seedFields && seededListValue(item, list.seedFields, list.valueSeed, !referenceOnly) : undefined
    if (seededValue === undefined) assertListValue(item, seen, true)
    const key = item[keyField]
    if (!validListKey(key)) throw new Error(`Keyed list key "${keyField}" must be a string or finite number`)
    const token = keyToken(key)
    if (keys.has(token)) throw new Error(`Duplicate keyed list key: ${String(key)}`)
    keys.add(token)
    if (index < previous.length && (key !== previous[index][keyField] || appending && item !== previous[index])) return false
    if (items.length === previous.length + 1 || index < previous.length) continue
    let node = list.templateRoot?.cloneNode(true)
    if (node?.dataset.kListRoot !== list.descriptor.id) node = undefined
    if (!node) throw new Error("Keyed list template has no root element")
    node.removeAttribute("data-k-list-root")
    if (__KUDZU_LIST_ROW_HOOKS__) initializeGeneralRowHooks(list.descriptor, key, node, list.owner)
    if (list.parts.directFill) fillStructuralListParts(list.parts, node, item)
    else fillListItem(node, item, list.descriptor.nested, index, mapListItemParts(list.parts, node, list.descriptor.nested))
    fragment.append(node)
  }
  if (appending) {
    if (items.length === previous.length + 1) {
      const item = items.at(-1)
      const key = item[keyField]
      const token = keyToken(key)
      const seededValue = __KUDZU_LIST_SEEDS__ ? list.seedFields && seededListValue(item, list.seedFields, list.valueSeed, !referenceOnly) : undefined
      addListRoot(list, { item, index: previous.length, key, token, value: referenceOnly ? item : seededValue === undefined ? JSON.stringify(item) : seededValue })
      if (referenceOnly) list.values.clear()
      list.items = items
      return true
    }
    const parent = list.container ?? list.start.parentNode
    let node = fragment.firstChild
    for (let index = previous.length; node; index++) {
      const item = items[index]
      const token = keyToken(item[keyField])
      list.roots.set(token, node)
      list.orderedRoots.push(node)
      if (!referenceOnly) {
        const seededValue = __KUDZU_LIST_SEEDS__ ? list.seedFields && seededListValue(item, list.seedFields, list.valueSeed) : undefined
        list.values.set(token, seededValue === undefined ? JSON.stringify(item) : seededValue)
      }
      node = node.nextSibling
    }
    const firstAdded = fragment.firstChild
    parent.insertBefore(fragment, list.boundary)
    if (referenceOnly) list.values.clear()
    if (__KUDZU_LIST_MOUNTS__ && list.descriptor.mount) for (let node = firstAdded; node !== list.boundary; node = node.nextSibling) mountDom(node)
    list.container ??= parent
    list.items = items
    return true
  }
  if (referenceOnly) {
    for (let index = 0; index < items.length; index++) {
      const item = items[index]
      if (item !== previous[index]) fillListItem(list.orderedRoots[index], item, list.descriptor.nested, index)
    }
  } else {
    for (let index = 0; index < items.length; index++) {
      const item = items[index]
      if (item === previous[index]) continue
      const token = keyToken(item[keyField])
      const seededValue = __KUDZU_LIST_SEEDS__ ? list.seedFields && seededListValue(item, list.seedFields, list.valueSeed) : undefined
      const value = seededValue === undefined ? JSON.stringify(item) : seededValue
      if (list.values.get(token) !== value) {
        const node = list.orderedRoots[index]
        fillListItem(node, item, list.descriptor.nested, index)
        if (__KUDZU_LIST_ITEM_HOOKS__) notifyListItem(list.descriptor.state, node)
        list.values.set(token, value)
      }
    }
  }
  if (referenceOnly) list.values.clear()
  list.items = items
  return true
}
/* stable-list-fast-path-end */

function updateNestedList(list, items) {
  const previous = list.items
  if (items === previous) return false
  if (items.length === previous.length && items.every((item, index) => item === previous[index])) {
    list.items = items
    return true
  }
  if (items.length === previous.length && items.every((item, index) => item === previous[previous.length - index - 1])) {
    const roots = [...list.roots].reverse()
    const parent = list.container ?? list.start.parentNode
    const reordered = parent.ownerDocument.createDocumentFragment()
    reordered.append(...roots.map(([, node]) => node))
    parent.insertBefore(reordered, list.boundary)
    list.roots = new Map(roots)
    list.items = items
    list.container ??= parent
    return true
  }
  if (items.length === previous.length - 1) {
    let removed = 0
    while (removed < items.length && items[removed] === previous[removed]) removed++
    if (items.every((item, index) => item === previous[index >= removed ? index + 1 : index])) {
      removeListRoot(list, keyToken(previous[removed]?.[list.descriptor.key]))
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
  if (list.descriptor.children) validateChildLists([item], list.descriptor.children)
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
    const roots = [...list.roots].reverse()
    const parent = list.container ?? list.start.parentNode
    const reordered = parent.ownerDocument.createDocumentFragment()
    reordered.append(...roots.map(([, node]) => node))
    parent.insertBefore(reordered, list.boundary)
    list.roots = new Map(roots)
    list.items = items
    list.container ??= parent
    return true
  }
  if (items.length === previous.length - 1) {
    let removed = 0
    while (removed < items.length && items[removed] === previous[removed]) removed++
    if (items.every((item, index) => item === previous[index >= removed ? index + 1 : index])) {
      removeListRoot(list, keyToken(previous[removed]?.[list.descriptor.key]))
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
    const seededValue = __KUDZU_LIST_SEEDS__ ? list.seedFields && seededListValue(item, list.seedFields, list.valueSeed) : undefined
    if (seededValue === undefined) assertListValue(item, seen, true)
    const token = keyToken(key)
    if (list.roots.has(token)) throw new Error(`Duplicate keyed list key: ${String(key)}`)
    addListRoot(list, { item, key, token, value: seededValue === undefined ? JSON.stringify(item) : seededValue })
    list.items = items
    return true
  }
  return false
}

function addListRoot(list, { item, index = list.roots.size, key, token, value }) {
  let node = list.templateRoot?.cloneNode(true)
  if (node?.dataset.kListRoot !== list.descriptor.id) node = undefined
  if (!node) throw new Error("Keyed list template has no root element")
  node.removeAttribute("data-k-list-root")
  if (__KUDZU_NESTED_LISTS__ && list.childPrototypes) childPrototypes.set(node, list.childPrototypes)
  if (__KUDZU_LIST_ROW_HOOKS__) initializeGeneralRowHooks(list.descriptor, key, node, list.owner)
  mapListItemParts(list.parts, node, list.descriptor.nested)
  fillListItem(node, item, list.descriptor.nested, index)
  const parent = list.container ?? list.start.parentNode
  parent.insertBefore(node, list.boundary)
  if (__KUDZU_LIST_MOUNTS__ && list.descriptor.mount) mountDom(node)
  list.roots.set(token, node)
  if (__KUDZU_LIST_STABLE_FAST_PATHS__) list.orderedRoots.push(node)
  if (!usesItemReferences(list)) list.values.set(token, value)
  list.container ??= parent
}

function removeListRoot(list, token) {
  const node = list.roots.get(token)
  if (__KUDZU_LIST_MOUNTS__ && list.descriptor.mount && !list.descriptor.fastRelease) unmountDom(node)
  node.remove()
  if (__KUDZU_LIST_ROW_HOOKS__ && list.descriptor.rowStates) deleteRowStates(list.descriptor, ownershipPaths.get(node))
  list.roots.delete(token)
  list.values.delete(token)
}

function fillListItem(root, item, nested = false, index = 0, parts = listItemParts(root, nested)) {
  const previous = listItems.get(root)
  listItems.set(root, item)
  if (__KUDZU_LIST_INDEXES__) listIndexes.set(root, index)
  const revision = __KUDZU_LIST_ASYNC_PARTS__ ? (revisions.get(root) ?? 0) + 1 : 0
  if (__KUDZU_LIST_ASYNC_PARTS__) revisions.set(root, revision)
  fillListParts(root, parts, item, revision, index, previous)
  if (__KUDZU_NESTED_LISTS__) {
    const children = ownedLists.get(root)
    if (children) for (const child of children.values()) updateList(child)
  }
  if (__KUDZU_LIST_ROW_HOOKS__) replaceRowIds(root, rowReplacements.get(root))
}

function fillListParts(root, parts, item, revision, index = 0, previous) {
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
      for (const [target, field] of attributes) {
        if (previous && Object.is(previous[field], item?.[field])) continue
        patchBinding(node, target, item?.[field], true)
      }
    }
  }
  if (__KUDZU_LIST_EVENTS__) {
    for (const [node, events] of parts.events) {
      for (const [event, native] of JSON.parse(events)) {
        native.scope = Object.fromEntries(Object.entries(native.scope).map(([name, value]) => [name, value?.type === "list-item" ? serializeItem(item) : value?.type === "list-index" ? index : value]))
        node.dataset[`kNative${capitalize(event)}`] = JSON.stringify(native)
      }
    }
  }
  fillListExpressions(root, parts, item, revision, index)
  if (__KUDZU_LIST_CONDITIONS__) {
    for (const [marker, descriptor] of parts.conditions) {
      evaluate(descriptor, item, index).then(value => {
        if (revisions.get(root) === revision && marker.isConnected) updateListCondition(marker, descriptor.kind, value, item, index)
      }).catch(error => console.error(error))
    }
  }
}

function fillListExpressions(root, parts, item, revision, index) {
  if (__KUDZU_LIST_EXPRESSIONS__) {
    for (const [marker, descriptor] of parts.expressions) {
      evaluate(descriptor, item, index).then(value => {
        if (revisions.get(root) === revision && marker.isConnected) patchListText(marker, "template[data-k-list-expression-end]", value)
      }).catch(error => console.error(error))
    }
  }
  if (__KUDZU_LIST_EXPRESSION_ATTRIBUTES__) {
    for (const [node, attributes] of parts.expressionAttributes) {
      for (const [target, module, handler, states] of attributes) {
        evaluate({ module, handler, states }, item, index).then(value => {
          if (revisions.get(root) === revision && node.isConnected) patchBinding(node, target, value)
        }).catch(error => console.error(error))
      }
    }
  }
}

function updateListExpressions(list) {
  for (const root of list.roots.values()) {
    const revision = (revisions.get(root) ?? 0) + 1
    revisions.set(root, revision)
    fillListExpressions(root, listItemParts(root, list.descriptor.nested), listItems.get(root), revision, __KUDZU_LIST_INDEXES__ ? listIndexes.get(root) ?? 0 : 0)
  }
}

function listItemParts(root, nested = false) {
  let parts = itemParts.get(root)
  if (parts) return parts
  parts = { directTexts: [], texts: [], attributes: [], events: [], expressions: [], expressionAttributes: [], conditions: [], effects: [] }
  for (const node of nested ? ownedElements(root).filter(node => node.matches(itemPartsSelector)) : matching(root, itemPartsSelector)) {
    if (node.hasAttribute("data-k-list-text")) (node.tagName === "TEMPLATE" ? parts.texts : parts.directTexts).push([node, node.dataset.kListText])
    if (__KUDZU_LIST_ATTRIBUTES__ && node.hasAttribute("data-k-list-attrs")) parts.attributes.push([node, node.dataset.kListAttrs ? JSON.parse(node.dataset.kListAttrs) : undefined])
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
  if (__KUDZU_NESTED_LISTS__) hydrateListItemParts(itemPartPlans.get(root), parts)
  itemParts.set(root, parts)
  return parts
}

function hydrateListItemParts(planned, initial) {
  if (!planned) return
  hydrateListItemPartValues(planned.directTexts, initial.directTexts, value => value === "")
  if (__KUDZU_LIST_TEXT_RANGES__) hydrateListItemPartValues(planned.texts, initial.texts, value => value === "")
  if (__KUDZU_LIST_ATTRIBUTES__) hydrateListItemPartValues(planned.attributes, initial.attributes, value => value === undefined)
}

function hydrateListItemPartValues(planned, initial, missing) {
  let index = 0
  for (const entry of initial) {
    if (!missing(entry[1])) continue
    if (!planned[index]) throw new Error("Keyed list item markers do not match its template")
    entry[1] = planned[index++][1]
  }
  if (index !== planned.length) throw new Error("Keyed list item markers do not match its template")
}

function listItemPartPlan(template, nested = false) {
  const source = nested ? ownedElements(template) : [template, ...template.querySelectorAll("*")]
  const indexes = new Map(source.map((node, index) => [node, index]))
  const parts = listItemParts(template, nested)
  const structural = !nested && !parts.texts.length && !parts.expressions.length && !parts.expressionAttributes.length && !parts.conditions.length && !parts.effects.length
  const location = structural ? node => elementPath(template, node) : node => indexes.get(node)
  return {
    structural,
    directFill: structural && !parts.events.length && !__KUDZU_LIST_ASYNC_PARTS__ && !__KUDZU_NESTED_LISTS__ && !__KUDZU_LIST_INDEXES__ && !__KUDZU_LIST_ROW_HOOKS__,
    directTexts: parts.directTexts.map(([node, field]) => [location(node), field]),
    texts: __KUDZU_LIST_TEXT_RANGES__ ? parts.texts.map(([node, field]) => [location(node), field]) : [],
    attributes: __KUDZU_LIST_ATTRIBUTES__ ? parts.attributes.map(([node, attributes]) => [location(node), attributes]) : [],
    events: __KUDZU_LIST_EVENTS__ ? parts.events.map(([node, events]) => [location(node), events]) : [],
    expressions: __KUDZU_LIST_EXPRESSIONS__ ? parts.expressions.map(([node, descriptor]) => [location(node), descriptor]) : [],
    expressionAttributes: __KUDZU_LIST_EXPRESSION_ATTRIBUTES__ ? parts.expressionAttributes.map(([node, attributes]) => [location(node), attributes]) : [],
    conditions: __KUDZU_LIST_CONDITIONS__ ? parts.conditions.map(([node, descriptor]) => [location(node), descriptor, node]) : [],
    effects: __KUDZU_LIST_EFFECTS__ ? parts.effects.map(location) : []
  }
}

function mapListItemParts(parts, root, nested = false) {
  if (parts.structural) {
    const target = path => {
      if (!path.length) return root
      let node = root.children[path[0]]
      for (let index = 1; index < path.length; index++) node = node.children[path[index]]
      return node
    }
    const mapped = {
      directTexts: parts.directTexts.map(([path, field]) => [target(path), field]),
      texts: [],
      attributes: __KUDZU_LIST_ATTRIBUTES__ ? parts.attributes.map(([path, attributes]) => [target(path), attributes]) : [],
      events: __KUDZU_LIST_EVENTS__ ? parts.events.map(([path, events]) => [target(path), events]) : [],
      expressions: [],
      expressionAttributes: [],
      conditions: [],
      effects: []
    }
    itemParts.set(root, mapped)
    return mapped
  }
  const target = nested ? ownedElements(root) : [root, ...root.querySelectorAll("*")]
  const mapped = {
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
  }
  itemParts.set(root, mapped)
  return mapped
}

function fillStructuralListParts(parts, root, item) {
  for (let partIndex = 0; partIndex < parts.directTexts.length; partIndex++) {
    const part = parts.directTexts[partIndex]
    const path = part[0]
    let node = root
    for (let pathIndex = 0; pathIndex < path.length; pathIndex++) node = node.children[path[pathIndex]]
    node.textContent = item[part[1]] ?? ""
  }
  if (__KUDZU_LIST_ATTRIBUTES__) for (let partIndex = 0; partIndex < parts.attributes.length; partIndex++) {
    const part = parts.attributes[partIndex]
    const path = part[0]
    let node = root
    for (let pathIndex = 0; pathIndex < path.length; pathIndex++) node = node.children[path[pathIndex]]
    const attributes = part[1]
    for (let index = 0; index < attributes.length; index++) patchBinding(node, attributes[index][0], item[attributes[index][1]])
  }
}

function elementPath(root, node) {
  const path = []
  while (node !== root) {
    const parent = node.parentElement
    path.push(Array.prototype.indexOf.call(parent.children, node))
    node = parent
  }
  return path.reverse()
}

function mapListConditionTemplates(planned, initial) {
  if (!__KUDZU_DEEP_LIST_CONDITIONS__) {
    if (planned.length !== initial.length) throw new Error("Keyed list condition markers do not match its template")
    for (let index = 0; index < initial.length; index++) {
      const marker = initial[index][0]
      initial[index][1] ??= planned[index][1]
      if (!marker.content.querySelector("template[data-k-list-true],template[data-k-list-false]")) conditionTemplates.set(marker, planned[index][2])
    }
    return
  }
  const templates = new Map()
  const collect = root => {
    for (const marker of root.querySelectorAll("template")) {
      if (marker.hasAttribute("data-k-list-condition")) {
        const descriptor = JSON.parse(marker.dataset.kListCondition)
        templates.set(descriptor.handler, [descriptor, marker])
      }
      collect(marker.content)
    }
  }
  for (const entry of planned) {
    templates.set(entry[1].handler, [entry[1], entry[2]])
    collect(entry[2].content)
  }
  for (const entry of initial) {
    const marker = entry[0]
    const template = templates.get(entry[1]?.handler ?? marker.dataset.kListConditionHandler)
    if (!template) throw new Error("Keyed list condition marker has no matching template")
    entry[1] ??= template[0]
    if (!marker.content.querySelector("template[data-k-list-true],template[data-k-list-false]")) conditionTemplates.set(marker, template[1])
  }
}

function updateListCondition(marker, kind, value, item, index) {
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
  fillListParts(marker, listItemParts(fragment), item, revision, index)
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

function validateChildLists(items, children) {
  for (const item of items) {
    for (const child of children) {
      const values = __KUDZU_COLLECTION_SELECTORS__ ? selectCollection(item?.[child.field], child.selector) : item?.[child.field] ?? []
      const keys = new Set()
      for (const entry of values) {
        const key = child.key === null ? keys.size : entry?.[child.key]
        if (!validListKey(key)) throw new Error(`Keyed list key "${child.key}" must be a string or finite number`)
        assertListItem(entry)
        assertListValue(entry, new Set(), true)
        const token = keyToken(key)
        if (keys.has(token)) throw new Error(`Duplicate keyed list key: ${String(key)}`)
        keys.add(token)
      }
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
  const prototypeStart = owner ? childPrototypes.get(owner)?.get(descriptor.id) : undefined
  const templateRoot = prototypeStart?.content.firstElementChild ?? listTemplateRoot(start, descriptor)
  if (!templateRoot) throw new Error("Nested keyed list has no shared row prototype")
  const prototypes = descriptor.children && new Map(descriptor.children.map(child => [child.id, findChildPrototype(templateRoot, child.id)]))
  if (prototypes && [...prototypes.values()].some(prototype => !prototype)) throw new Error("Keyed list template has no nested row prototype")
  if (prototypes?.size) for (const root of roots) childPrototypes.set(root, prototypes)
  if (prototypeStart && start !== prototypeStart) start.content.replaceChildren()
  return { owner, childPrototypes: prototypes, templateRoot }
}

function listTemplateRoot(start, descriptor) {
  if (!__KUDZU_SVG_LISTS__ || !descriptor.svg) return start.content.firstElementChild
  const range = start.ownerDocument.createRange()
  range.selectNode(start)
  return range.createContextualFragment(start.dataset.kSvgTemplate).firstElementChild
}

function findChildPrototype(root, id) {
  for (const element of root.children) {
    if (element.matches("template[data-k-list]")) {
      if (JSON.parse(element.dataset.kList).id === id) return element
      const nested = findChildPrototype(element.content, id)
      if (nested) return nested
    } else {
      const nested = findChildPrototype(element, id)
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

function evaluate(descriptor, item, index) {
  let module = imports.get(descriptor.module)
  if (!module) {
    module = import(descriptor.module)
    imports.set(descriptor.module, module)
  }
  return module.then(exports => {
    const value = exports[descriptor.handler](item, index, { get: name => browserState.get(descriptor.states?.[name]) })
    if (value && typeof value.then === "function") throw new Error("Derived keyed list item expressions must return synchronous values")
    return value
  })
}

function serializeItem(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number") return value
  if (Array.isArray(value)) return { type: "array", value: value.map(serializeItem) }
  return { type: "object", nullPrototype: false, value: Object.entries(value).map(([key, entry]) => [key, serializeItem(entry)]) }
}

function patchBinding(node, target, value, write = false) {
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
    const next = value === true && !isStringBooleanAttribute(target) ? "" : String(value)
    if (write || node.getAttribute(target) !== next) node.setAttribute(target, next)
  }
}

function keyToken(key) {
  return `${typeof key}:${key}`
}

/* general-row-hooks */
function initializeGeneralRowHooks(descriptor, key, root, owner) {
  const token = keyToken(key)
  const path = [...(ownershipPaths.get(owner) ?? []), `${descriptor.id}=${token}`]
  ownershipPaths.set(root, path)
  const statePath = descriptor.ownerField ? path : [token]
  root.dataset.kRowPath = encodeURIComponent(statePath.join("/"))
  const replacements = new Map()
  for (const state of descriptor.rowStates ?? []) {
    const id = rowStateId(state.id, statePath)
    if (!browserState.has(id)) browserState.set(id, __KUDZU_COMPLEX_LIST_ROW_STATE__ && state.initialValue !== null && typeof state.initialValue === "object" ? structuredClone(state.initialValue) : state.initialValue)
    replacements.set(state.id, id)
  }
  if (__KUDZU_LIST_ROW_REFS__) for (const ref of descriptor.rowRefs ?? []) replacements.set(ref, rowStateId(ref, statePath))
  for (const marker of descriptor.rowConditions ?? []) replacements.set(marker, rowStateId(marker, statePath))
  rowReplacements.set(root, replacements)
  replaceRowIds(root, replacements)
}
/* general-row-hooks-end */

function initializeRowStates(descriptor, key, root) {
  const token = keyToken(key)
  const replacements = new Map()
  for (const state of descriptor.rowStates) {
    const id = flatRowStateId(state.id, token)
    if (!browserState.has(id)) browserState.set(id, state.initialValue)
    replacements.set(state.id, id)
  }
  for (const marker of descriptor.rowConditions ?? []) replacements.set(marker, flatRowStateId(marker, token))
  if (root) replaceRowIds(root, replacements)
}

function deleteFlatRowStates(descriptor, token) {
  for (const state of descriptor.rowStates) releaseState(flatRowStateId(state.id, token))
}

function flatRowStateId(id, token) {
  return id.replace("$k", encodeURIComponent(token))
}

function deleteRowStates(descriptor, path) {
  const statePath = descriptor.ownerField ? path : [path.at(-1).slice(path.at(-1).indexOf("=") + 1)]
  for (const state of descriptor.rowStates) releaseState(rowStateId(state.id, statePath))
}
function rowStateId(id, path) {
  return id.replace("$k", encodeURIComponent(path.join("/")))
}

function replaceRowIds(root, replacements) {
  if (!replacements) return
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

function seededListValue(item, fields, seed, serialize = true) {
  const keys = Reflect.ownKeys(item)
  if (fields.length === 1) {
    const field = fields[0]
    if (keys.length !== 1 || keys[0] !== field) return undefined
    const descriptor = Object.getOwnPropertyDescriptor(item, field)
    if (!descriptor.enumerable) throw new Error("Keyed list items must not contain non-enumerable properties")
    if (!("value" in descriptor)) throw new Error("Keyed list items must not contain accessors")
    const value = descriptor.value
    const type = value === null ? "null" : typeof value
    return type === seed[field] && !(type === "number" && (!Number.isFinite(value) || Object.is(value, -0))) ? serialize ? value : true : undefined
  }
  if (keys.length !== fields.length || keys.some(key => typeof key !== "string" || !fields.includes(key))) return undefined
  const values = serialize ? [] : undefined
  for (const field of fields) {
    const descriptor = Object.getOwnPropertyDescriptor(item, field)
    if (!descriptor.enumerable) throw new Error("Keyed list items must not contain non-enumerable properties")
    if (!("value" in descriptor)) throw new Error("Keyed list items must not contain accessors")
    const value = descriptor.value
    const type = value === null ? "null" : typeof value
    if (type !== seed[field] || type === "number" && (!Number.isFinite(value) || Object.is(value, -0))) return undefined
    if (serialize) values.push(value)
  }
  return serialize ? values.length === 1 ? values[0] : JSON.stringify(values) : true
}

function usesItemReferences(list) {
  return !list.descriptor.mount && !list.descriptor.effects && !list.descriptor.events && !list.descriptor.expressions && !list.descriptor.expressionAttributes && !list.descriptor.conditions
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
