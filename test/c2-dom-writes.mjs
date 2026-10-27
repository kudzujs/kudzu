import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFile, readdir, writeFile } from "node:fs/promises"
import { join, relative } from "node:path"
import ts from "typescript"

export function instrumentWrites(source, path) {
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
  assert.equal(file.parseDiagnostics.length, 0, path)
  const edits = []
  const access = node => ts.isPropertyAccessExpression(node) ? [node.expression, JSON.stringify(node.name.text)] : ts.isElementAccessExpression(node) ? [node.expression, node.argumentExpression.getText(file)] : undefined
  const visit = node => {
    let replacement
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && ["setAttribute", "removeAttribute", "toggleAttribute"].includes(node.expression.name.text)) {
      assert.ok(!node.questionDotToken && !node.expression.questionDotToken, "optional write call")
      replacement = `globalThis.__c2Write(${JSON.stringify(path)},"attribute",${node.expression.expression.getText(file)},${JSON.stringify(node.expression.name.text)},[${node.arguments.map(argument => argument.getText(file)).join(",")}])`
    } else if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
      const target = access(node.left)
      if (target) {
        const [receiver, key] = target
        const dataset = ts.isPropertyAccessExpression(receiver) && receiver.name.text === "dataset"
        if (dataset || ts.isPropertyAccessExpression(node.left) && ["textContent", "data", "value", "checked", "className"].includes(node.left.name.text)) {
          replacement = `globalThis.__c2Write(${JSON.stringify(path)},${JSON.stringify(dataset ? "dataset" : "property")},${(dataset ? receiver.expression : receiver).getText(file)},${key},${node.right.getText(file)})`
        }
      }
    }
    const before = edits.length
    ts.forEachChild(node, visit)
    if (replacement) {
      assert.equal(edits.length, before, "nested writes need explicit instrumentation support")
      edits.push({ start: node.getStart(file), end: node.end, replacement })
    }
  }
  visit(file)
  let marked = source
  for (const edit of edits.toSorted((a, b) => b.start - a.start)) marked = marked.slice(0, edit.start) + edit.replacement + marked.slice(edit.end)
  return { source: marked, sites: edits.length }
}

export async function instrumentDirectory(directory, manifestPath) {
  const manifest = []
  const hash = source => createHash("sha256").update(source).digest("hex")
  for (const entry of await readdir(directory, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".js")) continue
    const file = join(entry.parentPath, entry.name), path = relative(directory, file).replaceAll("\\", "/")
    const original = await readFile(file, "utf8"), marked = instrumentWrites(original, path)
    manifest.push({ path, sites: marked.sites, originalSha256: hash(original), markedSha256: hash(marked.source) })
    await writeFile(file, marked.source)
  }
  assert.ok(manifest.some(entry => entry.sites))
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2))
}

// Injected before navigation only in the diagnostic arm; every original write still runs.
export function installWriteCounter() {
  const owners = new WeakMap(), counts = Object.create(null)
  let indexed = false
  const owner = node => {
    if (!indexed) {
      for (const marker of document.querySelectorAll("template[data-k-list]")) {
        const id = JSON.parse(marker.dataset.kList).id
        for (let row = marker.nextElementSibling; row && row.dataset.kListEnd !== id; row = row.nextElementSibling) owners.set(row, id)
      }
      indexed = true
    }
    for (let current = node.ownerElement ?? node; current; current = current.parentNode) {
      if (owners.has(current)) return owners.get(current)
      if (current.dataset?.kListRoot) return current.dataset.kListRoot
    }
    return node.isConnected ? "outside-list" : "detached-unmapped"
  }
  globalThis.__c2Writes = counts
  globalThis.__c2Write = (module, kind, node, target, value) => {
    const dom = node instanceof Node
    const read = () => kind === "attribute" ? node.getAttribute(value[0]) : kind === "dataset" ? node.dataset[target] : node[target]
    const before = dom ? read() : undefined
    const list = dom ? owner(node) : undefined
    let result
    if (kind === "attribute") result = node[target](...value)
    else if (kind === "dataset") result = node.dataset[target] = value
    else result = node[target] = value
    if (dom) {
      const key = JSON.stringify([module, list, kind, kind === "attribute" ? value[0] : target, node.isConnected])
      const count = counts[key] ??= { calls: 0, same: 0, changed: 0 }
      count.calls++
      count[Object.is(before, read()) ? "same" : "changed"]++
    }
    return result
  }
}
