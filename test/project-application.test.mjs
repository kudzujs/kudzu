import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { existsSync } from "node:fs"
import { readFile, readdir, rm, writeFile } from "node:fs/promises"
import { spawn, spawnSync } from "node:child_process"
import { createServer } from "node:http"
import { createConnection } from "node:net"
import test from "node:test"
import { gzipSync } from "node:zlib"

const fixture = new URL("./fixtures/project-application/", import.meta.url)
const cli = new URL("../bin/kudzu.mjs", import.meta.url)
const chromePaths = [process.env.CHROME_BIN, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].filter(Boolean)

test("establishes the 0.12.0 runtime route contract", { timeout: 120_000 }, async t => {
  t.after(async () => {
    await rm(new URL(".kudzu", fixture), { recursive: true, force: true })
    await rm(new URL("dist", fixture), { recursive: true, force: true })
  })

  const result = spawnSync(process.execPath, [cli.pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)

  const contract = JSON.parse(await readFile(new URL("capabilities.json", fixture), "utf8"))
  const plan = JSON.parse(await readFile(new URL(".kudzu/kudzu-plan.json", fixture), "utf8"))
  const artifacts = JSON.parse(await readFile(new URL(".kudzu/kudzu-artifacts.json", fixture), "utf8"))
  const routes = plan.routes.map(route => route.route).sort()
  assert.equal(routes.includes("/app/projects/alpha"), true)
  assert.equal(routes.includes("/app/projects/[projectId]"), true)
  assert.equal(routes.includes("/app/projects/[projectId]/issues/[issueId]"), true)
  assert.deepEqual(routes, contract.routes)
  assert.equal(contract.milestone, "0.12.0")
  assert.deepEqual(contract.architectureDecision, {
    patch: "0.11.2",
    status: "closed-no-new-primitive",
    primitive: null,
    fixtures: ["project-application", "tanstack-query-migration", "apache-answer-browser-questions"],
    repeatedMissingContracts: [],
    reusedSemantics: ["ordinary-state", "owned-effect", "dependency-invalidation", "owner-release", "static-exclusion"]
  })

  const projects = plan.routes.find(route => route.route === "/app/projects")
  const detail = plan.routes.find(route => route.route === "/app/projects/alpha")
  const runtimeProject = plan.routes.find(route => route.route === "/app/projects/[projectId]")
  const runtimeIssue = plan.routes.find(route => route.route === "/app/projects/[projectId]/issues/[issueId]")
  const projectArtifacts = artifacts.routes.find(route => route.route === "/app/projects")
  const detailArtifacts = artifacts.routes.find(route => route.route === "/app/projects/alpha")
  const runtimeProjectArtifacts = artifacts.routes.find(route => route.route === "/app/projects/[projectId]")
  const runtimeIssueArtifacts = artifacts.routes.find(route => route.route === "/app/projects/[projectId]/issues/[issueId]")
  assert.deepEqual(projects.states.filter(state => !state.internal && !state.name.startsWith("__kRowState")).map(state => state.name), ["workspace", "storageReady", "projectName", "projectRevision", "mutationStatus", "mutationError", "summary", "projects", "filter", "showSummary", "savedFilters", "request", "status", "error", "polling"])
  assert.deepEqual(projects.states.slice(0, 15).map(state => state.lifetime), ["layout", "layout", "layout", "layout", "layout", "layout", "route", "route", "route", "route", "route", "route", "route", "route", "route"])
  assert.deepEqual(detail.states.map(state => [state.name, state.lifetime, state.initialValue]), [["workspace", "layout", "Primary"], ["storageReady", "layout", false], ["projectName", "layout", "Alpha"], ["projectRevision", "layout", -1], ["mutationStatus", "layout", "idle"], ["mutationError", "layout", ""], ["draft", "route", "Clean draft"]])
  assert.equal(projects.effects.length, 5)
  assert.equal(detail.effects.length, 3)
  assert.equal(projects.bindings.length, 11)
  assert.equal(projects.lists.length, 3)
  assert.equal(projects.lists.some(list => list.ownerField === "issues"), true)
  assert.equal(projects.lists.some(list => Object.values(list.selectorStates ?? {}).includes(projects.states.find(state => state.name === "filter").id) && list.rowStates?.length === 1), true)
  assert.equal(projects.conditions.some(condition => condition.state === projects.states.find(state => state.name === "showSummary").id), true)
  assert.deepEqual(projectArtifacts.capability.manifest.events.command, ["click"])
  assert.deepEqual(projectArtifacts.capability.manifest.events.native, ["click"])
  assert.equal(projectArtifacts.capability.manifest.bindings.text, true)
  assert.equal(projectArtifacts.capability.manifest.lists.nested, true)
  assert.equal(projectArtifacts.capability.manifest.lists.rowHooks, true)
  assert.equal(projectArtifacts.capability.manifest.lists.selectors, true)
  assert.equal(projectArtifacts.handlers.entries.length, 2)
  assert.equal(projectArtifacts.runtime.entries.some(path => path.endsWith("/kudzu-navigation.js")), true)
  assert.equal(projectArtifacts.runtime.requirements.some(path => path.endsWith("/kudzu-list.js")), true)
  assert.equal(projectArtifacts.runtime.family, detailArtifacts.runtime.family)
  assert.equal(detailArtifacts.runtime.entries.some(path => path.endsWith("/kudzu-navigation.js")), true)
  assert.deepEqual(detailArtifacts.handlers, { entries: ["/assets/handlers/AppLayout.js"], chunks: [] })
  assert.deepEqual(runtimeProject.params, [{ name: "projectId", id: "rp0" }])
  assert.deepEqual(runtimeIssue.params, [{ name: "projectId", id: "rp0" }, { name: "issueId", id: "rp1" }])
  assert.equal(runtimeProjectArtifacts.runtime.entries.some(path => path.endsWith("/params/app/projects/[projectId]/index.js")), true)
  assert.equal(runtimeIssueArtifacts.runtime.entries.some(path => path.endsWith("/params/app/projects/[projectId]/issues/[issueId]/index.js")), true)
  assert.equal([...runtimeProjectArtifacts.runtime.entries, ...runtimeIssueArtifacts.runtime.entries].some(path => path.endsWith("/kudzu-navigation.js")), false)
  assert.equal(runtimeProjectArtifacts.runtime.family, runtimeIssueArtifacts.runtime.family)
  assert.deepEqual(JSON.parse(await readFile(new URL("dist/rewrites.json", fixture), "utf8")).map(rewrite => [rewrite.pattern, rewrite.file]), [
    ["/app/projects/[projectId]/issues/[issueId]", "app/projects/[projectId]/issues/[issueId]/index.html"],
    ["/app/projects/[projectId]", "app/projects/[projectId]/index.html"]
  ])

  const runtimeProjectHtml = await readFile(new URL("dist/app/projects/[projectId]/index.html", fixture), "utf8")
  const runtimeIssueHtml = await readFile(new URL("dist/app/projects/[projectId]/issues/[issueId]/index.html", fixture), "utf8")
  assert.match(runtimeProjectHtml, /data-runtime-project.*data-project-id.*<h1>Project .*data-k-text="rp0".*This project route is directly addressable.*data-first-issue/s)
  assert.match(runtimeIssueHtml, /data-runtime-issue.*data-project-id.*data-issue-id.*<h1>Issue .*data-k-text="rp1".*Project .*data-k-text="rp0"/s)
  const paramModule = new URL("dist/assets/params/app/projects/[projectId]/index.js", fixture).href
  const invalidParam = spawnSync(process.execPath, ["--input-type=module", "-e", `globalThis.location={pathname:"/app/projects/%2F"};globalThis.document={body:{dataset:{}},querySelectorAll:()=>[]};await import(${JSON.stringify(paramModule)})`], { encoding: "utf8" })
  assert.notEqual(invalidParam.status, 0)

  const helpHtml = await readFile(new URL("dist/help/index.html", fixture), "utf8")
  const helpArtifacts = artifacts.routes.find(route => route.route === "/help")
  assert.match(helpHtml, /<h1>Project help<\/h1>/)
  assert.doesNotMatch(helpHtml, /<script|data-k-/)
  assert.deepEqual(helpArtifacts.runtime, { family: null, entries: [], requirements: [] })
  assert.deepEqual(helpArtifacts.handlers, { entries: [], chunks: [] })
  const output = await outputBaseline(artifacts)
  const stableOutput = structuredClone(output)
  const stableBaseline = structuredClone(contract.baseline)
  delete stableOutput.deploy.aggregateGzipBytes
  delete stableBaseline.deploy.aggregateGzipBytes
  delete stableOutput.routes["/app/projects"].javascriptAggregateGzipBytes
  delete stableBaseline.routes["/app/projects"].javascriptAggregateGzipBytes
  delete stableOutput.routes["/app/projects/alpha"].javascriptAggregateGzipBytes
  delete stableBaseline.routes["/app/projects/alpha"].javascriptAggregateGzipBytes
  delete stableOutput.routes["/app/projects/[projectId]"].javascriptAggregateGzipBytes
  delete stableBaseline.routes["/app/projects/[projectId]"].javascriptAggregateGzipBytes
  delete stableOutput.routes["/app/projects/[projectId]/issues/[issueId]"].javascriptAggregateGzipBytes
  delete stableBaseline.routes["/app/projects/[projectId]/issues/[issueId]"].javascriptAggregateGzipBytes
  assert.deepEqual(stableOutput, stableBaseline)
  // gzip output varies slightly across zlib versions; raw bytes and hashes stay exact.
  assert.ok(Math.abs(output.deploy.aggregateGzipBytes - contract.baseline.deploy.aggregateGzipBytes) <= 32)
  assert.ok(Math.abs(output.routes["/app/projects"].javascriptAggregateGzipBytes - contract.baseline.routes["/app/projects"].javascriptAggregateGzipBytes) <= 24)
  assert.ok(Math.abs(output.routes["/app/projects/alpha"].javascriptAggregateGzipBytes - contract.baseline.routes["/app/projects/alpha"].javascriptAggregateGzipBytes) <= 24)
  assert.ok(Math.abs(output.routes["/app/projects/[projectId]"].javascriptAggregateGzipBytes - contract.baseline.routes["/app/projects/[projectId]"].javascriptAggregateGzipBytes) <= 24)
  assert.ok(Math.abs(output.routes["/app/projects/[projectId]/issues/[issueId]"].javascriptAggregateGzipBytes - contract.baseline.routes["/app/projects/[projectId]/issues/[issueId]"].javascriptAggregateGzipBytes) <= 24)

  const chrome = process.env.KUDZU_SKIP_BROWSER ? undefined : chromePaths.find(existsSync)
  if (process.env.KUDZU_REQUIRE_CHROME && !chrome) throw new Error("Chrome is required for the project application test; set CHROME_BIN to an executable Chrome or Chromium binary")
  if (chrome) await runBrowserJourney(chrome)
})

async function runBrowserJourney(chrome) {
  const output = new URL("dist/", fixture)
  for (const path of ["app/projects/index.html", "app/projects/alpha/index.html", "app/projects/[projectId]/index.html", "app/projects/[projectId]/issues/[issueId]/index.html"]) {
    const htmlUrl = new URL(path, output)
    const html = await readFile(htmlUrl, "utf8")
    await writeFile(htmlUrl, html.replace("</head>", `<script>
const storageMode = new URLSearchParams(location.search).get("storage")
if (storageMode === "valid") localStorage.setItem("kudzu-project-workspace", JSON.stringify({ version: 1, workspace: "Secondary" }))
else if (storageMode === "malformed") localStorage.setItem("kudzu-project-workspace", "{")
else if (storageMode === "invalid-schema") localStorage.setItem("kudzu-project-workspace", JSON.stringify({ version: 1, workspace: "Unknown" }))
else if (storageMode === "wrong-version") localStorage.setItem("kudzu-project-workspace", JSON.stringify({ version: 2, workspace: "Secondary" }))
else if (storageMode === "empty") localStorage.removeItem("kudzu-project-workspace")
</script></head>`).replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  }
  await writeFile(new URL("browser-test.js", output), `
const waitFor = async (predicate, label) => {
  for (let attempt = 0; attempt < 200; attempt++) {
    if (predicate()) return
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  throw new Error(label)
}
const browserErrors = []
addEventListener("error", event => browserErrors.push(event.error?.message ?? event.message))
addEventListener("unhandledrejection", event => browserErrors.push(event.reason?.message ?? String(event.reason)))
const originalConsoleError = console.error
console.error = (...values) => {
  browserErrors.push(values.map(String).join(" "))
  originalConsoleError(...values)
}
const projectCounts = async () => {
  const response = await fetch("/api/project-counts")
  return response.json()
}
const waitForListRequests = async expected => {
  for (let attempt = 0; attempt < 200; attempt++) {
    const counts = await projectCounts()
    if (counts.listRequests === expected) return counts
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  throw new Error("list-request-count-" + expected)
}
try {
  const search = new URLSearchParams(location.search)
  const storageMode = search.get("storage")
  const runtimeRoute = sessionStorage.getItem("kudzu-runtime-route")
  if (runtimeRoute === "reload") {
    sessionStorage.removeItem("kudzu-runtime-route")
    await waitFor(() => document.querySelector("[data-runtime-issue]")?.dataset.projectId === "gamma" && document.querySelector("[data-runtime-issue]")?.dataset.issueId === "second", "runtime-issue-reload")
    if (performance.getEntriesByType("navigation")[0]?.type !== "reload") throw new Error("runtime-issue-reload-type")
    document.body.dataset.runtimeReloadTest = "pass"
  } else if (search.has("runtime-project")) {
    await waitFor(() => document.querySelector("[data-runtime-project]")?.dataset.projectId === "beta" && document.querySelector("[data-first-issue]")?.getAttribute("href") === "/app/projects/beta/issues/first", "runtime-project-entry")
    document.body.dataset.runtimeProjectTest = "pass"
  } else if (search.has("reload-issue")) {
    await waitFor(() => document.querySelector("[data-runtime-issue]")?.dataset.projectId === "gamma" && document.querySelector("[data-runtime-issue]")?.dataset.issueId === "second", "runtime-issue-before-reload")
    sessionStorage.setItem("kudzu-runtime-route", "reload")
    location.reload()
  } else if (search.has("direct-issue")) {
    await waitFor(() => document.querySelector("[data-runtime-issue]")?.dataset.projectId === "gamma" && document.querySelector("[data-runtime-issue]")?.dataset.issueId === "second", "runtime-issue-direct")
    document.body.dataset.directIssueTest = "pass"
  } else if (storageMode) {
    const expected = storageMode === "valid" ? "Secondary" : "Primary"
    await waitFor(() => document.querySelector("[data-workspace]")?.textContent === expected && document.querySelector("[data-route-workspace]")?.textContent === expected, "storage-restore")
    await waitFor(() => localStorage.getItem("kudzu-project-workspace") === JSON.stringify({ version: 1, workspace: expected }), "storage-fallback-write")
    document.body.dataset.storageTest = storageMode
  } else if (sessionStorage.getItem("kudzu-project-refresh") === "pending") {
    sessionStorage.removeItem("kudzu-project-refresh")
    await waitFor(() => document.querySelector("[data-shared-project-name]")?.textContent === "Alpha renamed" && document.querySelector("[data-shared-project-revision]")?.textContent === "1", "refresh-server-restore")
    const counts = await projectCounts()
    if (counts.reads !== 2 || counts.mutations !== 1 || counts.attempts !== 2 || performance.getEntriesByType("navigation")[0]?.type !== "reload" || document.querySelector("[data-project-draft]").textContent !== "Clean draft") throw new Error("refresh-contract")
    document.querySelector("[data-logout]").click()
    await waitFor(() => document.querySelector("[data-workspace]").textContent === "Primary" && localStorage.getItem("kudzu-project-workspace") === null, "logout-clear")
    document.body.dataset.browserTest = "pass"
  } else if (search.has("direct")) {
    await waitFor(() => document.querySelector("[data-project-detail]"), "direct-detail")
    if (document.querySelector("[data-workspace]").textContent !== "Primary" || document.querySelector("[data-route-workspace]").textContent !== "Primary" || document.querySelector("[data-project-draft]").textContent !== "Clean draft") throw new Error("direct-load-reset")
    document.body.dataset.directLoadTest = "pass"
  } else {
  if (!document.querySelector('[role="status"]') || document.querySelector('[data-project="alpha"] [data-project-name]')?.textContent !== "Alpha") throw new Error("initial-loading")
  await waitFor(() => document.querySelector("[data-shared-project-revision]")?.textContent === "0", "shared-project-load")
  let counts = await projectCounts()
  if (counts.reads !== 1 || counts.mutations !== 0 || counts.attempts !== 0) throw new Error("initial-project-requests")
  await waitFor(() => document.body.dataset.projectFetchPending === "true", "stale-request-pending")
  document.querySelector("#refetch-projects").click()
  await waitFor(() => document.querySelector('[role="status"]')?.textContent === "Projects loaded" && document.querySelector('[data-project="alpha"]')?.querySelector("[data-project-name]")?.textContent === "Alpha", "refetch-success")
  await new Promise(resolve => setTimeout(resolve, 300))
  if (document.querySelector('[data-project="alpha"] [data-project-name]').textContent !== "Alpha" || !document.body.dataset.projectFetchCleanup?.includes("|0")) throw new Error("stale-response")
  document.querySelector("#refetch-projects").click()
  await waitFor(() => document.querySelector('[role="alert"]')?.textContent === "HTTP 500", "http-error")
  document.querySelector("#refetch-projects").click()
  await waitFor(() => document.querySelector('[role="status"]')?.textContent === "Projects loaded" && !document.querySelector('[role="alert"]') && document.querySelector('[data-project="alpha"]'), "http-recovery")
  if (document.querySelector("[data-server-page]").textContent !== "1" || document.querySelector("[data-server-filter]").textContent !== "all" || document.querySelectorAll("[data-project]").length > 2) throw new Error("initial-bounded-page")
  counts = await projectCounts()
  if (counts.listRequests !== 4) throw new Error("initial-list-request-count")
  document.querySelector("#next-project-page").click()
  await waitFor(() => document.querySelector("[data-server-page]")?.textContent === "2" && document.querySelector('[data-project="gamma"]') && document.querySelector('[role="status"]')?.textContent === "Projects loaded", "next-server-page")
  if (location.search !== "?page=2&filter=all" || document.querySelectorAll("[data-project]").length !== 2) throw new Error("next-page-url-bound")
  counts = await projectCounts()
  if (counts.listRequests !== 5) throw new Error("next-page-request-count")
  history.back()
  await waitFor(() => location.search === "" && document.querySelector("[data-server-page]")?.textContent === "1" && document.querySelector('[data-project="alpha"]') && document.querySelector('[data-project="beta"]'), "page-history-back")
  counts = await projectCounts()
  if (counts.listRequests !== 6) throw new Error("page-history-request-count")
  document.querySelector("#active-project-page").click()
  await waitFor(() => document.querySelector("[data-server-filter]")?.textContent === "active" && document.querySelector('[data-project="alpha"]') && !document.querySelector('[data-project="beta"]'), "server-filter")
  if (location.search !== "?page=1&filter=active" || document.querySelectorAll("[data-project]").length !== 1) throw new Error("server-filter-url-bound")
  counts = await projectCounts()
  if (counts.listRequests !== 7) throw new Error("server-filter-request-count")
  history.back()
  await waitFor(() => location.search === "" && document.querySelector("[data-server-filter]")?.textContent === "all" && document.querySelector('[data-project="beta"]'), "filter-history-back")
  counts = await projectCounts()
  if (counts.listRequests !== 8) throw new Error("filter-history-request-count")
  document.querySelector("#refetch-projects").click()
  await waitForListRequests(9)
  let visibility = "hidden"
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => visibility })
  document.querySelector("#enable-project-polling").click()
  await waitFor(() => document.body.dataset.projectPolling === "active", "polling-active")
  document.dispatchEvent(new Event("visibilitychange"))
  await new Promise(resolve => setTimeout(resolve, 30))
  counts = await projectCounts()
  if (counts.listRequests !== 9) throw new Error("hidden-polling-request")
  visibility = "visible"
  document.dispatchEvent(new Event("visibilitychange"))
  await waitForListRequests(10)
  document.querySelector("#disable-project-polling").click()
  await waitFor(() => document.body.dataset.projectPolling === "stopped", "polling-cleanup")
  document.dispatchEvent(new Event("visibilitychange"))
  await new Promise(resolve => setTimeout(resolve, 30))
  counts = await projectCounts()
  if (counts.listRequests !== 10) throw new Error("released-polling-request")
  const layout = document.querySelector("[data-app-layout]")
  const output = document.querySelector("#project-filter")
  if (output.textContent !== "All projects") throw new Error("initial-state")
  if (document.querySelector("#project-count").textContent !== "2") throw new Error("initial-summary")
  const unrelated = document.querySelector("#unrelated-control")
  let unrelatedMutations = 0
  new MutationObserver(records => { unrelatedMutations += records.length }).observe(unrelated, { attributes: true, childList: true, characterData: true, subtree: true })
  const alpha = document.querySelector('[data-project="alpha"]')
  const beta = document.querySelector('[data-project="beta"]')
  const savedAll = document.querySelector('[data-saved-filter="all"]')

  document.querySelector("#show-active").click()
  await waitFor(() => !document.querySelector('[data-project="beta"]'), "filter-remove")
  if (output.textContent !== "Active projects") throw new Error("state-command")
  if (document.querySelector('[data-project="alpha"]') !== alpha || beta.isConnected) throw new Error("filter-identity")

  document.querySelector("#show-all").click()
  await waitFor(() => document.querySelector('[data-project="beta"]'), "filter-restore")
  const issue = document.querySelector('[data-issue="a1"]')
  document.querySelector('[data-expand="alpha"]').click()
  await waitFor(() => document.querySelector('[data-expand="alpha"]').getAttribute("aria-expanded") === "true", "expand")
  document.querySelector("#replace-workspace").click()
  await waitFor(() => document.querySelector('[data-issue="a3"]'), "object-replace")
  if (document.querySelector('[data-project="alpha"]') !== alpha || document.querySelector('[data-issue="a1"]') !== issue) throw new Error("nested-identity")
  if (alpha.querySelector("[data-project-name]").textContent !== "Alpha updated" || alpha.querySelector("[data-issue-count]").textContent !== "3") throw new Error("object-bindings")
  if (document.querySelector("#total-issues").textContent !== "4") throw new Error("derived-count")

  document.querySelector("#save-active").click()
  await waitFor(() => document.querySelector('[data-saved-filter="active"]'), "array-state")
  if (document.querySelector('[data-saved-filter="all"]') !== savedAll) throw new Error("array-identity")

  const summary = document.querySelector("#project-summary")
  document.querySelector("#toggle-summary").click()
  await waitFor(() => !document.querySelector("#project-summary"), "summary-remove")
  if (summary.isConnected) throw new Error("summary-release")
  document.querySelector("#toggle-summary").click()
  await waitFor(() => document.querySelector("#project-summary"), "summary-restore")
  if (document.querySelector("#project-summary") === summary) throw new Error("summary-identity")

  document.querySelector("#remove-alpha").click()
  await waitFor(() => !document.querySelector('[data-project="alpha"]'), "row-remove")
  if (alpha.isConnected || issue.isConnected) throw new Error("row-release")
  document.querySelector("#restore-alpha").click()
  await waitFor(() => document.querySelector('[data-project="alpha"]'), "row-restore")
  const restored = document.querySelector('[data-project="alpha"]')
  if (restored === alpha || restored.querySelector('[data-expand="alpha"]').getAttribute("aria-expanded") !== "false") throw new Error("row-state-reset")
  if (document.querySelector("#unrelated-control") !== unrelated || unrelatedMutations) throw new Error("unrelated-dom")
  if (browserErrors.length) throw new Error("browser-errors-" + browserErrors.join("-"))
  document.querySelector("[data-switch-workspace]").click()
  await waitFor(() => document.querySelector("[data-workspace]").textContent === "Secondary" && document.querySelector("[data-route-workspace]").textContent === "Secondary", "workspace-switch")
  await waitFor(() => localStorage.getItem("kudzu-project-workspace") === JSON.stringify({ version: 1, workspace: "Secondary" }), "workspace-persist")
  document.querySelector("[data-rename-project]").click()
  await Promise.resolve()
  if (document.querySelector("[data-shared-project-name]").textContent !== "Alpha optimistic" || !document.querySelector("[data-rename-project]").disabled || document.querySelector('[data-app-layout] [role="status"]')?.textContent !== "Saving project") throw new Error("mutation-pending")
  document.querySelector("[data-rename-project]").click()
  if (document.querySelector('[data-project="alpha"]') !== restored) throw new Error("optimistic-row-identity")
  await waitFor(() => document.querySelector('[role="alert"]')?.textContent === "HTTP 500" && document.querySelector("[data-shared-project-name]").textContent === "Alpha" && document.querySelector("[data-shared-project-revision]").textContent === "0", "mutation-rollback")
  counts = await projectCounts()
  if (counts.reads !== 1 || counts.mutations !== 0 || counts.attempts !== 1) throw new Error("mutation-rollback-requests")
  document.querySelector('a[href="/app/projects/alpha"]').click()
  await waitFor(() => document.querySelector("[data-project-detail]"), "detail-navigation")
  const firstDetail = document.querySelector("[data-project-detail]")
  counts = await projectCounts()
  if (document.querySelector("[data-app-layout]") !== layout || document.querySelector("[data-workspace]").textContent !== "Secondary" || document.querySelector("[data-route-workspace]").textContent !== "Secondary" || document.querySelector("[data-project-draft]").textContent !== "Clean draft" || counts.reads !== 1 || counts.mutations !== 0 || counts.attempts !== 1) throw new Error("layout-persistence")
  document.querySelector("[data-rename-project]").click()
  await Promise.resolve()
  if (document.querySelector("[data-shared-project-name]").textContent !== "Alpha optimistic" || document.querySelector('[role="alert"]')) throw new Error("mutation-retry-optimistic")
  await waitFor(() => document.querySelector("[data-shared-project-name]").textContent === "Alpha renamed" && document.querySelector("[data-shared-project-revision]").textContent === "1" && document.querySelector('[data-app-layout] [role="status"]')?.textContent === "Project saved", "shared-project-mutation")
  counts = await projectCounts()
  if (counts.reads !== 1 || counts.mutations !== 1 || counts.attempts !== 2) throw new Error("mutation-requests")
  document.querySelector("[data-edit-draft]").click()
  await waitFor(() => document.querySelector("[data-project-draft]").textContent === "Dirty draft", "draft-edit")
  document.querySelector('a[href="/app/projects"]').click()
  await waitFor(() => document.querySelector("[data-project-list-page]"), "list-navigation")
  counts = await projectCounts()
  if (firstDetail.isConnected || document.querySelector("[data-app-layout]") !== layout || document.querySelector("[data-route-workspace]").textContent !== "Secondary" || document.querySelector("[data-shared-project-name]").textContent !== "Alpha renamed" || document.querySelector("[data-shared-project-revision]").textContent !== "1" || counts.reads !== 1 || counts.mutations !== 1 || counts.attempts !== 2) throw new Error("route-release")
  const cleanupBeforeRemoval = document.body.dataset.projectFetchCleanup
  document.querySelector('a[href="/app/projects/alpha"]').click()
  await waitFor(() => document.querySelector("[data-project-detail]"), "detail-revisit")
  await new Promise(resolve => setTimeout(resolve, 300))
  if (document.body.dataset.projectFetchCleanup === cleanupBeforeRemoval || document.querySelector("[data-project-list-page]") || browserErrors.length) throw new Error("fetch-route-release")
  counts = await projectCounts()
  if (document.querySelector("[data-project-detail]") === firstDetail || document.querySelector("[data-project-draft]").textContent !== "Clean draft" || document.querySelector("[data-workspace]").textContent !== "Secondary" || document.querySelector("[data-shared-project-name]").textContent !== "Alpha renamed" || counts.reads !== 1 || counts.mutations !== 1 || counts.attempts !== 2 || counts.listRequests !== 11) throw new Error("route-reset")
  sessionStorage.setItem("kudzu-project-refresh", "pending")
  location.reload()
  }
} catch (error) {
  document.body.dataset.browserTest = "fail-" + error.message + (browserErrors.length ? "-" + browserErrors.join("-") : "")
}
`)

  const port = await availablePort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
const rewrites = JSON.parse(fs.readFileSync(path.join(root, "rewrites.json")))
let project = { id: "alpha", name: "Alpha", revision: 0 }, projectReads = 0, projectMutations = 0, projectMutationAttempts = 0, listRequests = 0
http.createServer((request, response) => {
  const url = new URL(request.url, "http://localhost"), pathname = url.pathname
  if (pathname === "/api/project/alpha") {
    response.setHeader("content-type", "application/json")
    if (request.method === "POST") {
      projectMutationAttempts++
      if (projectMutationAttempts === 1) {
        setTimeout(() => { response.statusCode = 500; response.end(JSON.stringify({ error: "failed" })) }, 1000)
        return
      }
      projectMutations++
      project = { id: "alpha", name: "Alpha renamed", revision: project.revision + 1 }
    } else projectReads++
    response.end(JSON.stringify(project))
    return
  }
  if (pathname === "/api/project-counts") {
    response.setHeader("content-type", "application/json")
    response.end(JSON.stringify({ reads: projectReads, mutations: projectMutations, attempts: projectMutationAttempts, listRequests }))
    return
  }
  if (pathname === "/api/projects") {
    const requestNumber = Number(url.searchParams.get("request"))
    const page = Number(url.searchParams.get("page")) || 1
    const filter = url.searchParams.get("filter") || "all"
    listRequests++
    response.setHeader("content-type", "application/json")
    if (requestNumber === 2) { response.statusCode = 500; response.end(JSON.stringify({ error: "failed" })); return }
    if (page === 2) {
      response.end(JSON.stringify([
        { id: "gamma", name: "Gamma", status: "active", issues: [{ id: "g1", title: "Bound result" }] },
        { id: "delta", name: "Delta", status: "archived", issues: [] }
      ]))
      return
    }
    const alphaName = requestNumber === 0 ? "Stale Alpha" : "Alpha"
    const projects = [
      { id: "alpha", name: alphaName, status: "active", issues: [{ id: "a1", title: "Design schema" }, { id: "a2", title: "Ship dashboard" }] },
      { id: "beta", name: "Beta", status: "archived", issues: [{ id: "b1", title: "Archive notes" }] }
    ]
    response.end(JSON.stringify(filter === "active" ? projects.slice(0, 1) : projects))
    return
  }
  const segments = pathname.split("/").filter(Boolean)
  const rewrite = rewrites.find(entry => entry.segments.length === segments.length && entry.segments.every((segment, index) => segment.literal === undefined || segment.literal === segments[index]))
  const relative = pathname === "/" ? "index.html" : pathname.slice(1)
  const direct = path.join(root, relative.endsWith("/") || !path.extname(relative) ? relative + (relative.endsWith("/") ? "" : "/") + "index.html" : relative)
  const file = fs.existsSync(direct) || !rewrite ? direct : path.join(root, rewrite.file)
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--enable-logging=stderr", "--virtual-time-budget=10000", "--dump-dom", `http://127.0.0.1:${port}/app/projects`], { encoding: "utf8", timeout: 30_000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-browser-test="pass"/, browser.stderr)
    const direct = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/app/projects/alpha?direct=1`], { encoding: "utf8", timeout: 15_000 })
    assert.equal(direct.status, 0, direct.stderr)
    assert.match(direct.stdout, /data-direct-load-test="pass"/, direct.stderr)
    const runtime = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=5000", "--dump-dom", `http://127.0.0.1:${port}/app/projects/beta?runtime-project=1`], { encoding: "utf8", timeout: 20_000 })
    assert.equal(runtime.status, 0, runtime.stderr)
    assert.match(runtime.stdout, /data-runtime-project-test="pass"/, runtime.stderr)
    const directIssue = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/app/projects/gamma/issues/second?direct-issue=1`], { encoding: "utf8", timeout: 15_000 })
    assert.equal(directIssue.status, 0, directIssue.stderr)
    assert.match(directIssue.stdout, /data-direct-issue-test="pass"/, directIssue.stderr)
    const reloadIssue = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/app/projects/gamma/issues/second?reload-issue=1`], { encoding: "utf8", timeout: 15_000 })
    assert.equal(reloadIssue.status, 0, reloadIssue.stderr)
    assert.match(reloadIssue.stdout, /data-runtime-reload-test="pass"/, reloadIssue.stderr)
    for (const mode of ["valid", "malformed", "invalid-schema", "wrong-version", "empty"]) {
      const storage = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/app/projects?storage=${mode}`], { encoding: "utf8", timeout: 15_000 })
      assert.equal(storage.status, 0, storage.stderr)
      assert.match(storage.stdout, new RegExp(`data-storage-test="${mode}"`), storage.stderr)
    }
  } finally {
    server.kill()
  }
}

async function availablePort() {
  const server = createServer()
  await new Promise((resolve, reject) => server.once("error", reject).listen(0, "127.0.0.1", resolve))
  const { port } = server.address()
  await new Promise(resolve => server.close(resolve))
  return port
}

async function outputBaseline(artifacts) {
  const files = []
  const walk = async (directory, prefix = "") => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = `${prefix}${entry.name}`
      const url = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory)
      if (entry.isDirectory()) await walk(url, `${path}/`)
      else {
        const contents = await readFile(url)
        files.push({ path, contents, hash: createHash("sha256").update(contents).digest("hex") })
      }
    }
  }
  await walk(new URL("dist/", fixture))
  files.sort((left, right) => left.path.localeCompare(right.path))
  const routeBytes = route => {
    const record = artifacts.routes.find(entry => entry.route === route)
    const assets = new Set([...record.runtime.entries, ...record.runtime.requirements, ...record.handlers.entries, ...record.handlers.chunks, ...record.workers.flatMap(worker => [worker.entry, ...worker.chunks])].map(path => path.slice(1)))
    const selected = files.filter(file => assets.has(file.path))
    return {
      javascriptRawBytes: selected.reduce((total, file) => total + file.contents.length, 0),
      javascriptAggregateGzipBytes: selected.reduce((total, file) => total + gzipSync(file.contents).length, 0)
    }
  }
  return {
    deploy: {
      files: files.length,
      rawBytes: files.reduce((total, file) => total + file.contents.length, 0),
      aggregateGzipBytes: files.reduce((total, file) => total + gzipSync(file.contents).length, 0),
      sha256: createHash("sha256").update(files.map(file => `${file.path}:${file.hash}`).join("\n")).digest("hex")
    },
    routes: {
      "/app/projects": routeBytes("/app/projects"),
      "/app/projects/alpha": routeBytes("/app/projects/alpha"),
      "/app/projects/[projectId]": routeBytes("/app/projects/[projectId]"),
      "/app/projects/[projectId]/issues/[issueId]": routeBytes("/app/projects/[projectId]/issues/[issueId]"),
      "/help": routeBytes("/help")
    }
  }
}

async function waitForServer(port) {
  for (let attempt = 0; attempt < 400; attempt++) {
    const ready = await new Promise(resolve => {
      const socket = createConnection({ host: "127.0.0.1", port })
      socket.once("connect", () => { socket.destroy(); resolve(true) })
      socket.once("error", () => { socket.destroy(); resolve(false) })
    })
    if (ready) return
    await new Promise(resolve => setTimeout(resolve, 25))
  }
  throw new Error(`Project application server did not start on port ${port}`)
}
