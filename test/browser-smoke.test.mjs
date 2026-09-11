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
  await browserSmoke(root, [{ op: "open", path: "/" }, { op: "fill", role: "textbox", name: "Message", value: "Changed" }, { op: "click", role: "button", name: "Apply" }, { op: "expect-text", text: "Changed" }, { op: "snapshot" }], emit)
  assert.match(events[0].text, /Ready now/)
  assert.doesNotMatch(events[0].text, /phantom/)
  assert.match(events[2].text, /Changed/)
  assert.equal(events[3].observationFrom, 2, "unchanged assertion output references the last complete observation")
  assert.equal(events[3].text, undefined)
  assert.equal(events[3].accessibility, undefined)
  assert.match(events[4].text, /Changed/, "explicit snapshots always return the complete bounded observation")
  assert.deepEqual(events[4].accessibility, events[2].accessibility)
  assert.ok(JSON.stringify(events[3]).length < JSON.stringify(events[2]).length)
  assert.equal(events.at(-1).completed, true)
  assert.deepEqual(events.at(-1), { completed: true, ok: true, exceptions: [], failedRequests: [], httpErrors: [] })
  assert.equal(await readFile(join(root, "index.html"), "utf8"), html, "browser checks do not rewrite or certify static artifacts")
  assert.match(html, /Inert phantom/)
  await writeFile(join(root, "ax.html"), '<button aria-label="Before" onclick="this.setAttribute(\'aria-label\',this.getAttribute(\'aria-label\')===\'Before\'?\'After\':\'Before\')">Toggle</button>')
  const ax = []
  await browserSmoke(root, [{ op: "open", path: "/ax.html" }, { op: "click", role: "button", name: "Before" }, { op: "expect-text", text: "Toggle" }, { op: "expect-text", text: "Toggle" }], line => ax.push(JSON.parse(line)))
  assert.equal(ax[1].text, ax[0].text)
  assert.ok(ax[1].accessibility.some(node => node.role === "button" && node.name === "After"), "AX-only changes emit a new observation")
  assert.equal(ax[2].observationFrom, 1)
  assert.equal(ax[3].observationFrom, 1, "references never chain through compact records")
  const restored = []
  await assert.rejects(browserSmoke(root, [{ op: "open", path: "/ax.html" }, { op: "click", role: "button", name: "Before" }, { op: "click", role: "button", name: "After" }, { op: "expect-text", text: "Toggle" }, { op: "snapshot" }, { op: "expect-text", text: "Toggle" }, { op: "expect-text", text: "Absent" }], line => restored.push(JSON.parse(line))), /rendered text was not found/)
  assert.equal(restored[2].observationFrom, 0, "returning to an earlier exact observation reuses its full record")
  assert.equal(restored[3].observationFrom, 0, "subsequent references still point directly to the full record")
  assert.deepEqual(restored[4].accessibility, restored[0].accessibility, "explicit snapshot recovers full output after non-adjacent reuse")
  assert.equal(restored[4].text, restored[0].text)
  assert.equal(restored[5].observationFrom, 4)
  assert.equal(restored[6].ok, false, "reuse does not bypass a failing assertion")
  const repeated = []
  await assert.rejects(browserSmoke(root, [{ op: "open", path: "/ax.html" }, { op: "expect-text", text: "Toggle" }, { op: "open", path: "/ax.html" }, { op: "expect-text", text: "Toggle" }, { op: "expect-text", text: "Absent" }], line => repeated.push(JSON.parse(line))), /rendered text was not found/)
  assert.equal(repeated[1].observationFrom, 0)
  assert.equal(repeated[2].text, "Toggle", "open always returns a complete observation, even on the same page")
  assert.equal(repeated[3].observationFrom, 2)
  assert.equal(repeated[4].ok, false, "compact output never bypasses a subsequent assertion")
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

test("observations keep actionable AX names instead of repeating visible text", { timeout: 30_000, skip: !chrome }, async t => {
  const root = await mkdtemp(join(tmpdir(), "smoke-observation-"))
  t.after(() => rm(root, { recursive: true, force: true }))
  await writeFile(join(root, "index.html"), '<h1>Records</h1>' + Array.from({ length: 70 }, (_, i) => `<p>Record ${i} visible description</p>`).join("") + '<input aria-label="Query"><button onclick="document.querySelector(\'h1\').textContent=\'Updated\'">Apply</button>')
  const events = []
  await browserSmoke(root, [{ op: "open", path: "/" }, { op: "fill", role: "textbox", name: "Query", value: "test" }, { op: "click", role: "button", name: "Apply" }, { op: "expect-text", text: "Updated" }], line => events.push(JSON.parse(line)))
  const first = events[0]
  assert.match(first.text, /Record 0 visible description/)
  assert.match(first.text, /Record 69 visible description/)
  assert.ok(first.accessibility.some(node => node.role === "heading" && node.name === "Records"))
  assert.ok(first.accessibility.some(node => node.role === "textbox" && node.name === "Query"))
  assert.ok(first.accessibility.some(node => node.role === "button" && node.name === "Apply"))
  assert.ok(!first.accessibility.some(node => ["StaticText", "InlineTextBox"].includes(node.role) && first.text.includes(node.name)))
  assert.ok(first.duplicateTextEntriesOmitted >= 70)
  assert.equal(first.accessibilityTruncated, false)
  assert.equal(events.at(-1).ok, true)
  await writeFile(join(root, "index.html"), '<p>' + 'x'.repeat(4100) + '</p><p>Beyond the text bound</p><button aria-label="AX name outside visible text">Visible button</button>')
  const bounded = []
  await browserSmoke(root, [{ op: "open", path: "/" }], line => bounded.push(JSON.parse(line)))
  assert.equal(bounded[0].textTruncated, true)
  assert.ok(bounded[0].accessibility.some(node => node.role === "StaticText" && node.name === "Beyond the text bound"))
  assert.ok(bounded[0].accessibility.some(node => node.role === "button" && node.name === "AX name outside visible text"))
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

test("explicit role-only actions are unique, actionable and never relax supplied names", { timeout: 60_000, skip: !chrome }, async t => {
  const root = await mkdtemp(join(tmpdir(), "smoke-role-"))
  t.after(() => rm(root, { recursive: true, force: true }))
  const html = `<style>label{text-transform:uppercase}</style><label for="q">Search articles</label><input id="q" type="search">
    <input type="search" hidden><input type="search" style="display:none"><div inert><input type="search"></div><template><input type="search"></template>
    <button onclick="document.querySelector('p').textContent=document.querySelector('#q').value">Apply</button><p>Ready</p>`
  const run = async (commands, markup = html) => {
    await writeFile(join(root, "index.html"), markup)
    const events = []
    await browserSmoke(root, [{ op: "open", path: "/" }, ...commands], line => events.push(JSON.parse(line)))
    return events
  }
  const fill = { op: "fill", role: "searchbox", value: "Changed" }
  const events = await run([fill, { op: "click", role: "button" }, { op: "expect-text", text: "Changed" }])
  assert.ok(events[0].accessibility.some(n => n.role === "searchbox" && n.name === "SEARCH ARTICLES"))
  assert.equal(await readFile(join(root, "index.html"), "utf8"), html)
  await run([{ ...fill, name: "SEARCH ARTICLES" }])
  for (const name of ["Search articles", "search articles", ""]) await assert.rejects(run([{ ...fill, name }]), /found 0.*Exact role\/name required/)
  for (const name of [null, 1, false]) await assert.rejects(run([{ ...fill, name }]), /optional string/)
  await assert.rejects(run([{ op: "fill", value: "Changed" }]), /requires exact role/)
  await assert.rejects(run([{ ...fill, value: 1 }]), /string value/)
  await assert.rejects(run([{ op: "click", role: "heading" }], '<h1 tabindex="0">Title</h1>'), /Unsupported click role/)
  await assert.rejects(run([fill], html + '<input type="search" aria-label="Other" disabled>'), /found 2.*Role-only query must be unique.*SEARCH ARTICLES.*Other/)
  await assert.rejects(run([fill], '<input type="search" disabled>'), /disabled/)
  await assert.rejects(run([fill], '<input type="search" aria-disabled="true">'), /disabled/)
  await assert.rejects(run([fill], '<input type="search" readonly>'), /does not support/)
  await assert.rejects(run([fill], '<input type="number" role="searchbox">'), /does not support/)
  await assert.rejects(run([fill], '<div role="searchbox" tabindex="0">Not an input</div>'), /does not support/)
  await assert.rejects(run([fill], '<input type="search" hidden><div inert><input type="search"></div>'), /found 0/)
  await assert.rejects(run([{ op: "click", role: "button" }], '<button>Apply</button><div style="position:fixed;inset:0">Cover</div>'), /obscured/)
  await run([{ op: "fill", role: "textbox", name: "", value: "Text" }], '<textarea></textarea>')
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
