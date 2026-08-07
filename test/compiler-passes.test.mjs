import assert from "node:assert/strict"
import test from "node:test"
import ts from "typescript"
import { applyNormalizationPasses } from "../framework/compiler/normalization-pipeline.mjs"
import { normalizeRenderControlFlow } from "../framework/compiler/render-control-pass.mjs"

test("normalizes render control flow without changing lowercase helpers", () => {
  const source = ts.createSourceFile("pass.tsx", `
function Component(ready) {
  if (!ready) return <p>wait</p>
  return <main>ready</main>
}
const Assigned = ready => {
  let view
  if (ready) view = <main />
  else view = <p />
  return view
}
function helper(ready) {
  if (!ready) return "wait"
  return "ready"
}
`, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const result = ts.transform(source, [context => file => applyNormalizationPasses(file, [
    current => normalizeRenderControlFlow(current, context.factory, context)
  ])])
  const output = ts.createPrinter().printFile(result.transformed[0])
  const assertParentPointers = node => ts.forEachChild(node, child => {
    assert.equal(child.parent, node)
    assertParentPointers(child)
  })
  assertParentPointers(result.transformed[0])
  result.dispose()

  assert.match(output, /function Component\(ready\) \{\s*return !ready \? <p>wait<\/p> : <main>ready<\/main>;\s*\}/)
  assert.match(output, /const Assigned = ready => \{\s*const view = ready \? <main \/> : <p \/>;\s*return view;\s*\}/)
  assert.match(output, /function helper\(ready\) \{\s*if \(!ready\)\s*return "wait";\s*return "ready";\s*\}/)
})
