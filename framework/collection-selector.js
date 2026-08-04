export function selectCollection(anchor, selector = [], readState) {
  let values = anchor == null ? [] : anchor
  const state = readState ? new Map() : undefined
  const read = state ? name => {
    if (!state.has(name)) state.set(name, readState(name))
    return state.get(name)
  } : undefined
  for (const operation of selector) {
    if (operation[0] === "from") values = Array.from(values, operation[1] ? (item, index) => evaluateCollectionExpression(operation[1], item, index, read) : undefined)
    else {
      if (!Array.isArray(values)) throw new Error("Rendered collection source must remain an array")
      if (operation[0] === "filter") values = values.filter((item, index) => evaluateCollectionExpression(operation[1], item, index, read))
      else if (operation[0] === "flatMap") values = values.flatMap(item => item?.[operation[1]] ?? [])
      else if (operation[0] === "slice") values = values.slice(evaluateCollectionExpression(operation[1], undefined, undefined, read), operation[2] && evaluateCollectionExpression(operation[2], undefined, undefined, read))
      else if (operation[0] === "sort") values = [...values].sort((left, right) => evaluateCollectionExpression(operation[1], left, right, read))
    }
  }
  if (!Array.isArray(values)) throw new Error("Rendered collection source must remain an array")
  return values
}

export function evaluateCollectionExpression(expression, item, index, readState) {
  const kind = expression[0]
  if (kind === "value") return expression[1]
  if (kind === "undefined") return undefined
  if (kind === "item") return item
  if (kind === "index") return index
  if (kind === "state") {
    if (!readState) throw new Error(`Rendered collection state ${JSON.stringify(expression[1])} is not available`)
    return readState(expression[1])
  }
  if (kind === "get") {
    const object = evaluateCollectionExpression(expression[1], item, index, readState)
    return object == null && expression[3] ? undefined : object[expression[2]]
  }
  if (kind === "unary") {
    const value = evaluateCollectionExpression(expression[2], item, index, readState)
    if (expression[1] === "!") return !value
    if (expression[1] === "+") return +value
    if (expression[1] === "-") return -value
    if (expression[1] === "typeof") return typeof value
  }
  if (kind === "binary") {
    const operator = expression[1]
    const left = evaluateCollectionExpression(expression[2], item, index, readState)
    if (operator === "&&") return left && evaluateCollectionExpression(expression[3], item, index, readState)
    if (operator === "||") return left || evaluateCollectionExpression(expression[3], item, index, readState)
    if (operator === "??") return left ?? evaluateCollectionExpression(expression[3], item, index, readState)
    const right = evaluateCollectionExpression(expression[3], item, index, readState)
    if (operator === "===") return left === right
    if (operator === "!==") return left !== right
    if (operator === "==") return left == right
    if (operator === "!=") return left != right
    if (operator === "<") return left < right
    if (operator === "<=") return left <= right
    if (operator === ">") return left > right
    if (operator === ">=") return left >= right
    if (operator === "+") return left + right
    if (operator === "-") return left - right
    if (operator === "*") return left * right
    if (operator === "/") return left / right
    if (operator === "%") return left % right
  }
  if (kind === "conditional") return evaluateCollectionExpression(expression[1], item, index, readState) ? evaluateCollectionExpression(expression[2], item, index, readState) : evaluateCollectionExpression(expression[3], item, index, readState)
  if (kind === "array") return expression.slice(1).map(value => evaluateCollectionExpression(value, item, index, readState))
  if (kind === "object") return Object.fromEntries(expression.slice(1).map(([key, value]) => [key, evaluateCollectionExpression(value, item, index, readState)]))
  if (kind === "template") return expression[1].map((text, offset) => text + (offset < expression[2].length ? evaluateCollectionExpression(expression[2][offset], item, index, readState) : "")).join("")
  if (kind === "call") {
    const receiver = evaluateCollectionExpression(expression[1], item, index, readState)
    if (expression.length === 3) return receiver[expression[2]]()
    if (expression.length === 4) return receiver[expression[2]](evaluateCollectionExpression(expression[3], item, index, readState))
    const arguments_ = new Array(expression.length - 3)
    for (let offset = 3; offset < expression.length; offset++) arguments_[offset - 3] = evaluateCollectionExpression(expression[offset], item, index, readState)
    return receiver[expression[2]](...arguments_)
  }
  if (kind === "global" || kind === "math") {
    const arguments_ = new Array(expression.length - 2)
    for (let offset = 2; offset < expression.length; offset++) arguments_[offset - 2] = evaluateCollectionExpression(expression[offset], item, index, readState)
    return (kind === "global" ? globalThis : Math)[expression[1]](...arguments_)
  }
  throw new Error(`Unsupported rendered collection expression: ${String(kind)}`)
}
