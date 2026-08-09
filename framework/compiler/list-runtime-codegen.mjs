import { assertCapabilityIR } from "./route-capability-planner.mjs"

export function generateListRuntime(source, capabilityIR) {
  assertCapabilityIR(capabilityIR)
  const { lists, effects } = capabilityIR
  let runtime = replaceRequired(source, '"./shared-runtime.js"', '"./kudzu.js"', "shared runtime import")
  runtime = lists.calculated
    ? replaceRequired(runtime, '"./binding-runtime.js"', '"./kudzu-binding.js"', "binding runtime import")
    : replaceRequired(runtime, /^const loadListEvaluator[^\n]+\n/m, "", "list evaluator loader")
  runtime = lists.selectors
    ? replaceRequired(runtime, '"./collection-selector.js"', '"./kudzu-collection-selector.js"', "collection selector import")
    : replaceRequired(runtime, /^import \{ selectCollection \}[^\n]+\n/m, "", "collection selector import")
  if (!lists.indexes) {
    runtime = replaceSequenceRequired(runtime, [
      ["for (const [index, item] of items.entries()) {", "for (const item of items) {", "item iteration"],
      ["const key = list.descriptor.key === null ? index : item?.[list.descriptor.key]", "const key = item?.[list.descriptor.key]", "index key"],
      ["entries.push({ item, index, key, token, value:", "entries.push({ item, key, token, value:", "indexed entry"],
      ["for (const { item, index, key, token, value } of entries) {", "for (const { item, key, token, value } of entries) {", "indexed entry loop"],
      ["fillListItem(node, item, list.descriptor.nested, index)", "fillListItem(node, item, list.descriptor.nested)", "indexed item fill", true],
      ["fillListItem(node, item, list.descriptor.nested, index, mapListItemParts", "fillListItem(node, item, list.descriptor.nested, 0, mapListItemParts", "mapped item fill"],
      ["function addListRoot(list, { item, index = list.roots.size, key, token, value })", "function addListRoot(list, { item, key, token, value })", "indexed list root"],
      ["fillListParts(root, listItemParts(root), listItems.get(owner), 0, __KUDZU_LIST_INDEXES__ ? listIndexes.get(owner) ?? 0 : 0)", "fillListParts(root, listItemParts(root), listItems.get(owner), 0)", "indexed root parts"],
      ["fillListParts(root, parts, item, revision, index, previous)", "fillListParts(root, parts, item, revision, previous)", "indexed fill call"],
      ["function fillListParts(root, parts, item, revision, index = 0, previous)", "function fillListParts(root, parts, item, revision, previous)", "indexed parts signature"],
      ["fillListExpressions(root, parts, item, revision, index)", "fillListExpressions(root, parts, item, revision)", "indexed expressions"],
      ['value?.type === "list-item" ? serializeItem(item) : value?.type === "list-index" ? index : value', 'value?.type === "list-item" ? serializeItem(item) : value', "index capture", true],
      ["evaluate(descriptor, item, index)", "evaluate(descriptor, item)", "indexed evaluator", true],
      ["updateListCondition(marker, descriptor.kind, value, item, index)", "updateListCondition(marker, descriptor.kind, value, item)", "indexed condition"],
      ["function updateListCondition(marker, kind, value, item, index)", "function updateListCondition(marker, kind, value, item)", "indexed condition signature"],
      ["fillListParts(marker, listItemParts(fragment), item, revision, index)", "fillListParts(marker, listItemParts(fragment), item, revision)", "indexed condition parts"],
      ["exports[descriptor.handler](item, index, {", "exports[descriptor.handler](item, undefined, {", "indexed state handler call"]
    ])
  }
  if (!lists.selectors) runtime = replaceRequired(runtime, " && !list.descriptor.selector", "", "selector guards", true)
  if (!lists.indexes) runtime = replaceSequenceRequired(runtime, [
    [" && !list.descriptor.indexed", "", "indexed guards", true],
    [" && list.descriptor.key !== null", "", "key guards", true],
    ["(referenceOnly ? listItems.get(node) !== item : list.values.get(token) !== value) || list.descriptor.indexed || list.descriptor.key === null", "referenceOnly ? listItems.get(node) !== item : list.values.get(token) !== value", "indexed value comparison"]
  ])
  if (lists.rowHooks && !lists.generalRowHooks) runtime = replaceSequenceRequired(replaceRequired(runtime, /\/\* general-row-hooks \*\/[\s\S]*?\/\* general-row-hooks-end \*\/\n/, "", "general row hooks"), [
    ["initializeGeneralRowHooks", "initializeRowStates", "general row initializer", true],
    ["if (__KUDZU_LIST_ROW_HOOKS__) for (let index = 0; index < roots.length; index++) initializeRowStates(descriptor, descriptor.keys[index], roots[index], nested?.owner)", "if (__KUDZU_LIST_ROW_HOOKS__ && descriptor.rowStates) for (let index = 0; index < roots.length; index++) initializeRowStates(descriptor, descriptor.keys[index])", "flat row initialization"],
    ["if (__KUDZU_LIST_ROW_HOOKS__) initializeRowStates(list.descriptor, key, node, list.owner)", "if (__KUDZU_LIST_ROW_HOOKS__ && list.descriptor.rowStates) initializeRowStates(list.descriptor, key, node)", "flat row add", true],
    ["for (const node of registration.list.roots.values()) deleteRowStates(registration.list.descriptor, ownershipPaths.get(node))", "for (const token of registration.list.roots.keys()) deleteFlatRowStates(registration.list.descriptor, token)", "flat registration cleanup"],
    ["deleteRowStates(list.descriptor, ownershipPaths.get(node))", "deleteFlatRowStates(list.descriptor, token)", "flat row cleanup", true],
    ["  if (__KUDZU_LIST_ROW_HOOKS__) replaceRowIds(root, rowReplacements.get(root))\n", "", "row ID replacement"],
    ["  if (!replacements) return\n", "", "row replacement guard"]
  ])
  if (!effects.itemDependencies) runtime = replaceRequired(runtime, ", notifyListItem", "", "item notification import")
  if (!lists.stableFastPaths) runtime = replaceRequired(runtime, /\/\* stable-list-fast-path \*\/[\s\S]*?\/\* stable-list-fast-path-end \*\/\n/, "", "stable list fast path")
  const stylePatch = `  if (target === "style") {
    const style = serializeStyle(value)
    if (style) node.setAttribute("style", style)
    else node.removeAttribute("style")
    return
  }`
  runtime = replaceRequired(runtime, "  /* list-style */", lists.styleCount ? stylePatch : "", "list style")
  if (lists.styleCount) runtime = `import { serializeStyle } from "./kudzu-style.js"\n${runtime}`
  return {
    source: runtime,
    define: {
      __KUDZU_LIST_CONDITIONS__: String(lists.conditions),
      __KUDZU_DEEP_LIST_CONDITIONS__: String(lists.deepConditions),
      __KUDZU_LIST_TEXT_RANGES__: String(lists.textRanges),
      __KUDZU_LIST_ATTRIBUTES__: String(lists.attributes),
      __KUDZU_LIST_EVENTS__: String(lists.events),
      __KUDZU_LIST_EXPRESSIONS__: String(lists.expressions),
      __KUDZU_LIST_EXPRESSION_ATTRIBUTES__: String(lists.expressionAttributes),
      __KUDZU_LIST_SEEDS__: String(lists.seeds),
      __KUDZU_LIST_EFFECTS__: String(lists.effects),
      __KUDZU_LIST_ASYNC_PARTS__: String(lists.asyncParts),
      __KUDZU_LIST_MOUNTS__: String(lists.mounts),
      __KUDZU_LIST_ITEM_HOOKS__: String(effects.itemDependencies),
      __KUDZU_LIST_ROW_HOOKS__: String(lists.rowHooks),
      __KUDZU_LIST_ROW_REFS__: String(lists.rowRefs),
      __KUDZU_COMPLEX_LIST_ROW_STATE__: String(lists.complexRowState),
      __KUDZU_NESTED_LISTS__: String(lists.nested),
      __KUDZU_COLLECTION_SELECTORS__: String(lists.selectors),
      __KUDZU_STATIC_COLLECTIONS__: String(lists.static),
      __KUDZU_LIST_INDEXES__: String(lists.indexes),
      __KUDZU_LIST_STABLE_FAST_PATHS__: String(lists.stableFastPaths),
      __KUDZU_SVG_LISTS__: String(lists.svg)
    }
  }
}

function replaceRequired(source, search, replacement, label, all = false) {
  const output = all ? source.replaceAll(search, replacement) : source.replace(search, replacement)
  if (output === source) throw new Error(`${label} specialization did not match list-runtime.js`)
  return output
}

function replaceSequenceRequired(source, replacements) {
  return replacements.reduce((output, [search, replacement, label, all]) => replaceRequired(output, search, replacement, label, all), source)
}
