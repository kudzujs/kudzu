import assert from "node:assert/strict"
import { spawn, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync } from "node:fs"
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises"
import { createServer } from "node:http"
import { join } from "node:path"
import test from "node:test"
import { gzipSync } from "node:zlib"

const fixture = new URL("./fixtures/imported-article-search/", import.meta.url)
const cli = new URL("../bin/kudzu.mjs", import.meta.url)

const runtimeDigests = []
const javascriptDigests = []
for (const shape of ["aliases", "direct count", "inline control"]) test(`compiles imported article search with ${shape}`, async t => {
  const root = await mkdtemp(new URL("./fixtures/.article-search-", import.meta.url).pathname)
  t.after(() => rm(root, { recursive: true, force: true }))
  await cp(new URL("src", fixture), join(root, "src"), { recursive: true })
  if (shape !== "aliases") {
    const source = await readFile(new URL("src/pages/index.tsx", fixture), "utf8")
    const predicate = "articles.filter(article => article.title.toLowerCase().includes(query.trim().toLowerCase()) || article.topic.toLowerCase().includes(query.trim().toLowerCase()))"
    let changed = source
      .replace(/  const normalizedQuery = .*\n  const filteredArticles = .*\n  const resultCount = filteredArticles.length/, `  const resultCount = ${predicate}.length`)
      .replace("filteredArticles.map", `${predicate}.map`)
    if (shape === "inline control") changed = changed.replace(/  const resultCount = .*\n/, "").replaceAll("resultCount", `${predicate}.length`)
    await writeFile(join(root, "src/pages/index.tsx"), changed)
  }
  const result = spawnSync(process.execPath, [cli.pathname, "build"], { cwd: root, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const html = await readFile(join(root, "dist/index.html"), "utf8")
  assert.match(html, /Alpha systems/)
  assert.match(html, /Beta notes/)
  assert.match(html, /Gamma guide/)
  assert.doesNotMatch(await readFile(join(root, "dist/static/index.html"), "utf8"), /<script|data-k-/)
  const plan = JSON.parse(await readFile(join(root, ".kudzu/kudzu-plan.json"), "utf8")).routes.find(route => route.route === "/")
  assert.equal(plan.lists.length, 1)
  assert.equal(plan.lists[0].static, true)
  assert.deepEqual(plan.lists[0].selectorStates, { query: "s0" })
  const files = (await readdir(join(root, "dist"), { recursive: true })).filter(file => file.endsWith(".js")).sort()
  const runtime = createHash("sha256")
  const javascript = createHash("sha256")
  let raw = 0, gzip = 0
  for (const file of files) {
    const bytes = await readFile(join(root, "dist", file))
    raw += bytes.length
    gzip += gzipSync(bytes).length
    javascript.update(file).update(bytes)
    if (file.startsWith("assets/runtime/")) runtime.update(file).update(bytes)
    assert.doesNotMatch(bytes.toString(), /from\s*["']react(?:["'/])|ReactDOM|hydrateRoot/)
  }
  runtimeDigests.push(runtime.digest("hex"))
  assert.equal(runtimeDigests.at(-1), runtimeDigests[0])
  javascriptDigests.push(javascript.digest("hex"))
  assert.equal(javascriptDigests.at(-1), javascriptDigests[0])
  t.diagnostic(`${shape}: ${files.length} JS files, ${raw} raw / ${gzip} aggregate gzip B; runtime ${runtimeDigests.at(-1)}`)

  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find(path => path && existsSync(path))
  if (!chrome) {
    assert.notEqual(process.env.KUDZU_REQUIRE_CHROME, "1", "Chrome is required")
    t.diagnostic("Chrome unavailable; browser coverage not run")
    return
  }
  const server = createServer(async (request, response) => {
    try {
      const path = new URL(request.url, "http://localhost").pathname
      response.setHeader("content-type", path.endsWith(".js") ? "text/javascript" : "text/html")
      response.end(path === "/" ? html.replace("</body>", `<script type="module">${browserCheck}</script></body>`) : await readFile(join(root, "dist", path)))
    } catch { response.writeHead(404).end() }
  })
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve))
  t.after(() => new Promise(resolve => server.close(resolve)))
  const browser = spawn(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", `--user-data-dir=${join(root, "chrome")}`, "--virtual-time-budget=5000", "--dump-dom", `http://127.0.0.1:${server.address().port}/`])
  let stdout = "", stderr = ""
  browser.stdout.on("data", data => { stdout += data })
  browser.stderr.on("data", data => { stderr += data })
  const timeout = setTimeout(() => browser.kill(), 20_000)
  const status = await new Promise(resolve => browser.on("close", resolve))
  clearTimeout(timeout)
  assert.equal(status, 0, stderr)
  assert.match(stdout, /data-search-test="pass"/, stdout)
})

const browserCheck = `
const waitFor = async predicate => {
  for (let i = 0; i < 100; i++) {
    if (predicate()) return;
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  throw new Error("timeout");
};
try {
  const errors = [];
  window.addEventListener("error", event => errors.push(event.message));
  window.addEventListener("unhandledrejection", event => errors.push(String(event.reason)));
  const input = document.querySelector("input");
  const rows = () => [...document.querySelectorAll("[data-article]")];
  const summary = () => document.querySelector("[aria-live]").textContent.trim();
  const search = async (value, count) => {
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await waitFor(() => rows().length === count && summary() === count + (count === 1 ? " article" : " articles"));
  };
  if (summary() !== "3 articles") throw new Error("initial-count");
  const alpha = rows()[0], beta = rows()[1], gamma = rows()[2];
  await search("  ENGINEERING  ", 2);
  if (rows()[0] !== alpha || rows()[1] !== gamma || beta.isConnected) throw new Error("topic-identity");
  await search(" ALPHA ", 1);
  if (rows()[0] !== alpha) throw new Error("title-identity");
  await search("no match", 0);
  await waitFor(() => document.querySelector("[data-empty]"));
  if (alpha.isConnected || gamma.isConnected) throw new Error("removed-rows");
  await search("", 3);
  await waitFor(() => !document.querySelector("[data-empty]"));
  if (rows()[0] === alpha || rows()[1] === beta || rows()[2] === gamma) throw new Error("fresh-rows");
  if (errors.length) throw new Error(errors.join(","));
  document.body.dataset.searchTest = "pass";
} catch (error) { document.body.dataset.searchTest = "fail-" + error.message; }
`

test("rejects unsafe imported article search aliases at authored source", async t => {
  const source = await readFile(new URL("src/pages/index.tsx", fixture), "utf8")
  const cases = [
    [source.replace("const normalizedQuery", "let normalizedQuery"), /identifier "normalizedQuery" is not allowed/],
    [source.replace("query.trim().toLowerCase()", "String(Date.now())"), /cannot call arbitrary functions/],
    [source.replace("query.trim().toLowerCase()", "otherQuery").replace("  const filteredArticles", "  const otherQuery = normalizedQuery\n  const filteredArticles"), /local cycle/],
    [source.replace("  return <main>", "  console.log(filteredArticles)\n  return <main>"), /may only be used as a rendered collection source/],
    [source.replace("article => article.title", "query => query.title").replace("article.topic.toLowerCase()", "query.topic.toLowerCase()"), /cannot capture state shadowed by predicate parameters/],
    [source.replace("articles.filter", "articles.sort"), /mutating sort/]
  ]
  for (const [invalid, diagnostic] of cases) {
    const root = await mkdtemp(new URL("./fixtures/.article-search-invalid-", import.meta.url).pathname)
    try {
      await cp(new URL("src", fixture), join(root, "src"), { recursive: true })
      await writeFile(join(root, "src/pages/index.tsx"), invalid)
      const result = spawnSync(process.execPath, [cli.pathname, "build"], { cwd: root, encoding: "utf8" })
      assert.notEqual(result.status, 0)
      assert.match(result.stderr, /src\/pages\/index\.tsx:\d+:\d+/)
      assert.match(result.stderr, diagnostic)
      assert.doesNotMatch(result.stderr, /TypeError|\.kudzu\/pages/)
    } finally { await rm(root, { recursive: true, force: true }) }
  }
})
