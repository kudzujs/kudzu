import ts from "typescript"

export function generateCommandBehavior(moduleIR, handler, factory = ts.factory) {
  const commands = handler.commands.map(command => factory.createArrayLiteralExpression([
    factory.createStringLiteral(command.operation),
    factory.createIdentifier(moduleIR.signals[command.signal].debugName),
    literal(factory, command.value, command.syntax)
  ]))
  return factory.createCallExpression(factory.createIdentifier("__kBehavior"), undefined, [factory.createArrayLiteralExpression(commands)])
}

function literal(factory, value, syntax) {
  if (value === null) return factory.createNull()
  if (typeof value === "string") return factory.createStringLiteral(value)
  if (typeof value === "boolean") return value ? factory.createTrue() : factory.createFalse()
  const number = factory.createNumericLiteral(Math.abs(value))
  if (syntax === "positive") return factory.createPrefixUnaryExpression(ts.SyntaxKind.PlusToken, number)
  if (syntax === "negative") return factory.createPrefixUnaryExpression(ts.SyntaxKind.MinusToken, number)
  return value < 0 ? factory.createPrefixUnaryExpression(ts.SyntaxKind.MinusToken, number) : number
}
