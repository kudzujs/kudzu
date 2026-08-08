import ts from "typescript"

export function createCommandSpecializer({ isPrimitiveLiteral }) {
  return function specializeCommand(expression, setters) {
    if (ts.isCallExpression(expression) && ts.isPropertyAccessExpression(expression.expression) && ts.isIdentifier(expression.expression.expression) && expression.expression.expression.text === "console" && expression.expression.name.text === "log" && expression.arguments.length === 2 && ts.isStringLiteral(expression.arguments[0]) && ts.isIdentifier(expression.arguments[1]) && [...setters.values()].includes(expression.arguments[1].text)) {
      return { operation: "log", state: expression.arguments[1].text, value: expression.arguments[0].text }
    }

    if (!ts.isCallExpression(expression) || !ts.isIdentifier(expression.expression) || expression.arguments.length !== 1) return undefined
    const state = setters.get(expression.expression.text)
    if (!state) return undefined

    const value = expression.arguments[0]
    if (ts.isBinaryExpression(value) && ts.isIdentifier(value.left) && value.left.text === state && ts.isNumericLiteral(value.right)) {
      if (value.operatorToken.kind !== ts.SyntaxKind.PlusToken && value.operatorToken.kind !== ts.SyntaxKind.MinusToken) return undefined
      const operand = signedNumber(value.right, value.operatorToken.kind === ts.SyntaxKind.MinusToken ? "negative" : undefined)
      return operand ? { operation: "add", state, ...operand } : undefined
    }
    if (ts.isArrowFunction(value) && value.parameters.length === 1 && ts.isIdentifier(value.parameters[0].name) && ts.isBinaryExpression(value.body) && ts.isIdentifier(value.body.left) && value.body.left.text === value.parameters[0].name.text && ts.isNumericLiteral(value.body.right)) {
      if (value.body.operatorToken.kind !== ts.SyntaxKind.PlusToken && value.body.operatorToken.kind !== ts.SyntaxKind.MinusToken) return undefined
      const operand = signedNumber(value.body.right, value.body.operatorToken.kind === ts.SyntaxKind.MinusToken ? "negative" : undefined)
      return operand ? { operation: "add", state, ...operand } : undefined
    }
    if (isPrimitiveLiteral(value)) {
      const literal = primitiveValue(value)
      return literal ? { operation: "set", state, ...literal } : undefined
    }
    return undefined
  }
}

function primitiveValue(node) {
  if (ts.isStringLiteral(node)) return { value: node.text }
  if (ts.isNumericLiteral(node)) return signedNumber(node)
  if (node.kind === ts.SyntaxKind.TrueKeyword) return { value: true }
  if (node.kind === ts.SyntaxKind.FalseKeyword) return { value: false }
  if (node.kind === ts.SyntaxKind.NullKeyword) return { value: null }
  return signedNumber(node.operand, node.operator === ts.SyntaxKind.MinusToken ? "negative" : "positive")
}

function signedNumber(node, syntax) {
  const number = Number(node.text)
  if (!Number.isFinite(number)) return undefined
  if (syntax === "negative") return number === 0 ? { value: 0, syntax } : { value: -number }
  return syntax ? { value: number, syntax } : { value: number }
}
