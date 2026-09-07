import ts from "typescript"
import { nearestFunction, unwrapExpression } from "./ast-helpers.mjs"

export const pureCollectionMethods = new Set(["at", "charAt", "charCodeAt", "concat", "endsWith", "includes", "indexOf", "join", "lastIndexOf", "localeCompare", "padEnd", "padStart", "repeat", "replace", "replaceAll", "slice", "startsWith", "substring", "toLowerCase", "toUpperCase", "trim", "trimEnd", "trimStart"])
export const mutatingCollectionMethods = new Set(["copyWithin", "fill", "pop", "push", "reverse", "shift", "sort", "splice", "unshift"])
export const pureCollectionMathMethods = new Set(["abs", "ceil", "floor", "max", "min", "pow", "round", "sign", "sqrt", "trunc"])

export function isArrayFromCall(value) {
  return ts.isCallExpression(value) && ts.isPropertyAccessExpression(value.expression) && ts.isIdentifier(value.expression.expression) && value.expression.expression.text === "Array" && value.expression.name.text === "from"
}

export function collectionParameters(callback, label, fail) {
  if (!ts.isArrowFunction(callback) || callback.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword) || callback.parameters.length < 1 || callback.parameters.length > 2 || callback.parameters.some(parameter => !ts.isIdentifier(parameter.name) || parameter.dotDotDotToken || parameter.initializer || parameter.questionToken)) fail(callback, `${label} callback must be a synchronous arrow function with (item) or (item, index) identifier parameters`)
  return { item: callback.parameters[0].name.text, index: callback.parameters[1]?.name.text }
}

export function analyzeCollectionPipeline(expression, options) {
  const {
    setters = new Map(),
    declarations,
    fail,
    aliases = new Set(),
    importedCollections = new Set(),
    stateNames = new Set(),
    importedCollectionTransforms = new Map(),
    calculatedCollection,
    staticCollection
  } = options
  const nestedOptions = { setters, declarations, fail, aliases, importedCollections, stateNames, importedCollectionTransforms, calculatedCollection, staticCollection }
  const value = unwrapExpression(expression)
  if (ts.isIdentifier(value)) {
    if ([...setters.values()].includes(value.text)) {
      const localStatic = staticCollection?.(value.text)
      return { state: value, static: localStatic, localStatic, selector: [], selectorStates: new Set() }
    }
    if (importedCollections.has(value.text)) return { state: value, static: true, selector: [], selectorStates: new Set() }
    const entries = declarations?.get(value.text)
    if (!entries) return undefined
    if (entries.length !== 1 || aliases.has(value.text) || entries[0].node.parent?.parent?.parent !== nearestFunction(entries[0].node)?.body) fail(value, `Rendered collection alias "${value.text}" must be one top-level immutable local`)
    aliases.add(value.text)
    const source = analyzeCollectionPipeline(entries[0].initializer, nestedOptions)
    aliases.delete(value.text)
    return source && { ...source, aliasDeclarations: [...(source.aliasDeclarations ?? []), entries[0].node], aliasUses: [...(source.aliasUses ?? []), value] }
  }
  if (ts.isPropertyAccessExpression(value) && ts.isIdentifier(value.expression)) {
    const calculation = calculatedCollection?.(value)
    if (calculation) return { calculation, selector: [], selectorStates: new Set() }
    if (stateNames.has(value.expression.text)) {
      if (["__proto__", "constructor", "prototype"].includes(value.name.text)) fail(value, `Rendered collection property "${value.name.text}" is not supported`)
      return { state: value.expression, calculation: value, selector: [], selectorStates: new Set() }
    }
    return { state: undefined, ownerField: value.name.text, selector: [], parentItem: value.expression.text }
  }
  if (ts.isCallExpression(value) && ts.isIdentifier(value.expression) && importedCollectionTransforms.has(value.expression.text)) {
    const transform = importedCollectionTransforms.get(value.expression.text)
    const parameter = transform.parameters[0]
    if (value.arguments.length !== 1 || transform.parameters.length !== 1 || transform.asteriskToken || transform.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword) || !parameter || !ts.isIdentifier(parameter.name) || parameter.dotDotDotToken || parameter.initializer || parameter.questionToken) fail(value, `Imported collection transform "${value.expression.text}" must be synchronous with exactly one identifier parameter and one argument`)
    const returned = ts.isBlock(transform.body)
      ? transform.body.statements.length === 1 && ts.isReturnStatement(transform.body.statements[0]) ? transform.body.statements[0].expression : undefined
      : transform.body
    if (!returned) fail(value, `Imported collection transform "${value.expression.text}" must contain only one returned collection expression`)
    const transformSource = analyzeCollectionPipeline(returned, { setters: new Map([[parameter.name.text, parameter.name.text]]), fail, stateNames: new Set([parameter.name.text]) })
    if (!transformSource?.state || transformSource.state.text !== parameter.name.text || transformSource.selectorStates.size) fail(value, `Imported collection transform "${value.expression.text}" must return a supported pure pipeline rooted only in its parameter`)
    const source = analyzeCollectionPipeline(value.arguments[0], nestedOptions)
    if (!source) fail(value.arguments[0], `Imported collection transform "${value.expression.text}" requires a supported collection argument`)
    return { ...source, selector: [...source.selector, ...transformSource.selector] }
  }
  if (ts.isCallExpression(value) && ts.isPropertyAccessExpression(value.expression)) {
    const method = value.expression.name.text
    if (method === "filter") {
      if (value.arguments.length !== 1) fail(value, "Rendered collection filter() requires one inline predicate")
      const source = analyzeCollectionPipeline(value.expression.expression, nestedOptions)
      if (!source) return undefined
      const parameters = collectionParameters(value.arguments[0], "Rendered collection filter()", fail)
      const selectorStates = new Set(source.selectorStates)
      return { ...source, selector: [...source.selector, ["filter", collectionExpression(unwrapExpression(value.arguments[0].body), { parameters, fail, stateNames, selectorStates, declarations })]], selectorStates }
    }
    if (method === "flatMap") {
      if (value.arguments.length !== 1) fail(value, "Rendered collection flatMap() requires one inline projector")
      const source = analyzeCollectionPipeline(value.expression.expression, nestedOptions)
      if (!source) return undefined
      const parameters = collectionParameters(value.arguments[0], "Rendered collection flatMap()", fail)
      const field = directProperty(value.arguments[0].body, parameters.item)
      if (!field) fail(value.arguments[0].body, `Rendered collection flatMap() projector must be ${parameters.item}.<field>`)
      if (["__proto__", "constructor", "prototype"].includes(field)) fail(value.arguments[0].body, `Rendered collection property "${field}" is not supported`)
      return { ...source, selector: [...source.selector, ["flatMap", field]] }
    }
    if (method === "slice") {
      if (value.arguments.length < 1 || value.arguments.length > 2) fail(value, "Rendered collection slice() requires a start and optional end")
      const source = analyzeCollectionPipeline(value.expression.expression, nestedOptions)
      if (!source) return undefined
      const selectorStates = new Set(source.selectorStates)
      const start = collectionExpression(value.arguments[0], { fail, stateNames, selectorStates })
      const end = value.arguments[1] && collectionExpression(value.arguments[1], { fail, stateNames, selectorStates })
      return { ...source, selector: [...source.selector, ["slice", start, end]], selectorStates }
    }
    if (method === "toSorted") {
      if (value.arguments.length !== 1) fail(value, "Rendered collection toSorted() requires one inline comparator")
      const source = analyzeCollectionPipeline(value.expression.expression, nestedOptions)
      if (!source) return undefined
      const comparator = value.arguments[0]
      const parameters = collectionParameters(comparator, "Rendered collection toSorted()", fail)
      if (comparator.parameters.length !== 2 || ts.isBlock(comparator.body)) fail(comparator, "Rendered collection toSorted() comparator must be a synchronous expression arrow with (left, right) identifier parameters")
      const selectorStates = new Set(source.selectorStates)
      const encoded = collectionExpression(comparator.body, { parameters, fail, stateNames, selectorStates })
      return { ...source, selector: [...source.selector, ["sort", encoded]], selectorStates }
    }
    if (method === "sort") fail(value, "Rendered collections cannot use mutating sort(); use toSorted()")
  }
  if (isArrayFromCall(value)) {
    if (value.arguments.length < 1 || value.arguments.length > 2) fail(value, "Rendered Array.from() requires an anchor and optional inline mapper")
    const source = analyzeCollectionPipeline(value.arguments[0], nestedOptions)
    if (!source) return undefined
    let mapper
    if (value.arguments[1]) {
      const parameters = collectionParameters(value.arguments[1], "Rendered Array.from() mapper", fail)
      const selectorStates = new Set(source.selectorStates)
      mapper = collectionExpression(unwrapExpression(value.arguments[1].body), { parameters, fail, stateNames, selectorStates })
      source.selectorStates = selectorStates
    }
    return { ...source, selector: [...source.selector, ["from", mapper]] }
  }
}

export function collectionExpression(expression, { parameters = {}, fail, stateNames = new Set(), selectorStates = new Set(), declarations, aliases = new Set() }) {
  const encode = node => {
    node = unwrapExpression(node)
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isNumericLiteral(node)) return ["value", ts.isNumericLiteral(node) ? Number(node.text) : node.text]
    if (node.kind === ts.SyntaxKind.TrueKeyword) return ["value", true]
    if (node.kind === ts.SyntaxKind.FalseKeyword) return ["value", false]
    if (node.kind === ts.SyntaxKind.NullKeyword) return ["value", null]
    if (ts.isIdentifier(node)) {
      if (node.text === parameters.item) return ["item"]
      if (node.text === parameters.index) return ["index"]
      if (node.text === "undefined") return ["undefined"]
      if (stateNames.has(node.text)) {
        selectorStates.add(node.text)
        return ["state", node.text]
      }
      const entries = declarations?.get(node.text)
      if (entries?.length === 1 && entries[0].node.parent?.parent?.parent === nearestFunction(entries[0].node)?.body) {
        if (aliases.has(node.text)) fail(node, `Rendered collection expression local cycle at "${node.text}"`)
        aliases.add(node.text)
        const dependencies = new Set()
        const result = collectionExpression(entries[0].initializer, { fail, stateNames, selectorStates: dependencies, declarations, aliases })
        for (const name of dependencies) {
          if (name === parameters.item || name === parameters.index) fail(node, `Rendered collection expression local "${node.text}" cannot capture state shadowed by predicate parameters`)
          selectorStates.add(name)
        }
        aliases.delete(node.text)
        return result
      }
      fail(node, `Rendered collection expression identifier "${node.text}" is not allowed`)
    }
    if (ts.isPropertyAccessExpression(node)) {
      if (["__proto__", "constructor", "prototype"].includes(node.name.text)) fail(node, `Rendered collection property "${node.name.text}" is not supported`)
      return ["get", encode(node.expression), node.name.text, Boolean(node.questionDotToken)]
    }
    if (ts.isElementAccessExpression(node)) {
      const key = node.argumentExpression
      if (!ts.isStringLiteral(key) && !ts.isNumericLiteral(key)) fail(node, "Rendered collection computed properties require a direct string or numeric literal key")
      if (ts.isStringLiteral(key) && ["__proto__", "constructor", "prototype"].includes(key.text)) fail(node, `Rendered collection property "${key.text}" is not supported`)
      return ["get", encode(node.expression), ts.isNumericLiteral(key) ? Number(key.text) : key.text, Boolean(node.questionDotToken)]
    }
    if (ts.isPrefixUnaryExpression(node)) {
      const operator = node.operator === ts.SyntaxKind.ExclamationToken ? "!" : node.operator === ts.SyntaxKind.PlusToken ? "+" : node.operator === ts.SyntaxKind.MinusToken ? "-" : undefined
      if (!operator) fail(node, "Rendered collection expression uses an unsupported unary operator")
      return ["unary", operator, encode(node.operand)]
    }
    if (ts.isTypeOfExpression(node)) return ["unary", "typeof", encode(node.expression)]
    if (ts.isBinaryExpression(node)) {
      const operator = node.operatorToken.getText()
      if (!new Set(["&&", "||", "??", "===", "!==", "==", "!=", "<", "<=", ">", ">=", "+", "-", "*", "/", "%"]).has(operator)) fail(node, `Rendered collection expression operator "${operator}" is not supported`)
      return ["binary", operator, encode(node.left), encode(node.right)]
    }
    if (ts.isConditionalExpression(node)) return ["conditional", encode(node.condition), encode(node.whenTrue), encode(node.whenFalse)]
    if (ts.isArrayLiteralExpression(node) && !node.elements.some(ts.isSpreadElement)) return ["array", ...node.elements.map(encode)]
    if (ts.isObjectLiteralExpression(node)) return ["object", ...node.properties.map(property => {
      if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name) && !ts.isStringLiteral(property.name) && !ts.isNumericLiteral(property.name)) fail(property, "Rendered collection mapper objects require direct properties")
      return [property.name.text, encode(property.initializer)]
    })]
    if (ts.isTemplateExpression(node)) return ["template", [node.head.text, ...node.templateSpans.map(span => span.literal.text)], node.templateSpans.map(span => encode(span.expression))]
    if (ts.isCallExpression(node)) {
      if (ts.isIdentifier(node.expression) && ["Boolean", "Number", "String"].includes(node.expression.text)) return ["global", node.expression.text, ...node.arguments.map(encode)]
      if (ts.isPropertyAccessExpression(node.expression)) {
        const method = node.expression.name.text
        if (ts.isIdentifier(node.expression.expression) && node.expression.expression.text === "Math" && pureCollectionMathMethods.has(method)) return ["math", method, ...node.arguments.map(encode)]
        if (pureCollectionMethods.has(method)) return ["call", encode(node.expression.expression), method, ...node.arguments.map(encode)]
        if (mutatingCollectionMethods.has(method)) fail(node, `Rendered collection expressions cannot call mutating method "${method}"`)
      }
      fail(node, "Rendered collection expressions cannot call arbitrary functions")
    }
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isAwaitExpression(node) || ts.isNewExpression(node) || ts.isYieldExpression(node) || ts.isDeleteExpression(node) || ts.isPostfixUnaryExpression(node)) fail(node, "Rendered collection expressions must be pure and synchronous")
    fail(node, "Rendered collection expression is not supported")
  }
  return encode(expression)
}

function directProperty(expression, objectName) {
  const value = unwrapExpression(expression)
  if (!ts.isPropertyAccessExpression(value) || !ts.isIdentifier(value.expression)) return undefined
  if (objectName !== undefined && value.expression.text !== objectName) return undefined
  return value.name.text
}
