import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import ts from "typescript"

test("navigation fetch rejects foreign origins before issuing a request", async () => {
  const source = await readFile(new URL("../framework/navigation-runtime.js", import.meta.url), "utf8")
  const parsed = ts.createSourceFile("navigation-runtime.js", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
  const declaration = parsed.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "fetchDocument")
  assert.ok(declaration)
  const requests = [], reachedFetch = new Error("request reached fetch")
  const fetchDocument = new Function("location", "fetch", "requestError", `return (${declaration.getText(parsed)})`)(
    { origin: "https://kudzu.test" },
    async (...args) => { requests.push(args); throw reachedFetch },
    error => error
  )
  for (const target of ["https://other.test/app", "http://kudzu.test/app", "https://kudzu.test:8443/app"]) {
    await assert.rejects(fetchDocument(new URL(target), {}), /Navigation request must be same-origin/)
  }
  assert.equal(requests.length, 0)
  const url = new URL("https://kudzu.test/app?tab=one"), signal = new AbortController().signal
  await assert.rejects(fetchDocument(url, {}, signal), error => error === reachedFetch)
  assert.deepEqual(requests, [[url, { signal, redirect: "manual", headers: { accept: "text/html" } }]])
})
