export function selectCollection(anchor, selector = []) {
  let values = anchor == null ? [] : anchor
  for (const operation of selector) {
    if (operation[0] === "from") values = Array.from(values, operation[1] ? (item, index) => evaluateCollectionExpression(operation[1], item, index) : undefined)
    else {
      if (!Array.isArray(values)) throw new Error("Rendered collection source must remain an array")
      if (operation[0] === "filter") values = values.filter((item, index) => evaluateCollectionExpression(operation[1], item, index))
      else if (operation[0] === "flatMap") values = values.flatMap(item => item?.[operation[1]] ?? [])
    }
  }
  if (!Array.isArray(values)) throw new Error("Rendered collection source must remain an array")
  return values
}

function evaluateCollectionExpression(expression, item, index) {
  const [kind, ...parts] = expression
  if (kind === "value") return parts[0]
  if (kind === "undefined") return undefined
  if (kind === "item") return item
  if (kind === "index") return index
  if (kind === "get") {
    const object = evaluateCollectionExpression(parts[0], item, index)
    return object == null && parts[2] ? undefined : object[parts[1]]
  }
  if (kind === "unary") {
    const value = evaluateCollectionExpression(parts[1], item, index)
    if (parts[0] === "!") return !value
    if (parts[0] === "+") return +value
    if (parts[0] === "-") return -value
    if (parts[0] === "typeof") return typeof value
  }
  if (kind === "binary") {
    const left = evaluateCollectionExpression(parts[1], item, index)
    if (parts[0] === "&&") return left && evaluateCollectionExpression(parts[2], item, index)
    if (parts[0] === "||") return left || evaluateCollectionExpression(parts[2], item, index)
    if (parts[0] === "??") return left ?? evaluateCollectionExpression(parts[2], item, index)
    const right = evaluateCollectionExpression(parts[2], item, index)
    if (parts[0] === "===") return left === right
    if (parts[0] === "!==") return left !== right
    if (parts[0] === "==") return left == right
    if (parts[0] === "!=") return left != right
    if (parts[0] === "<") return left < right
    if (parts[0] === "<=") return left <= right
    if (parts[0] === ">") return left > right
    if (parts[0] === ">=") return left >= right
    if (parts[0] === "+") return left + right
    if (parts[0] === "-") return left - right
    if (parts[0] === "*") return left * right
    if (parts[0] === "/") return left / right
    if (parts[0] === "%") return left % right
  }
  if (kind === "conditional") return evaluateCollectionExpression(parts[0], item, index) ? evaluateCollectionExpression(parts[1], item, index) : evaluateCollectionExpression(parts[2], item, index)
  if (kind === "array") return parts.map(value => evaluateCollectionExpression(value, item, index))
  if (kind === "object") return Object.fromEntries(parts.map(([key, value]) => [key, evaluateCollectionExpression(value, item, index)]))
  if (kind === "template") return parts[0].map((text, offset) => text + (offset < parts[1].length ? evaluateCollectionExpression(parts[1][offset], item, index) : "")).join("")
  if (kind === "call") {
    const receiver = evaluateCollectionExpression(parts[0], item, index)
    return receiver[parts[1]](...parts.slice(2).map(value => evaluateCollectionExpression(value, item, index)))
  }
  if (kind === "global") return globalThis[parts[0]](...parts.slice(1).map(value => evaluateCollectionExpression(value, item, index)))
  if (kind === "math") return Math[parts[0]](...parts.slice(1).map(value => evaluateCollectionExpression(value, item, index)))
  throw new Error(`Unsupported rendered collection expression: ${String(kind)}`)
}
