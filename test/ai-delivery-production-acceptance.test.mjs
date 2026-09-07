import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import test from "node:test"
import { articleSummary, memoFilterSelected, staticOutputChecks, CDP, evaluate, waitForPort } from "./ai-delivery-production-acceptance.mjs"

test("production acceptance checks semantic DOM rather than framework-specific markup", async t => {
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  assert.ok(chrome, "Chrome is required for acceptance regressions")
  const profile = await mkdtemp(join(tmpdir(), "kudzu-acceptance-regression-"))
  const browser = spawn(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", `--user-data-dir=${profile}`, "--remote-debugging-port=0"], { stdio: "ignore" })
  t.after(async () => { browser.kill("SIGKILL"); await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }) })
  const active = await waitForPort(profile, browser)
  const cdp = new CDP(`ws://127.0.0.1:${active.port}${active.path}`)
  t.after(() => cdp.socket.close())
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" })
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true })
  cdp.sessionId = sessionId
  const check = async (html, expression) => {
    await evaluate(cdp, `document.body.innerHTML = ${JSON.stringify(html)}`)
    return evaluate(cdp, expression)
  }

  // Kudzu comments and React text boundaries do not change the communicated contract.
  for (const boundary of ["<!--kudzu-binding-->", "<!-- -->"]) {
    for (const [count, text] of [[6, "6 articles"], [1, "1 article"], [3, "3 articles"], [0, "0 articles"], [6, "6 articles"]]) {
      const summary = `<p>${count}${boundary} ${count === 1 ? "article" : "articles"}</p>`
      const empty = count === 0 ? "<p>No articles match your search.</p>" : ""
      for (const html of [`<div aria-live="polite">${summary}${empty}</div>`, `<div aria-live="polite">${summary}</div>${empty}`]) {
        assert.equal(await check(html, `(${articleSummary})()`), text)
      }
    }
  }
  for (const html of [
    '<p>0 articles</p>',
    '<p aria-live="assertive">0 articles</p>',
    '<p aria-live="polite" hidden>0 articles</p>',
    '<p aria-live="polite" style="visibility:hidden">0 articles</p>',
    '<p aria-live="polite" aria-hidden="true">0 articles</p>',
    '<p aria-live="polite">0 article</p>',
    '<p aria-live="polite">1 articles</p>',
    '<p aria-live="polite">No articles match your search.</p>',
    '<p aria-live="polite">0 articles 6 articles</p>',
    '<p aria-live="polite">0 articles</p><p aria-live="polite">6 articles</p>',
  ]) assert.equal(await check(html, `(${articleSummary})()`), null, html)
  assert.notEqual(await check('<p aria-live="polite">6 articles</p>', `(${articleSummary})()`), "0 articles", "stale count is not an empty result")

  const buttons = selected => ["All", "Active", "Archived"].map(label => `<button aria-pressed="${label === selected}">${label}</button>`).join("")
  for (const selected of ["All", "Active", "Archived"]) {
    for (const wrapper of [
      '<div role="group" aria-label="Filter memos">BUTTONS</div>',
      '<div role="group" aria-label="Filter memos by status">BUTTONS</div>',
      '<span id="name">Memo status</span><div role="group" aria-labelledby="name">BUTTONS</div>',
      '<fieldset><legend>Memo status</legend>BUTTONS</fieldset>',
    ]) assert.equal(await check(wrapper.replace("BUTTONS", buttons(selected)), `(${memoFilterSelected})(${JSON.stringify(selected)})`), true)
  }
  for (const html of [
    `<div role="group">${buttons("All")}</div>`,
    `<div aria-label="Filter memos">${buttons("All")}</div>`,
    `<div role="group" aria-label="Filter memos"></div>${buttons("All")}`,
    `<div role="group" aria-labelledby="missing">${buttons("All")}</div>`,
    `<div role="group" aria-label="Filter memos" hidden>${buttons("All")}</div>`,
    `<fieldset disabled><legend>Memo status</legend>${buttons("All")}</fieldset>`,
    `<fieldset role="presentation"><legend>Memo status</legend>${buttons("All")}</fieldset>`,
    `<div role="group" aria-label="Filter memos">${buttons("Active")}</div>`,
    `<div role="group" aria-label="Filter memos">${buttons("All").replaceAll('"false"', '"true"')}</div>`,
    `<div role="group" aria-label="Filter memos">${buttons("All").replaceAll(' aria-pressed="false"', '')}</div>`,
    `<div role="group" aria-label="Filter memos">${buttons("All").replace("<button", "<button disabled")}</div>`,
  ]) assert.equal(await check(html, `(${memoFilterSelected})("All")`), false, html)
})

test("content static exclusion covers every Kudzu sibling and does not claim React is zero-JS", async t => {
  const root = await mkdtemp(join(tmpdir(), "kudzu-acceptance-output-"))
  t.after(() => rm(root, { recursive: true, force: true }))
  const missing = await staticOutputChecks("content", true, root)
  assert.equal(missing.passed, false)
  assert.equal(missing.artifacts.length, 10)
  for (const { artifact } of missing.artifacts) {
    await mkdir(dirname(join(root, artifact)), { recursive: true })
    await writeFile(join(root, artifact), "<!doctype html><h1>Static content</h1>")
  }
  assert.equal((await staticOutputChecks("content", true, root)).passed, true)
  const topic = join(root, "topics/performance/index.html")
  for (const output of ['<script type="module" src="/assets/kudzu-list.js"></script>', '<link rel="modulepreload" href="/assets/list.js">', '<body data-k-state="[]">', '<link rel="preload" href="/assets/list.js?x=1">']) {
    await writeFile(topic, `<!doctype html><h1>Performance</h1>${output}`)
    const result = await staticOutputChecks("content", true, root)
    assert.equal(result.passed, false, output)
    assert.deepEqual(result.artifacts.filter(item => !item.staticZeroJavaScript).map(item => item.artifact), ["topics/performance/index.html"])
  }
  await writeFile(join(root, "index.html"), '<h1>React shell</h1><script type="module" src="/assets/main.js"></script>')
  const react = await staticOutputChecks("content", false, root)
  assert.equal(react.passed, true)
  assert.equal(react.staticZeroJavaScript, null)
})
