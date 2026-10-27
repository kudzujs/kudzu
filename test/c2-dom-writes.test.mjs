import assert from "node:assert/strict"
import test from "node:test"
import vm from "node:vm"
import { installWriteCounter, instrumentWrites } from "./c2-dom-writes.mjs"

test("write diagnostics preserve single evaluation, return values and same-value writes", () => {
  class Node {
    isConnected = true
    dataset = {}
    textContent = "same"
    writes = 0
    attributes = new Map([["title", "same"]])
    getAttribute(key) { return this.attributes.get(key) ?? null }
    setAttribute(key, value) { this.writes++; this.attributes.set(key, String(value)) }
    removeAttribute(key) { this.writes++; this.attributes.delete(key) }
    toggleAttribute(key) { this.writes++; if (this.attributes.has(key)) { this.attributes.delete(key); return false }; this.attributes.set(key, ""); return true }
  }
  const node = new Node(), context = vm.createContext({ Node, node, document: { querySelectorAll: () => [] } })
  vm.runInContext(`(${installWriteCounter})()`, context)
  const source = `let calls = 0; const get = () => { calls++; return node };
    get().setAttribute("title", "same"); get().setAttribute("title", "new");
    const result = get().textContent = "same";
    get().dataset.label = "a"; get().dataset["label"] = "a";
    const toggled = get().toggleAttribute("hidden"); get().removeAttribute("hidden");
    const plain = {}; plain.value = 42;
    globalThis.result = [calls, result, toggled, plain.value];`
  const marked = instrumentWrites(source, "module.js")
  assert.equal(marked.sites, 8)
  vm.runInContext(marked.source, context)
  assert.deepEqual(Array.from(context.result), [7, "same", true, 42])
  assert.equal(node.writes, 4, "same-value setAttribute still runs")
  const counts = Object.values(context.__c2Writes)
  assert.equal(counts.reduce((sum, count) => sum + count.calls, 0), 7)
  assert.equal(counts.reduce((sum, count) => sum + count.same, 0), 3)
  for (const count of counts) assert.equal(count.calls, count.same + count.changed)
  assert.throws(() => instrumentWrites('node.textContent = (other.textContent = "x")', "nested.js"), /nested writes/)
})

test("write counters distinguish initial row owners, detached clones and outside nodes", () => {
  class Node { dataset = {}; isConnected = true; textContent = "" }
  const row = new Node(), child = new Node(), end = new Node(), clone = new Node(), outside = new Node()
  child.parentNode = row
  row.nextElementSibling = end
  end.dataset.kListEnd = "l7"
  clone.dataset.kListRoot = "l8"
  clone.isConnected = false
  const marker = { dataset: { kList: '{"id":"l7"}' }, nextElementSibling: row }
  const context = vm.createContext({ Node, child, clone, outside, document: { querySelectorAll: () => [marker] } })
  vm.runInContext(`(${installWriteCounter})()`, context)
  vm.runInContext(instrumentWrites('child.textContent = "row"; clone.dataset.label = "clone"; outside.textContent = "other";', "module.js").source, context)
  assert.deepEqual(Object.keys(context.__c2Writes).map(key => JSON.parse(key).slice(1)), [
    ["l7", "property", "textContent", true], ["l8", "dataset", "label", false], ["outside-list", "property", "textContent", true]
  ])
})
