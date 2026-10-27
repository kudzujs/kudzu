import assert from "node:assert/strict"
import test from "node:test"
import { census } from "./html-byte-census.mjs"

test("HTML census conserves UTF-8 source bytes and exact encoded repetitions", () => {
  const repeated = ` data-k-bind-attrs='[{"target":"title","state":"s1"}]'`
  const source = `<!doctype html><main title=ok data-k-value='"한글 > &lt;"'><i${repeated}></i><b${repeated}></b><!--k-text:0-->한글<!--k-text-end--></main>`
  const report = census(source)
  assert.equal(report.rawBytes, Buffer.byteLength(source))
  assert.equal(report.metadataBytes + report.residualBytes, report.rawBytes)
  const binding = report.attributes.find(entry => entry.name === "data-k-bind-attrs")
  assert.equal(binding.rawBytes, Buffer.byteLength(repeated) * 2)
  assert.equal(binding.distinctEncodedValues, 1)
  assert.equal(binding.repeatedValueBytes, Buffer.byteLength('[{"target":"title","state":"s1"}]'))
  assert.equal(report.attributes.find(entry => entry.name === "data-k-value").category, "state-seeds")
  assert.equal(report.attributes.filter(entry => entry.name.startsWith("comment:")).length, 2)
})

test("HTML census excludes marker-like text in raw-text elements and ordinary comments", () => {
  const source = `<script>const html = '<b data-k-value="bad">'</script><style>a:before { content: '<i data-k-ref="bad">' }</style><textarea><b data-k-text="bad"></textarea><title><b data-k-text="bad"></title><!-- <b data-k-value="bad"> --><template data-k-list='{"id":"l0"}'><input data-k-ref=r0></template>`
  const report = census(source)
  assert.deepEqual(report.attributes.map(entry => entry.name).sort(), ["data-k-list", "data-k-ref"])
  assert.equal(report.attributes.find(entry => entry.name === "data-k-ref").valueBytes, 2)
  assert.throws(() => census('<p data-k-value="unterminated>'), /invalid attribute/)
  assert.throws(() => census("<!--unterminated"), /unterminated HTML comment/)
  assert.throws(() => census('<script>"<b>"'), /unclosed raw-text/)
})
