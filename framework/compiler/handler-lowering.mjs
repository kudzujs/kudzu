import ts from "typescript"
import { isFunctionLike, isReferenceIdentifier, isShadowedByParameter, isShadowedIdentifier, sourceNodeError } from "./ast-helpers.mjs"

export function createHandlerLowering({ cloneAst, synthesizeTree }) {
  return { lowerListExpression: printListExpression, lowerNativeHandler: printNativeHandler, lowerReactiveBinding: printReactiveBinding }

  function printNativeHandler({ exportName, expression, captures, setters, reducers = new Map(), snapshotNested, liveStates = new Set() }) {
    const factory = ts.factory
    const stateNames = new Set(setters.values())
    const snapshotNames = snapshotNested ? nestedStateNames(expression, setters, liveStates) : new Set()
    const snapshots = new Map([...snapshotNames].map(name => [name, factory.createUniqueName("__kEffectState")]))
    const captureSnapshotNames = snapshotNested ? nestedCaptureNames(expression, captures) : new Set()
    const captureSnapshots = new Map([...captureSnapshotNames].map(name => [name, factory.createUniqueName("__kEffectCapture")]))
    const transformer = context => root => {
      const visitor = node => {
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && reducers.has(node.expression.text) && !isShadowedIdentifier(node.expression, expression)) {
          const reducer = reducers.get(node.expression.text)
          if (reducer.contextAction) {
            const action = synthesizeTree(cloneAst(reducer.contextAction, factory, context))
            const call = factory.createCallExpression(action, undefined, node.arguments)
            ts.setParentRecursive(call, false)
            return ts.visitNode(call, visitor)
          }
          if (reducer.store) return zustandActionDispatch(factory, reducer, node.arguments.map(argument => ts.visitNode(argument, visitor)))
          if (node.arguments.length !== 1) throw sourceNodeError(node, expression.getSourceFile(), "Reducer dispatches require exactly one action")
          return reducerDispatch(factory, reducer, ts.visitNode(node.arguments[0], visitor))
        }
        if (ts.isShorthandPropertyAssignment(node) && reducers.has(node.name.text) && !isShadowedIdentifier(node.name, expression)) {
          if (reducers.get(node.name.text).contextAction) throw sourceNodeError(node, expression.getSourceFile(), "Context actions must be called directly inside an event handler")
          if (reducers.get(node.name.text).store) throw sourceNodeError(node, expression.getSourceFile(), "Zustand actions must be called directly inside an event handler")
          return factory.createPropertyAssignment(node.name, reducerReference(factory, reducers.get(node.name.text)))
        }
        if (ts.isIdentifier(node) && reducers.has(node.text) && isReferenceIdentifier(node) && !isShadowedIdentifier(node, expression)) {
          if (reducers.get(node.text).contextAction) throw sourceNodeError(node, expression.getSourceFile(), "Context actions must be called directly inside an event handler")
          if (reducers.get(node.text).store) throw sourceNodeError(node, expression.getSourceFile(), "Zustand actions must be called directly inside an event handler")
          return reducerReference(factory, reducers.get(node.text))
        }
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && setters.has(node.expression.text) && !isShadowedIdentifier(node.expression, expression)) {
          return factory.createCallExpression(
            factory.createPropertyAccessExpression(factory.createIdentifier("__k"), "set"),
            undefined,
            [factory.createStringLiteral(setters.get(node.expression.text)), ...node.arguments.map(argument => ts.visitNode(argument, visitor))]
          )
        }
        if (ts.isShorthandPropertyAssignment(node) && setters.has(node.name.text) && !isShadowedIdentifier(node.name, expression)) {
          return factory.createPropertyAssignment(node.name, setterReference(factory, setters.get(node.name.text)))
        }
        if (ts.isIdentifier(node) && setters.has(node.text) && isReferenceIdentifier(node) && !isShadowedIdentifier(node, expression)) {
          return setterReference(factory, setters.get(node.text))
        }
        if (ts.isShorthandPropertyAssignment(node) && stateNames.has(node.name.text) && !isShadowedIdentifier(node.name, expression)) {
          if (snapshots.has(node.name.text) && insideNestedFunction(node, expression)) return factory.createPropertyAssignment(node.name, snapshots.get(node.name.text))
          return factory.createPropertyAssignment(node.name, factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier("__k"), "get"), undefined, [factory.createStringLiteral(node.name.text)]))
        }
        if (ts.isIdentifier(node) && stateNames.has(node.text) && isReferenceIdentifier(node) && !isShadowedIdentifier(node, expression)) {
          if (snapshots.has(node.text) && insideNestedFunction(node, expression)) return snapshots.get(node.text)
          return factory.createCallExpression(
            factory.createPropertyAccessExpression(factory.createIdentifier("__k"), "get"),
            undefined,
            [factory.createStringLiteral(node.text)]
          )
        }
        if (ts.isShorthandPropertyAssignment(node) && captures.has(node.name.text) && !isShadowedIdentifier(node.name, expression)) {
          if (captureSnapshots.has(node.name.text) && insideNestedFunction(node, expression)) return factory.createPropertyAssignment(node.name, captureSnapshots.get(node.name.text))
          return factory.createPropertyAssignment(node.name, scopeRead(factory, node.name.text))
        }
        if (ts.isIdentifier(node) && captures.has(node.text) && isReferenceIdentifier(node) && !isShadowedIdentifier(node, expression)) {
          if (captureSnapshots.has(node.text) && insideNestedFunction(node, expression)) return captureSnapshots.get(node.text)
          return scopeRead(factory, node.text)
        }
        return ts.visitEachChild(node, visitor, context)
      }
      return ts.visitNode(root, visitor)
    }
    const transformed = ts.transform(expression.body, [transformer])
    try {
      let body = ts.isBlock(expression.body)
        ? transformed.transformed[0]
        : factory.createBlock([factory.createReturnStatement(transformed.transformed[0])], true)
      const snapshotDeclarations = [
        ...[...snapshots].map(([name, identifier]) => factory.createVariableDeclaration(identifier, undefined, undefined, factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier("__k"), "get"), undefined, [factory.createStringLiteral(name)]))),
        ...[...captureSnapshots].map(([name, identifier]) => factory.createVariableDeclaration(identifier, undefined, undefined, factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier("__k"), "scope"), undefined, [factory.createStringLiteral(name)])))
      ]
      if (snapshotDeclarations.length) body = factory.updateBlock(body, [
        factory.createVariableStatement(undefined, factory.createVariableDeclarationList(snapshotDeclarations, ts.NodeFlags.Const)),
        ...body.statements
      ])
      const modifiers = [factory.createModifier(ts.SyntaxKind.ExportKeyword)]
      if (expression.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword)) modifiers.push(factory.createModifier(ts.SyntaxKind.AsyncKeyword))
      const declaration = factory.createFunctionDeclaration(
        modifiers,
        expression.asteriskToken,
        exportName,
        undefined,
        [factory.createParameterDeclaration(undefined, undefined, "__k"), ...expression.parameters],
        undefined,
        body
      )
      return {
        code: ts.createPrinter().printNode(ts.EmitHint.Unspecified, declaration, expression.getSourceFile()),
        stateSnapshots: [...snapshotNames],
        captureSnapshots: [...captureSnapshotNames]
      }
    } finally {
      transformed.dispose()
    }
  }

  function nestedCaptureNames(expression, captures) {
    const names = new Set()
    const visit = node => {
      if (ts.isIdentifier(node) && captures.has(node.text) && isReferenceIdentifier(node) && insideNestedFunction(node, expression) && !isShadowedIdentifier(node, expression)) names.add(node.text)
      ts.forEachChild(node, visit)
    }
    visit(expression.body)
    return names
  }

  function nestedStateNames(expression, setters, liveStates = new Set()) {
    const states = new Set(setters.values())
    const names = new Set()
    const visit = node => {
      if (ts.isIdentifier(node) && states.has(node.text) && !liveStates.has(node.text) && isReferenceIdentifier(node) && insideNestedFunction(node, expression) && !isShadowedIdentifier(node, expression)) names.add(node.text)
      ts.forEachChild(node, visit)
    }
    visit(expression.body)
    return names
  }

  function insideNestedFunction(node, root) {
    for (let current = node.parent; current && current !== root; current = current.parent) {
      if (isFunctionLike(current)) return true
    }
    return false
  }

  function setterReference(factory, stateName) {
    return factory.createArrowFunction(
      undefined,
      undefined,
      [factory.createParameterDeclaration(undefined, undefined, "value")],
      undefined,
      factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
      factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier("__k"), "set"), undefined, [factory.createStringLiteral(stateName), factory.createIdentifier("value")])
    )
  }

  function reducerReference(factory, reducer) {
    const action = factory.createUniqueName("__kAction")
    return factory.createArrowFunction(undefined, undefined, [factory.createParameterDeclaration(undefined, undefined, action)], undefined, factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), reducerDispatch(factory, reducer, action))
  }

  function reducerDispatch(factory, reducer, action) {
    if (reducer.store) return zustandActionDispatch(factory, reducer, [action])
    const previous = factory.createUniqueName("__kPrevious")
    const update = factory.createArrowFunction(undefined, undefined, [factory.createParameterDeclaration(undefined, undefined, previous)], undefined, factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), factory.createCallExpression(factory.createIdentifier(reducer.reducer), undefined, [previous, action]))
    return factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier("__k"), "set"), undefined, [factory.createStringLiteral(reducer.state), update])
  }

  function zustandActionDispatch(factory, reducer, args) {
    const previous = factory.createUniqueName("__kPrevious")
    const current = factory.createUniqueName("__kStore")
    const updateValue = factory.createUniqueName("__kUpdate")
    const partial = factory.createUniqueName("__kPartial")
    const action = factory.createUniqueName("__kAction")
    const set = factory.createIdentifier(reducer.store.setName)
    const merge = factory.createExpressionStatement(factory.createBinaryExpression(current, factory.createToken(ts.SyntaxKind.EqualsToken), factory.createObjectLiteralExpression([
      factory.createSpreadAssignment(current),
      factory.createSpreadAssignment(partial)
    ])))
    const setBody = factory.createBlock([
      factory.createVariableStatement(undefined, factory.createVariableDeclarationList([factory.createVariableDeclaration(partial, undefined, undefined, factory.createConditionalExpression(
        factory.createBinaryExpression(factory.createTypeOfExpression(updateValue), factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken), factory.createStringLiteral("function")),
        undefined,
        factory.createCallExpression(updateValue, undefined, [current]),
        undefined,
        updateValue
      ))], ts.NodeFlags.Const)),
      merge
    ], true)
    const body = factory.createBlock([
      factory.createVariableStatement(undefined, factory.createVariableDeclarationList([factory.createVariableDeclaration(current, undefined, undefined, factory.createObjectLiteralExpression([factory.createPropertyAssignment(reducer.store.field, previous)]))], ts.NodeFlags.Let)),
      factory.createVariableStatement(undefined, factory.createVariableDeclarationList([factory.createVariableDeclaration(set, undefined, undefined, factory.createArrowFunction(undefined, undefined, [factory.createParameterDeclaration(undefined, undefined, updateValue)], undefined, factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), setBody))], ts.NodeFlags.Const)),
      factory.createVariableStatement(undefined, factory.createVariableDeclarationList([factory.createVariableDeclaration(action, undefined, undefined, synthesizeTree(reducer.store.actions.get(reducer.action)))], ts.NodeFlags.Const)),
      factory.createExpressionStatement(factory.createCallExpression(action, undefined, args)),
      factory.createReturnStatement(factory.createPropertyAccessExpression(current, reducer.store.field))
    ], true)
    const update = factory.createArrowFunction(undefined, undefined, [factory.createParameterDeclaration(undefined, undefined, previous)], undefined, factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), body)
    return factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier("__k"), "set"), undefined, [factory.createStringLiteral(reducer.state), update])
  }

  function printReactiveBinding({ exportName, expression, captures, states }) {
    const factory = ts.factory
    const transformer = context => root => {
      const visitor = node => {
        if (ts.isShorthandPropertyAssignment(node) && states.has(node.name.text)) {
          return factory.createPropertyAssignment(
            node.name,
            factory.createCallExpression(
              factory.createPropertyAccessExpression(factory.createIdentifier("__k"), "get"),
              undefined,
              [factory.createStringLiteral(node.name.text)]
            )
          )
        }
        if (ts.isIdentifier(node) && states.has(node.text) && isReferenceIdentifier(node) && !isShadowedByParameter(node, expression)) {
          return factory.createCallExpression(
            factory.createPropertyAccessExpression(factory.createIdentifier("__k"), "get"),
            undefined,
            [factory.createStringLiteral(node.text)]
          )
        }
        if (ts.isShorthandPropertyAssignment(node) && captures.has(node.name.text)) {
          return factory.createPropertyAssignment(node.name, scopeRead(factory, node.name.text))
        }
        if (ts.isIdentifier(node) && captures.has(node.text) && isReferenceIdentifier(node)) {
          return scopeRead(factory, node.text)
        }
        return ts.visitEachChild(node, visitor, context)
      }
      return ts.visitNode(root, visitor)
    }
    const transformed = ts.transform(expression, [transformer])
    try {
      const declaration = factory.createFunctionDeclaration(
        [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        undefined,
        exportName,
        undefined,
        [factory.createParameterDeclaration(undefined, undefined, "__k")],
        undefined,
        factory.createBlock([factory.createReturnStatement(transformed.transformed[0])], true)
      )
      return ts.createPrinter().printNode(ts.EmitHint.Unspecified, declaration, expression.getSourceFile())
    } finally {
      transformed.dispose()
    }
  }

  function printListExpression({ exportName, expression, item, index, states = new Set() }) {
    const factory = ts.factory
    const transformer = context => root => {
      const visitor = node => {
        if (ts.isShorthandPropertyAssignment(node) && states.has(node.name.text)) {
          return factory.createPropertyAssignment(node.name, factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier("__k"), "get"), undefined, [factory.createStringLiteral(node.name.text)]))
        }
        if (ts.isIdentifier(node) && states.has(node.text) && isReferenceIdentifier(node) && !isShadowedByParameter(node, expression)) {
          return factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier("__k"), "get"), undefined, [factory.createStringLiteral(node.text)])
        }
        return ts.visitEachChild(node, visitor, context)
      }
      return ts.visitNode(root, visitor)
    }
    const transformed = ts.transform(expression, [transformer])
    const declaration = ts.factory.createFunctionDeclaration(
      [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      undefined,
      exportName,
      undefined,
      [ts.factory.createParameterDeclaration(undefined, undefined, item), ts.factory.createParameterDeclaration(undefined, undefined, index ?? "__kIndex"), ts.factory.createParameterDeclaration(undefined, undefined, "__k")],
      undefined,
      ts.factory.createBlock([ts.factory.createReturnStatement(transformed.transformed[0])], true)
    )
    try {
      return ts.createPrinter().printNode(ts.EmitHint.Unspecified, declaration, expression.getSourceFile())
    } finally {
      transformed.dispose()
    }
  }

  function scopeRead(factory, name) {
    return factory.createCallExpression(
      factory.createPropertyAccessExpression(factory.createIdentifier("__k"), "scope"),
      undefined,
      [factory.createStringLiteral(name)]
    )
  }
}
