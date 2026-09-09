import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { mkdtemp, writeFile, rm, readFile, symlink, readdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { createServer } from "node:http"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { browserSmoke } from "./browser-smoke.mjs"

const chrome = !process.env.KUDZU_SKIP_BROWSER && process.platform === "linux" && existsSync(process.env.CHROME_BIN ?? "/usr/bin/google-chrome")
if (process.env.KUDZU_REQUIRE_CHROME && !chrome) throw new Error("Linux Chrome is required for browser smoke tests; set CHROME_BIN")

test("ordinary browser smoke separates rendered DOM from raw artifacts and reports failures", { timeout: 60_000, skip: !chrome }, async t => {
  const root = await mkdtemp(join(tmpdir(), "smoke-dom-"))
  t.after(() => rm(root, { recursive: true, force: true }))
  const html = '<!doctype html><label for="q">Message</label><input id="q"><button>Apply</button><p role="status">Ready<!-- boundary --> now</p><template><p>Inert phantom</p></template><p hidden>Hidden phantom</p><script>document.querySelector("button").onclick=()=>document.querySelector("[role=status]").textContent=document.querySelector("input").value</script>'
  await writeFile(join(root, "index.html"), html)
  const before = (await readdir(tmpdir())).filter(name => name.startsWith("browser-smoke-"))
  const events = []
  const emit = line => events.push(JSON.parse(line))
  await browserSmoke(root, [{ op: "open", path: "/" }, { op: "fill", role: "textbox", name: "Message", value: "Changed" }, { op: "click", role: "button", name: "Apply" }, { op: "expect-text", text: "Changed" }], emit)
  assert.match(events[0].text, /Ready now/)
  assert.doesNotMatch(events[0].text, /phantom/)
  assert.match(events[3].text, /Changed/)
  assert.equal(events.at(-1).completed, true)
  assert.deepEqual(events.at(-1), { completed: true, ok: true, exceptions: [], failedRequests: [], httpErrors: [] })
  assert.equal(await readFile(join(root, "index.html"), "utf8"), html, "browser checks do not rewrite or certify static artifacts")
  assert.match(html, /Inert phantom/)
  for (const command of [{ op: "expect-text", text: "Inert phantom" }, { op: "click", role: "button", name: "Missing" }, { op: "open", path: "http://example.com" }]) {
    await assert.rejects(browserSmoke(root, [{ op: "open", path: "/" }, command], emit))
    assert.equal(events.at(-1).ok, false)
  }
  await symlink(join(root, ".."), join(root, "outside"))
  await assert.rejects(browserSmoke(root, [{ op: "open", path: "/outside/" }], emit), /ERR_HTTP_RESPONSE_CODE_FAILURE/)
  let hits = 0
  const other = createServer((request, response) => { hits++; response.end("unexpected") })
  await new Promise(done => other.listen(0, "127.0.0.1", done))
  t.after(() => other.close())
  await writeFile(join(root, "network.html"), `<link rel="icon" href="data:,"><p>Network probe</p><script>fetch('http://127.0.0.1:${other.address().port}/').catch(()=>document.querySelector('p').textContent='Blocked')</script>`)
  await assert.rejects(browserSmoke(root, [{ op: "open", path: "/network.html" }, { op: "expect-text", text: "Blocked" }], emit), /Browser errors/)
  assert.equal(hits, 0, "browser cannot use the smoke server as a proxy to another loopback service")
  await writeFile(join(root, "long.html"), '<link rel="icon" href="data:,"><p>' + "x".repeat(5000) + "</p>")
  await browserSmoke(root, [{ op: "open", path: "/long.html" }], emit)
  assert.equal(events.at(-2).text.length, 4000)
  assert.equal(events.at(-2).textTruncated, true)
  await assert.rejects(browserSmoke(root, [{ op: "open", path: "/" }], emit, 1), /timed out/)
  await writeFile(join(root, "stalled.html"), '<script>while(true){}</script>')
  const stalledAt = performance.now()
  await assert.rejects(browserSmoke(root, [{ op: "open", path: "/stalled.html" }], emit, 2000), /timed out/)
  assert.ok(performance.now() - stalledAt < 6000, "stalled renderer cannot prevent bounded cleanup")
  await assert.rejects(promisify(execFile)(process.execPath, ["test/browser-smoke.mjs", root, JSON.stringify([{ op: "open", path: "/" }, { op: "expect-text", text: "Inert phantom" }])], { timeout: 10_000 }), error => {
    assert.equal(error.code, 1)
    assert.match(error.stdout, /"ok":false/)
    assert.match(error.stderr, /rendered text was not found/)
    return true
  })
  assert.deepEqual((await readdir(tmpdir())).filter(name => name.startsWith("browser-smoke-")), before, "success and failure remove disposable profiles")
})

test("exact AX targeting reports bounded computed names and rejects ambiguity", { timeout: 60_000, skip: !chrome }, async t => {
  const root = await mkdtemp(join(tmpdir(), "smoke-target-"))
  t.after(() => rm(root, { recursive: true, force: true }))
  await writeFile(join(root, "index.html"), `<!doctype html><style>label {text-transform:uppercase}</style>
    <label for="q">Find records</label><input id="q" type="search">
    <input type="search" aria-label="Hidden control" hidden><div inert><input type="search" aria-label="Inert control"></div>
    <template><input type="search" aria-label="Template control"></template>
    <input type="search" aria-label="Alternate label"><input type="search" aria-label="${"x".repeat(161)}">
    <button>Apply</button><button>Apply</button><button>Other action</button>`)
  const run = command => promisify(execFile)(process.execPath, ["test/browser-smoke.mjs", root, JSON.stringify([{ op: "open", path: "/" }, command, { op: "snapshot" }])], { timeout: 10_000 })
  await assert.rejects(run({ op: "fill", role: "searchbox", name: "Find records", value: "test" }), error => {
    assert.equal(error.code, 1)
    const events = error.stdout.trim().split("\n").map(JSON.parse)
    assert.equal(events.length, 2, "a failed exact target stops before input and subsequent commands")
    assert.ok(events[0].accessibility.some(node => node.role === "searchbox" && node.name === "FIND RECORDS"))
    assert.equal(events[1].ok, false)
    assert.equal(events[1].error, 'Expected one accessible target; found 0. Exact role/name required. AX candidates (3 total, at most 5 shown): ' + JSON.stringify([
      { role: "searchbox", name: "FIND RECORDS", nameTruncated: false },
      { role: "searchbox", name: "Alternate label", nameTruncated: false },
      { role: "searchbox", name: "x".repeat(160), nameTruncated: true },
    ]))
    assert.equal(JSON.parse(error.stderr.trim()).error, events[1].error)
    return true
  })
  const { stdout } = await run({ op: "fill", role: "searchbox", name: "FIND RECORDS", value: "test" })
  assert.equal(JSON.parse(stdout.trim().split("\n").at(-1)).ok, true)
  await assert.rejects(run({ op: "click", role: "button", name: "Apply" }), error => {
    assert.equal(error.code, 1)
    const events = error.stdout.trim().split("\n").map(JSON.parse)
    assert.equal(events.length, 2)
    assert.equal(events[1].error, 'Expected one accessible target; found 2. Exact role/name required. AX candidates (2 total, at most 5 shown): ' + JSON.stringify(Array(2).fill({ role: "button", name: "Apply", nameTruncated: false })))
    return true
  })
  await writeFile(join(root, "index.html"), Array.from({ length: 8 }, (_, i) => `<button>Choice ${i}</button>`).join(""))
  await assert.rejects(run({ op: "click", role: "button", name: "Absent" }), error => {
    assert.equal(error.code, 1)
    const event = JSON.parse(error.stdout.trim().split("\n").at(-1))
    assert.equal(event.error, 'Expected one accessible target; found 0. Exact role/name required. AX candidates (8 total, at most 5 shown): ' + JSON.stringify(Array.from({ length: 5 }, (_, i) => ({ role: "button", name: `Choice ${i}`, nameTruncated: false }))))
    return true
  })
})

test("CLI tolerates only an absent automatic favicon, not authored resources or browser errors", { timeout: 60_000, skip: !chrome }, async t => {
  const root = await mkdtemp(join(tmpdir(), "smoke-favicon-"))
  t.after(() => rm(root, { recursive: true, force: true }))
  const run = (path = "/") => promisify(execFile)(process.execPath, ["test/browser-smoke.mjs", root, JSON.stringify([{ op: "open", path }, { op: "snapshot" }])], { timeout: 10_000 })
  await writeFile(join(root, "index.html"), "<!doctype html><p>No favicon</p>")
  const { stdout } = await run()
  assert.deepEqual(JSON.parse(stdout.trim().split("\n").at(-1)), { completed: true, ok: true, exceptions: [], failedRequests: [], httpErrors: [] })
  for (const [markup, path] of [
    ['<script src="/missing.js"></script>', "/missing.js"],
    ['<link rel="stylesheet" href="/missing.css">', "/missing.css"],
    ['<link rel="icon" href="/missing.ico">', "/missing.ico"],
    ['<link rel="icon" href="/favicon.ico">', "/favicon.ico"],
    ['<img src="/favicon.ico">', "/favicon.ico"],
    ['<img srcset="/favicon.ico 1x">', "/favicon.ico"],
    ['<style>body { background-image: url(/favicon.ico) }</style>', "/favicon.ico"],
    ['<script src="/favicon.ico"></script>', "/favicon.ico"],
    ['<script>throw new Error("smoke exception")</script>', null],
  ]) {
    await writeFile(join(root, "index.html"), `<!doctype html>${markup}<p>Authored resource</p>`)
    await assert.rejects(run(), error => {
      assert.equal(error.code, 1)
      const result = JSON.parse(error.stdout.trim().split("\n").at(-1))
      assert.equal(result.ok, false)
      if (path) assert.ok(result.httpErrors.some(entry => entry.path === path && entry.status === 404))
      else assert.ok(result.exceptions.length)
      return true
    }, markup)
  }
  await assert.rejects(run("/favicon.ico"), error => error.code === 1)
  await writeFile(join(root, "favicon.ico"), "real file")
  await writeFile(join(root, "index.html"), '<p>Waiting</p><script>fetch("/favicon.ico").then(async response => document.querySelector("p").textContent = response.status + ":" + await response.text())</script>')
  assert.match((await run()).stdout, /200:real file/)
  await rm(join(root, "favicon.ico"))
  await symlink(join(root, "missing.ico"), join(root, "favicon.ico"))
  await writeFile(join(root, "index.html"), "<!doctype html><p>Broken favicon symlink</p>")
  await assert.rejects(run(), error => {
    assert.equal(error.code, 1)
    assert.match(error.stdout, /"path":"\/favicon.ico","status":404/)
    return true
  })
})
