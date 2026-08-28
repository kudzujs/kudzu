import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { existsSync } from "node:fs"
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises"
import { spawn, spawnSync } from "node:child_process"
import { createServer } from "node:http"
import { createConnection } from "node:net"
import test from "node:test"
import { gzipSync } from "node:zlib"

const fixture = new URL("./fixtures/project-application/", import.meta.url)
const cli = new URL("../bin/kudzu.mjs", import.meta.url)
const chromePaths = [process.env.CHROME_BIN, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].filter(Boolean)

test("establishes the 0.15.2 notification ownership contract", { timeout: 120_000 }, async t => {
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
  assert.equal(contract.milestone, "0.15.2")
  assert.deepEqual(contract.architectureDecision, {
    patch: "0.11.2",
    status: "closed-no-new-primitive",
    primitive: null,
    fixtures: ["project-application", "tanstack-query-migration", "apache-answer-browser-questions"],
    repeatedMissingContracts: [],
    reusedSemantics: ["ordinary-state", "owned-effect", "dependency-invalidation", "owner-release", "static-exclusion"]
  })
  assert.deepEqual(contract.nestedLayoutDecision, {
    patch: "0.12.4",
    status: "closed-by-stop-condition",
    ownerChain: null,
    reviewedRouteSets: ["project-application", "apache-answer-route-shell", "apache-answer-auth-ownership", "context-shared-actions", "zustand-migration", "navigation-groups"],
    qualifyingRoutes: [],
    reusedSemantics: ["single-layout-owner", "route-owner", "static-composition", "conditional-and-keyed-ownership", "native-document-navigation", "disjoint-navigation-groups"]
  })
  assert.deepEqual(contract.formMetadataDecision, {
    patch: "0.13.1",
    status: "closed-by-application-composition",
    registry: null,
    fixture: "project-application",
    reusedSemantics: ["native-form-controls", "ordinary-object-and-array-state", "conditional-ownership", "keyed-row-identity", "native-reset"]
  })
  assert.deepEqual(contract.draftAutosaveDecision, {
    patch: "0.13.2",
    status: "closed-by-application-composition",
    scheduler: null,
    fixture: "project-application",
    reusedSemantics: ["ordinary-state", "conditional-ownership", "dependency-effect-cleanup", "owned-fetch", "versioned-storage"]
  })
  assert.deepEqual(contract.fileUploadDecision, {
    patch: "0.13.3",
    status: "closed-by-application-composition",
    transport: "fetch-formdata",
    progress: null,
    fixture: "project-application",
    reusedSemantics: ["native-file-input", "ordinary-state", "dependency-effect-cleanup", "owned-fetch", "keyed-row-identity"]
  })
  assert.deepEqual(contract.projectTableDecision, {
    patch: "0.14.0",
    status: "closed-by-application-composition",
    dataGrid: null,
    fixture: "project-application",
    reusedSemantics: ["native-table", "ordinary-array-state", "pure-collection-selectors", "keyed-row-state", "keyed-row-identity", "native-keyboard-controls"]
  })
  assert.deepEqual(contract.objectStateCollectionsDecision, {
    patch: "0.14.1",
    status: "closed-by-existing-keyed-ownership",
    fixture: "project-application",
    reusedSemantics: ["ordinary-object-state", "binding-backed-keyed-collection", "nested-keyed-ownership", "keyed-row-state-release", "latest-item-handlers"]
  })
  assert.deepEqual(contract.infiniteLoadingDecision, {
    patch: "0.14.2",
    status: "closed-by-application-composition",
    runtime: null,
    fixture: "project-application",
    pageSize: 2,
    maxSuccessfulPages: 2,
    maxRetainedProjects: 6,
    reusedSemantics: ["intersection-observer", "owned-fetch", "dependency-effect-cleanup", "ordinary-primitive-state", "immutable-keyed-append", "keyed-row-identity"]
  })
  assert.deepEqual(contract.largeListDecision, {
    patch: "0.14.3",
    status: "closed-by-pagination",
    fixture: "project-list-decision",
    items: 10000,
    pageSize: 100,
    selectedStrategy: "pagination",
    virtualRangeRuntime: null,
    qualifyingVirtualizationFixtures: 0,
    rejectedStrategies: ["direct-dom", "fixed-height-scroll-window"]
  })
  assert.deepEqual(contract.virtualRangeDecision, {
    patch: "0.14.4",
    status: "closed-by-stop-condition",
    selectedStrategy: "pagination",
    requiredIndependentFixtures: 3,
    qualifyingFixtures: 0,
    runtime: null
  })
  assert.deepEqual(contract.nativeDialogDecision, {
    patch: "0.15.0",
    status: "closed-by-native-composition",
    fixture: "project-application",
    runtime: null,
    reusedSemantics: ["native-dialog-top-layer", "ordinary-primitive-state", "object-ref-ownership", "native-cancel-event", "keyed-row-identity", "route-dom-release"]
  })
  assert.deepEqual(contract.nativePopoverDecision, {
    patch: "0.15.1",
    status: "supported-by-key-scoped-id-references",
    fixture: "project-application",
    runtime: "existing-keyed-list-runtime",
    reusedSemantics: ["native-popover-top-layer", "keyed-row-identity", "key-scoped-use-id", "native-escape-and-light-dismiss", "route-dom-release"]
  })
  assert.deepEqual(contract.notificationDecision, {
    patch: "0.15.2",
    status: "closed-by-layout-composition",
    fixture: "project-application",
    scheduler: null,
    timeoutMs: 800,
    reusedSemantics: ["layout-owned-array-state", "keyed-list-identity", "dependency-effect-cleanup", "native-live-region", "enhanced-navigation-layout-retention"]
  })

  const projects = plan.routes.find(route => route.route === "/app/projects")
  const detail = plan.routes.find(route => route.route === "/app/projects/alpha")
  const runtimeProject = plan.routes.find(route => route.route === "/app/projects/[projectId]")
  const runtimeIssue = plan.routes.find(route => route.route === "/app/projects/[projectId]/issues/[issueId]")
  const projectArtifacts = artifacts.routes.find(route => route.route === "/app/projects")
  const detailArtifacts = artifacts.routes.find(route => route.route === "/app/projects/alpha")
  const runtimeProjectArtifacts = artifacts.routes.find(route => route.route === "/app/projects/[projectId]")
  const runtimeIssueArtifacts = artifacts.routes.find(route => route.route === "/app/projects/[projectId]/issues/[issueId]")
  const login = plan.routes.find(route => route.route === "/login")
  assert.deepEqual(projects.states.slice(0, 4).map(state => state.name), ["token", "username", "isAdmin", "authStatus"])
  assert.deepEqual(login.states.map(state => state.name), ["error", "submitting"])
  assert.deepEqual(projects.states.filter(state => !state.internal && !state.name.startsWith("__kRowState")).map(state => state.name), ["token", "username", "isAdmin", "authStatus", "workspace", "storageReady", "projectName", "projectRevision", "mutationStatus", "mutationError", "notifications", "activeNotificationId", "summary", "projectData", "filter", "showSummary", "savedFilters", "request", "status", "error", "polling", "selectedId", "sortDirection", "loadCursor", "requestedCursor", "loadRequest", "loadStatus", "loadError", "loadEnd", "loadObserverGeneration", "pendingDeleteId"])
  assert.deepEqual(projects.states.slice(0, 31).map(state => state.lifetime), ["layout", "layout", "layout", "layout", "layout", "layout", "layout", "layout", "layout", "layout", "layout", "layout", "route", "route", "route", "route", "route", "route", "route", "route", "route", "route", "route", "route", "route", "route", "route", "route", "route", "route", "route"])
  assert.deepEqual(detail.states.slice(0, 12).map(state => [state.name, state.lifetime, state.initialValue]), [["token", "layout", ""], ["username", "layout", ""], ["isAdmin", "layout", false], ["authStatus", "layout", "restoring"], ["workspace", "layout", "Primary"], ["storageReady", "layout", false], ["projectName", "layout", "Alpha"], ["projectRevision", "layout", -1], ["mutationStatus", "layout", "idle"], ["mutationError", "layout", ""], ["notifications", "layout", []], ["activeNotificationId", "layout", ""]])
  assert.equal(projects.effects.length, 9)
  assert.equal(detail.effects.length, 8)
  assert.equal(projects.bindings.length, 18)
  assert.equal(projects.lists.length, 4)
  const projectDataState = projects.states.find(state => state.name === "projectData")
  const projectList = projects.lists.find(list => list.source?.states.projectData === projectDataState.id)
  const issueList = projects.lists.find(list => list.ownerField === "issues")
  assert.equal(issueList.state, projectDataState.id)
  assert.equal(projectList.children.some(child => child.id === issueList.id && child.field === "issues"), true)
  assert.equal(projectList.rowIds?.length, 1)
  assert.equal(projects.lists.some(list => Object.values(list.selectorStates ?? {}).includes(projects.states.find(state => state.name === "filter").id) && Object.values(list.selectorStates ?? {}).includes(projects.states.find(state => state.name === "sortDirection").id) && list.expressionStates?.includes(projects.states.find(state => state.name === "selectedId").id) && list.rowStates?.length === 3), true)
  assert.equal(projects.conditions.some(condition => condition.state === projects.states.find(state => state.name === "showSummary").id), true)
  assert.deepEqual(projectArtifacts.capability.manifest.events.command, ["click"])
  assert.deepEqual(projectArtifacts.capability.manifest.events.native, ["cancel", "click", "input"])
  assert.equal(projectArtifacts.capability.manifest.bindings.text, true)
  assert.equal(projectArtifacts.capability.manifest.lists.nested, true)
  assert.equal(projectArtifacts.capability.manifest.lists.rowHooks, true)
  assert.equal(projectArtifacts.capability.manifest.lists.selectors, true)
  assert.equal(projectArtifacts.handlers.entries.length, 2)
  assert.equal(projectArtifacts.runtime.entries.some(path => path.endsWith("/kudzu-navigation.js")), true)
  assert.equal(projectArtifacts.runtime.requirements.some(path => path.endsWith("/kudzu-list.js")), true)
  assert.equal(projectArtifacts.runtime.family, detailArtifacts.runtime.family)
  assert.equal(detailArtifacts.runtime.entries.some(path => path.endsWith("/kudzu-navigation.js")), true)
  assert.equal(detail.lists.length, 3)
  assert.equal(detailArtifacts.capability.manifest.lists.stableFastPaths, true)
  assert.deepEqual(detailArtifacts.capability.manifest.events.native, ["blur", "change", "click", "input", "reset", "submit"])
  assert.deepEqual(detailArtifacts.handlers, { entries: ["/assets/handlers/AppLayout.js", "/assets/handlers/pages/app/projects/alpha.js"], chunks: [] })
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

  const projectsHtml = await readFile(new URL("dist/app/projects/index.html", fixture), "utf8")
  const runtimeProjectHtml = await readFile(new URL("dist/app/projects/[projectId]/index.html", fixture), "utf8")
  const runtimeIssueHtml = await readFile(new URL("dist/app/projects/[projectId]/issues/[issueId]/index.html", fixture), "utf8")
  const detailHtml = await readFile(new URL("dist/app/projects/alpha/index.html", fixture), "utf8")
  assert.match(projectsHtml, /data-project-table.*<thead>.*<th[^>]*>Project<\/th>.*<tbody>.*data-project="alpha".*data-project="beta".*<\/tbody>.*<\/table>/s)
  assert.match(projectsHtml, /data-retry-incremental.*data-project-sentinel.*data-project-page-size="2".*data-project-result-limit="6"/s)
  assert.match(projectsHtml, /data-notifications(?:="true")? aria-live="polite" aria-atomic="false"/)
  assert.match(projectsHtml, /<dialog[^>]*data-delete-project-dialog[^>]*aria-labelledby="delete-project-title"[^>]*aria-describedby="delete-project-description".*data-confirm-project-delete[^>]*>Delete project.*data-cancel-project-delete/s)
  const alphaActions = projectsHtml.match(/data-project-actions="alpha" popovertarget="([^"]+)".*id="\1" popover="auto" data-project-actions-popover="alpha"/s)
  const betaActions = projectsHtml.match(/data-project-actions="beta" popovertarget="([^"]+)".*id="\1" popover="auto" data-project-actions-popover="beta"/s)
  assert.ok(alphaActions && betaActions)
  assert.notEqual(alphaActions[1], betaActions[1])
  assert.match(await readFile(new URL("dist/assets/handlers/pages/app/projects.js", fixture), "utf8"), /IntersectionObserver.*incremental\?cursor=/s)
  assert.match(runtimeProjectHtml, /data-runtime-project.*data-project-id.*<h1>Project .*data-k-text="rp0".*This project route is directly addressable.*data-first-issue/s)
  assert.match(runtimeIssueHtml, /data-runtime-issue.*data-project-id.*data-issue-id.*<h1>Issue .*data-k-text="rp1".*Project .*data-k-text="rp0"/s)
  assert.match(detailHtml, /data-issue-form.*data-k-native-reset.*data-form-dirty.*data-title-touched.*id="issue-title".*required.*minLength="5".*aria-invalid.*aria-describedby.*data-body-touched.*id="issue-body".*required.*minLength="20".*data-assignee-enabled.*data-checklist.*data-checklist-row="check-1".*name="checklist".*data-add-checklist.*data-reset-issue.*id="issue-submit"/s)
  assert.match(detailHtml, /data-setup-draft.*data-setup-step="1".*id="setup-name".*data-setup-next.*data-setup-status.*data-saved-setup-version/s)
  assert.match(detailHtml, /data-attachment-upload.*id="project-attachment".*type="file".*accept="text\/plain".*data-upload-attachment.*data-cancel-upload.*data-upload-status.*data-attachments/s)
  const paramModule = new URL("dist/assets/params/app/projects/[projectId]/index.js", fixture).href
  const invalidParam = spawnSync(process.execPath, ["--input-type=module", "-e", `globalThis.location={pathname:"/app/projects/%2F"};globalThis.document={body:{dataset:{}},querySelectorAll:()=>[]};await import(${JSON.stringify(paramModule)})`], { encoding: "utf8" })
  assert.notEqual(invalidParam.status, 0)

  const helpHtml = await readFile(new URL("dist/help/index.html", fixture), "utf8")
  const loginHtml = await readFile(new URL("dist/login/index.html", fixture), "utf8")
  const helpArtifacts = artifacts.routes.find(route => route.route === "/help")
  assert.match(helpHtml, /<h1>Project help<\/h1>/)
  assert.doesNotMatch(helpHtml, /<script|data-k-/)
  assert.deepEqual(helpArtifacts.runtime, { family: null, entries: [], requirements: [] })
  assert.deepEqual(helpArtifacts.handlers, { entries: [], chunks: [] })
  assert.match(loginHtml, /<form.*type="email".*type="password".*Log in/s)
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
  delete stableOutput.routes["/login"].javascriptAggregateGzipBytes
  delete stableBaseline.routes["/login"].javascriptAggregateGzipBytes
  assert.deepEqual(stableOutput, stableBaseline)
  // gzip output varies slightly across zlib versions; raw bytes and hashes stay exact.
  assert.ok(Math.abs(output.deploy.aggregateGzipBytes - contract.baseline.deploy.aggregateGzipBytes) <= 128, JSON.stringify(output))
  assert.ok(Math.abs(output.routes["/app/projects"].javascriptAggregateGzipBytes - contract.baseline.routes["/app/projects"].javascriptAggregateGzipBytes) <= 64, JSON.stringify(output))
  assert.ok(Math.abs(output.routes["/app/projects/alpha"].javascriptAggregateGzipBytes - contract.baseline.routes["/app/projects/alpha"].javascriptAggregateGzipBytes) <= 64)
  assert.ok(Math.abs(output.routes["/app/projects/[projectId]"].javascriptAggregateGzipBytes - contract.baseline.routes["/app/projects/[projectId]"].javascriptAggregateGzipBytes) <= 64)
  assert.ok(Math.abs(output.routes["/app/projects/[projectId]/issues/[issueId]"].javascriptAggregateGzipBytes - contract.baseline.routes["/app/projects/[projectId]/issues/[issueId]"].javascriptAggregateGzipBytes) <= 64)
  assert.ok(Math.abs(output.routes["/login"].javascriptAggregateGzipBytes - contract.baseline.routes["/login"].javascriptAggregateGzipBytes) <= 64)

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
const authMode = new URLSearchParams(location.search).get("auth")
if (authMode === "anonymous") {
  localStorage.removeItem("kudzu-project-token")
  sessionStorage.setItem("kudzu-auth-direct", "anonymous")
} else if (authMode === "rejected") {
  localStorage.setItem("kudzu-project-token", "expired-token")
  sessionStorage.setItem("kudzu-auth-direct", "rejected")
} else if (authMode === "member") localStorage.setItem("kudzu-project-token", "member-token")
else if (!localStorage.getItem("kudzu-project-token")) localStorage.setItem("kudzu-project-token", "admin-token")
globalThis.projectObserverStats = { instances: [], observes: 0, disconnects: 0, callbacks: 0 }
globalThis.IntersectionObserver = class {
  constructor(callback) {
    this.callback = callback
    this.active = false
    projectObserverStats.instances.push(this)
  }
  observe(target) {
    this.target = target
    this.active = true
    projectObserverStats.observes++
  }
  disconnect() {
    if (!this.active) return
    this.active = false
    projectObserverStats.disconnects++
  }
  trigger() {
    if (!this.active) return
    projectObserverStats.callbacks++
    this.callback([{ isIntersecting: true, target: this.target }])
  }
}
</script></head>`).replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  }
  const loginUrl = new URL("login/index.html", output)
  await writeFile(loginUrl, (await readFile(loginUrl, "utf8")).replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const waitFor = async (predicate, label) => {
  for (let attempt = 0; attempt < 1000; attempt++) {
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
const waitForIncrementalRequests = async expected => {
  for (let attempt = 0; attempt < 200; attempt++) {
    const counts = await projectCounts()
    if (counts.incrementalRequests === expected) return counts
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  throw new Error("incremental-request-count-" + expected)
}
const activeProjectObserver = () => projectObserverStats.instances.findLast(observer => observer.active && observer.target?.matches("[data-project-sentinel]"))
try {
  const search = new URLSearchParams(location.search)
  const storageMode = search.get("storage")
  const runtimeRoute = sessionStorage.getItem("kudzu-runtime-route")
  const authFlow = sessionStorage.getItem("kudzu-auth-flow")
  const directAuth = sessionStorage.getItem("kudzu-auth-direct")
  const routeFailure = search.get("route-failure")
  const fallbackFailure = sessionStorage.getItem("kudzu-route-failure")
  if (location.pathname === "/app/projects/alpha" && fallbackFailure) {
    sessionStorage.removeItem("kudzu-route-failure")
    if (fallbackFailure === "network" || fallbackFailure === "body") throw new Error(fallbackFailure + "-used-native-fallback")
    if (!document.querySelector("[data-project-detail]") || !document.querySelector('a[href="/app/projects"]')) throw new Error("invalid-fallback-document")
    document.body.dataset.routeFailureFallback = fallbackFailure
  } else if (location.pathname === "/login" && directAuth) {
    sessionStorage.removeItem("kudzu-auth-direct")
    if (localStorage.getItem("kudzu-project-token") !== null) throw new Error("direct-auth-token-clear")
    document.body.dataset.authDirectTest = directAuth
  } else if (location.pathname === "/login" && authFlow === "logout") {
    sessionStorage.removeItem("kudzu-auth-flow")
    if (localStorage.getItem("kudzu-project-token") !== null) throw new Error("logout-token-clear")
    document.body.dataset.authTest = "pass"
  } else if (authFlow === "reload") {
    await waitFor(() => document.querySelector("[data-session-status]")?.textContent === "authenticated" && document.querySelector("[data-session-user]")?.textContent === "Ada", "auth-reload-restore")
    sessionStorage.setItem("kudzu-auth-flow", "logout")
    document.querySelector("[data-logout]").click()
  } else if (authFlow === "pending") {
    await waitFor(() => document.querySelector("[data-session-status]")?.textContent === "authenticated" && document.querySelector("[data-session-user]")?.textContent === "Ada" && document.querySelector("[data-rename-project]"), "auth-valid-login")
    sessionStorage.setItem("kudzu-auth-flow", "reload")
    location.reload()
  } else if (search.has("auth-login")) {
    const form = document.querySelector("form")
    form.elements.email.value = "invalid@example.com"
    form.elements.password.value = "wrong"
    form.requestSubmit()
    await waitFor(() => document.querySelector('[role="alert"]')?.textContent === "HTTP 401", "auth-invalid-login")
    await waitFor(() => !form.querySelector("button").disabled, "auth-invalid-settled")
    form.elements.email.value = "admin@example.com"
    form.elements.password.value = "admin-password"
    sessionStorage.setItem("kudzu-auth-flow", "pending")
    form.requestSubmit()
  } else if (search.get("auth") === "member") {
    await waitFor(() => document.querySelector("[data-session-user]")?.textContent === "Mina" && document.querySelector('[role="status"]')?.textContent === "Projects loaded", "member-session")
    if (document.querySelector("[data-rename-project]")) throw new Error("member-admin-control")
    const response = await fetch("/api/project/alpha", { method: "POST", headers: { Authorization: "Bearer member-token" } })
    if (response.status !== 403) throw new Error("member-server-permission-" + response.status)
    document.body.dataset.memberTest = "pass"
  } else if (runtimeRoute === "reload") {
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
  } else if (search.has("history")) {
    await waitFor(() => document.querySelector("[data-project-list-page]") && document.querySelector("[data-k-navigation-status]"), "history-list-entry")
    const layout = document.querySelector("[data-app-layout]")
    document.querySelector("[data-switch-workspace]").click()
    await waitFor(() => document.querySelector("[data-workspace]")?.textContent === "Secondary", "history-layout-state")
    let scroll = ""
    globalThis.scrollTo = (left, top) => { scroll = "top:" + left + "," + top }
    Element.prototype.scrollIntoView = function () { scroll = "hash:" + this.id }
    const historyLink = document.querySelector("[data-history-project]")
    historyLink.focus()
    if (document.activeElement !== historyLink) throw new Error("history-link-focus")
    historyLink.click()
    await waitFor(() => document.querySelector("[data-project-detail]") && document.activeElement?.id === "project-history", "history-detail-navigation")
    if (location.pathname !== "/app/projects/alpha" || location.hash !== "#project-history" || document.title !== "Alpha project" || scroll !== "hash:project-history" || document.querySelector("[data-k-navigation-status]").textContent !== "Navigated to Alpha project" || document.querySelector("[data-app-layout]") !== layout || document.querySelector("[data-workspace]").textContent !== "Secondary") throw new Error("history-detail-contract")
    document.querySelector("[data-edit-draft]").click()
    await waitFor(() => document.querySelector("[data-project-draft]")?.textContent === "Dirty draft", "history-draft-edit")
    history.back()
    await waitFor(() => document.querySelector("[data-project-list-page]") && document.title === "Projects" && scroll === "top:0,0", "history-back")
    if (!document.activeElement?.matches("[data-project-list-page] h1")) throw new Error("history-back-focus-" + document.activeElement?.outerHTML)
    if (location.pathname !== "/app/projects" || location.hash || document.title !== "Projects" || scroll !== "top:0,0" || document.querySelector("[data-k-navigation-status]").textContent !== "Navigated to Projects" || document.querySelector("[data-app-layout]") !== layout || document.querySelector("[data-workspace]").textContent !== "Secondary") throw new Error("history-back-contract")
    history.forward()
    await waitFor(() => document.querySelector("[data-project-detail]") && document.activeElement?.id === "project-history", "history-forward")
    if (document.querySelector("[data-project-draft]").textContent !== "Clean draft" || document.querySelector("[data-app-layout]") !== layout || document.querySelector("[data-workspace]").textContent !== "Secondary") throw new Error("history-forward-contract")
    let intercepted
    document.addEventListener("click", event => {
      intercepted = event.defaultPrevented
      event.preventDefault()
    }, { once: true })
    document.querySelector('a[href="/help"]').dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }))
    if (intercepted) throw new Error("history-native-outside-group")
    document.body.dataset.navigationTest = "pass"
  } else if (routeFailure) {
    await waitFor(() => document.querySelector("[data-project-list-page]") && document.querySelector('[role="status"]')?.textContent === "Projects loaded", "route-failure-list-entry")
    const layout = document.querySelector("[data-app-layout]")
    const list = document.querySelector("[data-project-list-page]")
    const link = document.querySelector('a[href="/app/projects/alpha"]')
    sessionStorage.setItem("kudzu-route-failure", routeFailure)
    const browserFetch = globalThis.fetch
    let transportFailures = 0
    if (routeFailure === "network" || routeFailure === "body") globalThis.fetch = (input, init) => {
      const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url, location.href)
      if (url.searchParams.get("route-failure") === routeFailure && init?.headers?.accept === "text/html" && transportFailures++ < 2) {
        if (routeFailure === "network") return new Promise((resolve, reject) => setTimeout(() => reject(new TypeError("offline")), 10))
        return browserFetch(input, init).then(response => new Proxy(response, { get(target, key) {
          if (key === "text") return () => Promise.reject(new TypeError("body disconnected"))
          const value = Reflect.get(target, key, target)
          return typeof value === "function" ? value.bind(target) : value
        } }))
      }
      return browserFetch(input, init)
    }
    if (routeFailure === "network" || routeFailure === "body") {
      link.href = "/app/projects/alpha?route-failure=" + routeFailure
      link.focus()
    } else {
      link.focus()
      link.href = "/app/projects/alpha?route-failure=" + routeFailure
    }
    link.click()
    if (routeFailure === "network" || routeFailure === "body") {
      document.querySelector("#unrelated-control").focus()
      await waitFor(() => document.querySelector("[data-k-navigation-status]")?.textContent === "Navigation failed. Retry the link.", routeFailure + "-failure-status")
      if (location.pathname !== "/app/projects" || document.querySelector("[data-app-layout]") !== layout || document.querySelector("[data-project-list-page]") !== list || document.activeElement !== link || !list.isConnected) throw new Error(routeFailure + "-failure-retention")
      link.click()
      await waitFor(() => document.querySelector("[data-project-detail]") && document.activeElement?.matches("[data-project-detail] h1"), routeFailure + "-retry")
      sessionStorage.removeItem("kudzu-route-failure")
      if (location.pathname !== "/app/projects/alpha" || document.querySelector("[data-app-layout]") !== layout || list.isConnected) throw new Error(routeFailure + "-retry-contract")
      document.body.dataset.routeFailureTest = "pass"
    }
  } else if (search.has("dialog-cleanup")) {
    await waitFor(() => document.querySelector('[role="status"]')?.textContent === "Projects loaded" && document.querySelector("[data-delete-project-dialog]"), "dialog-cleanup-entry")
    const dialog = document.querySelector("[data-delete-project-dialog]")
    document.querySelector('[data-delete-project="alpha"]').click()
    await waitFor(() => dialog.open && dialog.matches(":modal"), "dialog-cleanup-open")
    document.querySelector('a[href="/app/projects/alpha"]').click()
    await waitFor(() => document.querySelector("[data-project-detail]"), "dialog-cleanup-navigation")
    if (dialog.isConnected || dialog.matches(":modal")) throw new Error("dialog-route-cleanup")
    document.body.dataset.dialogCleanupTest = "pass"
  } else if (search.has("infinite-cleanup")) {
    await waitFor(() => document.querySelector('[role="status"]')?.textContent === "Projects loaded" && activeProjectObserver(), "incremental-cleanup-entry")
    const list = document.querySelector("[data-project-list-page]")
    const before = await projectCounts()
    const browserFetch = globalThis.fetch
    let incrementalSignal
    globalThis.fetch = (input, init) => {
      if (new URL(typeof input === "string" || input instanceof URL ? input : input.url, location.href).pathname === "/api/projects/incremental") incrementalSignal = init?.signal
      return browserFetch(input, init)
    }
    activeProjectObserver().trigger()
    await waitForIncrementalRequests(before.incrementalRequests + 1)
    document.querySelector('a[href="/app/projects/alpha"]').click()
    await waitFor(() => document.querySelector("[data-project-detail]"), "incremental-cleanup-navigation")
    await new Promise(resolve => setTimeout(resolve, 300))
    if (list.isConnected || !incrementalSignal?.aborted || activeProjectObserver() || projectObserverStats.disconnects < 1) throw new Error("incremental-route-cleanup")
    document.body.dataset.infiniteCleanupTest = "pass"
  } else if (storageMode) {
    const expected = storageMode === "valid" ? "Secondary" : "Primary"
    await waitFor(() => document.querySelector("[data-workspace]")?.textContent === expected && document.querySelector("[data-route-workspace]")?.textContent === expected, "storage-restore")
    await waitFor(() => localStorage.getItem("kudzu-project-workspace") === JSON.stringify({ version: 1, workspace: expected }), "storage-fallback-write")
    document.body.dataset.storageTest = storageMode
  } else if (sessionStorage.getItem("kudzu-project-refresh") === "pending") {
    sessionStorage.removeItem("kudzu-project-refresh")
    await waitFor(() => document.querySelector("[data-shared-project-name]")?.textContent === "Alpha renamed" && document.querySelector("[data-shared-project-revision]")?.textContent === "2", "refresh-server-restore")
    const counts = await projectCounts()
    if (counts.reads !== 2 || counts.mutations !== 2 || counts.attempts !== 3 || performance.getEntriesByType("navigation")[0]?.type !== "reload" || document.querySelector("[data-project-draft]").textContent !== "Clean draft") throw new Error("refresh-contract")
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
  await waitFor(() => activeProjectObserver(), "incremental-observer")
  const incrementalAlpha = document.querySelector('[data-project="alpha"]')
  const incrementalBeta = document.querySelector('[data-project="beta"]')
  const firstObserver = activeProjectObserver()
  firstObserver.trigger()
  firstObserver.trigger()
  await waitFor(() => document.querySelector('[data-project="gamma"]') && document.querySelector('[data-incremental-status]')?.textContent !== "Loading more projects", "incremental-first-page")
  counts = await projectCounts()
  if (counts.incrementalRequests !== 1 || projectObserverStats.callbacks !== 1 || document.querySelector('[data-project="alpha"]') !== incrementalAlpha || document.querySelector('[data-project="beta"]') !== incrementalBeta || document.querySelectorAll('[data-project="beta"]').length !== 1 || document.querySelectorAll("[data-project]").length !== 3) throw new Error("incremental-first-contract")
  await waitFor(() => activeProjectObserver() && activeProjectObserver() !== firstObserver, "incremental-next-observer")
  activeProjectObserver().trigger()
  await waitFor(() => document.querySelector('[data-incremental-error]')?.textContent === "HTTP 503", "incremental-error")
  counts = await projectCounts()
  if (counts.incrementalRequests !== 2 || activeProjectObserver()) throw new Error("incremental-error-contract-" + counts.incrementalRequests + "-" + projectObserverStats.instances.map(observer => Number(observer.active)).join("") + "-" + projectObserverStats.observes + "-" + projectObserverStats.disconnects)
  document.querySelector("[data-retry-incremental]").click()
  await waitFor(() => document.querySelector("[data-incremental-end]") && document.querySelector('[data-project="delta"]') && document.querySelector('[data-project="epsilon"]'), "incremental-retry-end")
  counts = await projectCounts()
  if (counts.incrementalRequests !== 3 || document.querySelectorAll("[data-project]").length !== 5 || document.querySelectorAll('[data-project="beta"]').length !== 1 || activeProjectObserver()) throw new Error("incremental-bounds")
  for (const observer of projectObserverStats.instances) if (observer.target?.matches("[data-project-sentinel]")) observer.trigger()
  await new Promise(resolve => setTimeout(resolve, 50))
  if ((await projectCounts()).incrementalRequests !== 3) throw new Error("incremental-after-end")
  document.querySelector("#next-project-page").click()
  await waitFor(() => document.querySelector("[data-server-page]")?.textContent === "2" && document.querySelector('[data-project="gamma"]') && document.querySelectorAll("[data-project]").length === 2 && document.querySelector('[role="status"]')?.textContent === "Projects loaded", "next-server-page")
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
  await new Promise(resolve => setTimeout(resolve, 300))
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

  document.querySelector('[data-select-project="beta"]').click()
  await waitFor(() => beta.getAttribute("aria-selected") === "true", "table-selection")
  document.querySelector('[data-edit-project="alpha"]').click()
  await waitFor(() => !document.querySelector('[data-project-editor="alpha"]').hidden, "table-edit")
  const alphaDraft = document.querySelector('[data-project-name-draft="alpha"]')
  alphaDraft.value = "Alpha table"
  alphaDraft.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: "Alpha table" }))
  await new Promise(resolve => setTimeout(resolve, 0))
  document.querySelector("#reverse-projects").click()
  await waitFor(() => document.querySelector("#project-list tbody tr") === beta, "table-reorder")
  if (document.querySelector('[data-project="alpha"]') !== alpha || document.querySelector('[data-project-name-draft="alpha"]') !== alphaDraft || alphaDraft.value !== "Alpha table") throw new Error("table-reorder-identity")
  document.querySelector("#sort-projects").click()
  await waitFor(() => document.querySelector("#project-list tbody tr") === alpha, "table-sort")
  if (document.querySelector('[data-project="beta"]') !== beta || document.querySelector('[data-project-name-draft="alpha"]') !== alphaDraft) throw new Error("table-sort-identity")
  const saveProject = document.querySelector('[data-save-project="alpha"]')
  alphaDraft.focus()
  if (document.activeElement !== alphaDraft || alphaDraft.tabIndex < 0 || saveProject.tabIndex < 0) throw new Error("table-keyboard-access")
  saveProject.focus()
  if (document.activeElement !== saveProject) throw new Error("table-keyboard-focus")
  saveProject.click()
  await waitFor(() => alpha.querySelector('[data-project-editor="alpha"]').hidden, "table-save")
  if (alpha.querySelector("[data-project-name]").textContent !== "Alpha table") throw new Error("table-update")
  document.querySelector("#insert-project").click()
  await waitFor(() => document.querySelector('[data-project="delta"]'), "table-insert")
  const delta = document.querySelector('[data-project="delta"]')
  const deleteTrigger = document.querySelector('[data-delete-project="delta"]')
  const deleteDialog = document.querySelector("[data-delete-project-dialog]")
  deleteTrigger.click()
  await waitFor(() => deleteDialog.open && deleteDialog.matches(":modal"), "dialog-open")
  if (document.activeElement !== document.querySelector("[data-confirm-project-delete]") || !delta.isConnected) throw new Error("dialog-initial-focus")
  document.querySelector("[data-cancel-project-delete]").click()
  await waitFor(() => !deleteDialog.open && document.activeElement === deleteTrigger, "dialog-cancel")
  deleteTrigger.click()
  await waitFor(() => deleteDialog.open, "dialog-reopen")
  deleteDialog.requestClose()
  await waitFor(() => !deleteDialog.open && document.activeElement === deleteTrigger, "dialog-escape")
  deleteTrigger.click()
  await waitFor(() => deleteDialog.open, "dialog-confirm-open")
  document.querySelector("[data-confirm-project-delete]").click()
  await waitFor(() => !document.querySelector('[data-project="delta"]'), "table-delete")
  if (deleteDialog.open || document.activeElement !== document.querySelector("#insert-project") || delta.isConnected || document.querySelector('[data-project="alpha"]') !== alpha || document.querySelector('[data-project="beta"]') !== beta) throw new Error("table-crud-identity")

  document.querySelector("#show-active").click()
  await waitFor(() => !document.querySelector('[data-project="beta"]'), "filter-remove")
  if (output.textContent !== "Active projects") throw new Error("state-command")
  if (document.querySelector('[data-project="alpha"]') !== alpha || beta.isConnected) throw new Error("filter-identity")

  document.querySelector("#show-all").click()
  await waitFor(() => document.querySelector('[data-project="beta"]')?.getAttribute("aria-selected") === "true", "filter-restore")
  const restoredBeta = document.querySelector('[data-project="beta"]')
  if (restoredBeta === beta || !restoredBeta.querySelector('[data-project-editor="beta"]').hidden) throw new Error("filter-row-state-reset")
  let issue = document.querySelector('[data-issue="a1"]')
  const secondIssue = document.querySelector('[data-issue="a2"]')
  document.querySelector('[data-visit-issue="a1"]').click()
  await waitFor(() => issue.querySelector("[data-issue-visits]").textContent === "1", "nested-row-state")
  if (document.body.dataset.selectedIssue !== "a1:Design schema") throw new Error("nested-handler-initial")
  document.querySelector("#update-alpha-issue").click()
  await waitFor(() => issue.querySelector("[data-issue-title]").textContent === "Design schema updated", "nested-update")
  if (document.querySelector('[data-issue="a1"]') !== issue || issue.querySelector("[data-issue-visits]").textContent !== "1") throw new Error("nested-update-identity")
  document.querySelector('[data-visit-issue="a1"]').click()
  await waitFor(() => issue.querySelector("[data-issue-visits]").textContent === "2", "nested-latest-handler")
  if (document.body.dataset.selectedIssue !== "a1:Design schema updated") throw new Error("nested-handler-latest")
  document.querySelector("#reorder-alpha-issues").click()
  await waitFor(() => document.querySelector('[data-issues="alpha"] [data-issue]') === secondIssue, "nested-reorder")
  if (document.querySelector('[data-issue="a1"]') !== issue || document.querySelector('[data-issue="a2"]') !== secondIssue) throw new Error("nested-reorder-identity")
  document.querySelector("#remove-alpha-issue").click()
  await waitFor(() => !document.querySelector('[data-issue="a1"]'), "nested-remove")
  if (issue.isConnected) throw new Error("nested-cleanup")
  document.querySelector("#restore-alpha-issue").click()
  await waitFor(() => document.querySelector('[data-issue="a1"]'), "nested-restore")
  const restoredIssue = document.querySelector('[data-issue="a1"]')
  if (restoredIssue === issue || restoredIssue.querySelector("[data-issue-visits]").textContent !== "0") throw new Error("nested-state-reset")
  issue = restoredIssue
  document.querySelector('[data-visit-issue="a1"]').click()
  await waitFor(() => issue.querySelector("[data-issue-visits]").textContent === "1", "nested-restored-handler")
  if (document.body.dataset.selectedIssue !== "a1:Design schema restored") throw new Error("nested-restored-latest")
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
  await waitFor(() => document.querySelector('[data-notification="project-save-error"]')?.textContent.includes("Project save failed"), "notification-error")
  const notificationRegion = document.querySelector("[data-notifications]")
  const errorNotification = document.querySelector('[data-notification="project-save-error"]')
  counts = await projectCounts()
  if (counts.reads !== 1 || counts.mutations !== 0 || counts.attempts !== 1) throw new Error("mutation-rollback-requests")
  document.querySelector('a[href="/app/projects/alpha"]').click()
  await waitFor(() => document.querySelector("[data-project-detail]"), "detail-navigation")
  const firstDetail = document.querySelector("[data-project-detail]")
  counts = await projectCounts()
  if (document.querySelector("[data-app-layout]") !== layout || document.querySelector("[data-notifications]") !== notificationRegion || document.querySelector('[data-notification="project-save-error"]') !== errorNotification || document.querySelector("[data-workspace]").textContent !== "Secondary" || document.querySelector("[data-route-workspace]").textContent !== "Secondary" || document.querySelector("[data-project-draft]").textContent !== "Clean draft" || counts.reads !== 1 || counts.mutations !== 0 || counts.attempts !== 1) throw new Error("layout-persistence")
  document.querySelector("[data-rename-project]").click()
  await Promise.resolve()
  if (document.querySelector("[data-shared-project-name]").textContent !== "Alpha optimistic" || document.querySelector('[role="alert"]')) throw new Error("mutation-retry-optimistic")
  await waitFor(() => document.querySelector("[data-shared-project-name]").textContent === "Alpha renamed" && document.querySelector("[data-shared-project-revision]").textContent === "1" && document.querySelector('[data-app-layout] [role="status"]')?.textContent === "Project saved", "shared-project-mutation")
  await waitFor(() => document.querySelector('[data-notification="project-save-success"]')?.textContent.includes("Project saved"), "notification-success")
  const successNotification = document.querySelector('[data-notification="project-save-success"]')
  errorNotification.querySelector("button").click()
  await waitFor(() => !errorNotification.isConnected, "notification-dismiss")
  document.querySelector("[data-rename-project]").click()
  await waitFor(() => document.querySelector("[data-shared-project-revision]").textContent === "2", "notification-dedupe-request")
  if (document.querySelectorAll('[data-notification="project-save-success"]').length !== 1) throw new Error("notification-dedupe")
  counts = await projectCounts()
  if (counts.reads !== 1 || counts.mutations !== 2 || counts.attempts !== 3) throw new Error("mutation-requests")
  document.querySelector("[data-edit-draft]").click()
  await waitFor(() => document.querySelector("[data-project-draft]").textContent === "Dirty draft", "draft-edit")
  document.querySelector('a[href="/app/projects"]').click()
  await waitFor(() => document.querySelector("[data-project-list-page]"), "list-navigation")
  if (document.querySelector("[data-notifications]") !== notificationRegion || document.querySelector('[data-notification="project-save-success"]') !== successNotification) throw new Error("notification-route-persistence")
  await waitFor(() => !successNotification.isConnected && !document.querySelector("[data-notification]"), "notification-timeout")
  counts = await projectCounts()
  if (firstDetail.isConnected || document.querySelector("[data-app-layout]") !== layout || document.querySelector("[data-route-workspace]").textContent !== "Secondary" || document.querySelector("[data-shared-project-name]").textContent !== "Alpha renamed" || document.querySelector("[data-shared-project-revision]").textContent !== "2" || counts.reads !== 1 || counts.mutations !== 2 || counts.attempts !== 3) throw new Error("route-release")
  const cleanupBeforeRemoval = document.body.dataset.projectFetchCleanup
  document.querySelector('a[href="/app/projects/alpha"]').click()
  await waitFor(() => document.querySelector("[data-project-detail]"), "detail-revisit")
  await new Promise(resolve => setTimeout(resolve, 300))
  if (document.body.dataset.projectFetchCleanup === cleanupBeforeRemoval || document.querySelector("[data-project-list-page]") || browserErrors.length) throw new Error("fetch-route-release")
  counts = await projectCounts()
  if (document.querySelector("[data-project-detail]") === firstDetail || document.querySelector("[data-project-draft]").textContent !== "Clean draft" || document.querySelector("[data-workspace]").textContent !== "Secondary" || document.querySelector("[data-shared-project-name]").textContent !== "Alpha renamed" || counts.reads !== 1 || counts.mutations !== 2 || counts.attempts !== 3 || counts.listRequests !== 11) throw new Error("route-reset")
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
let project = { id: "alpha", name: "Alpha", revision: 0 }, projectReads = 0, projectMutations = 0, projectMutationAttempts = 0, issueCreateAttempts = 0, issueCreates = 0, draftSaveAttempts = 0, draftSaves = 0, savedDraftVersion = 0, uploadAttempts = 0, uploadCreates = 0, uploadAborts = 0, listRequests = 0, incrementalRequests = 0, incrementalAborts = 0
const incrementalAttempts = new Map()
const routeFailureAttempts = new Map()
const users = { "admin-token": { username: "Ada", isAdmin: true }, "login-admin-token": { username: "Ada", isAdmin: true }, "member-token": { username: "Mina", isAdmin: false } }, revoked = new Set()
http.createServer((request, response) => {
  const url = new URL(request.url, "http://localhost"), pathname = url.pathname
  const token = request.headers.authorization?.replace("Bearer ", "") || "", user = revoked.has(token) ? undefined : users[token]
  if (pathname === "/api/reset-route-failure") {
    routeFailureAttempts.delete(url.searchParams.get("mode"))
    response.end()
    return
  }
  if (pathname === "/api/login") {
    let body = ""
    request.on("data", chunk => { body += chunk })
    request.on("end", () => {
      response.setHeader("content-type", "application/json")
      if (!body.includes("admin%40example.com") && !body.includes("admin@example.com") || !body.includes("admin-password")) {
        response.statusCode = 401
        response.end(JSON.stringify({ error: "invalid credentials" }))
        return
      }
      response.end(JSON.stringify({ token: "login-admin-token" }))
    })
    return
  }
  if (pathname === "/api/session") {
    response.setHeader("content-type", "application/json")
    if (!user) { response.statusCode = 401; response.end(JSON.stringify({ error: "unauthorized" })); return }
    response.end(JSON.stringify(user))
    return
  }
  if (pathname === "/api/logout") {
    if (!user) { response.statusCode = 401; response.end(); return }
    revoked.add(token)
    response.statusCode = 204
    response.end()
    return
  }
  if (pathname === "/api/project/alpha") {
    response.setHeader("content-type", "application/json")
    if (!user) { response.statusCode = 401; response.end(JSON.stringify({ error: "unauthorized" })); return }
    if (request.method === "POST") {
      if (!user.isAdmin) { response.statusCode = 403; response.end(JSON.stringify({ error: "forbidden" })); return }
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
    response.end(JSON.stringify({ reads: projectReads, mutations: projectMutations, attempts: projectMutationAttempts, issueCreateAttempts, issueCreates, draftSaveAttempts, draftSaves, savedDraftVersion, uploadAttempts, uploadCreates, uploadAborts, listRequests, incrementalRequests, incrementalAborts }))
    return
  }
  if (pathname === "/api/projects/alpha/setup-draft" && request.method === "PUT") {
    response.setHeader("content-type", "application/json")
    if (!user) { response.statusCode = 401; response.end(JSON.stringify({ error: "unauthorized" })); return }
    let body = ""
    request.on("data", chunk => { body += chunk })
    request.on("end", () => {
      const draft = JSON.parse(body)
      draftSaveAttempts++
      if (draftSaveAttempts === 3) {
        response.statusCode = 409
        response.end(JSON.stringify({ error: "Draft changed elsewhere." }))
        return
      }
      const finish = () => {
        if (draft.version <= savedDraftVersion) {
          response.statusCode = 409
          response.end(JSON.stringify({ error: "Stale draft save rejected." }))
          return
        }
        savedDraftVersion = draft.version
        draftSaves++
        response.end(JSON.stringify({ version: savedDraftVersion }))
      }
      if (draftSaveAttempts === 1) setTimeout(finish, 600)
      else setTimeout(finish, 25)
    })
    return
  }
  if (pathname === "/api/projects/alpha/attachments" && request.method === "POST") {
    response.setHeader("content-type", "application/json")
    if (!user) { response.statusCode = 401; response.end(JSON.stringify({ error: "unauthorized" })); return }
    const chunks = []
    request.on("data", chunk => { chunks.push(chunk) })
    request.on("end", () => {
      uploadAttempts++
      const body = Buffer.concat(chunks).toString("utf8")
      const valid = body.includes('filename="release.txt"') && body.includes("Content-Type: text/plain") && body.includes("Release attachment")
      response.on("close", () => { if (!response.writableEnded) uploadAborts++ })
      const finish = () => {
        if (response.destroyed) return
        if (!valid) { response.statusCode = 400; response.end(JSON.stringify({ error: "Invalid attachment." })); return }
        if (uploadAttempts === 2) { response.statusCode = 503; response.end(JSON.stringify({ error: "Attachment service unavailable." })); return }
        uploadCreates++
        response.statusCode = 201
        response.end(JSON.stringify({ attachment: { id: "attachment-1", name: "release.txt", size: 18 } }))
      }
      if (uploadAttempts === 1 || uploadAttempts === 4) setTimeout(finish, 1000)
      else setTimeout(finish, 100)
    })
    return
  }
  if (pathname === "/api/projects/alpha/issues" && request.method === "POST") {
    response.setHeader("content-type", "application/json")
    if (!user) { response.statusCode = 401; response.end(JSON.stringify({ error: "unauthorized" })); return }
    let body = ""
    request.on("data", chunk => { body += chunk })
    request.on("end", () => {
      issueCreateAttempts++
      const valid = body.includes('name="title"') && body.includes("Release blocker") && body.includes('name="body"') && body.includes("Retain this detailed reproduction") && body.includes('name="assignee"') && body.includes("Ada") && body.includes('name="checklist"') && body.includes("Verify rollback")
      setTimeout(() => {
        if (!valid) { response.statusCode = 400; response.end(JSON.stringify({ error: "invalid issue" })); return }
        if (issueCreateAttempts === 1) { response.statusCode = 422; response.end(JSON.stringify({ errors: { title: "Use a more specific title." } })); return }
        if (issueCreateAttempts === 2) { response.statusCode = 503; response.end(JSON.stringify({ error: "Issue service unavailable." })); return }
        issueCreates++
        response.statusCode = 201
        response.end(JSON.stringify({ id: "a3", title: "Release blocker fixed" }))
      }, 100)
    })
    return
  }
  if (pathname === "/api/projects") {
    const requestNumber = Number(url.searchParams.get("request"))
    const page = Number(url.searchParams.get("page")) || 1
    const filter = url.searchParams.get("filter") || "all"
    listRequests++
    response.setHeader("content-type", "application/json")
    if (!user) { response.statusCode = 401; response.end(JSON.stringify({ error: "unauthorized" })); return }
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
  if (pathname === "/api/projects/incremental") {
    const cursor = Number(url.searchParams.get("cursor"))
    const attempt = (incrementalAttempts.get(cursor) || 0) + 1
    incrementalAttempts.set(cursor, attempt)
    incrementalRequests++
    response.setHeader("content-type", "application/json")
    if (!user) { response.statusCode = 401; response.end(JSON.stringify({ error: "unauthorized" })); return }
    response.on("close", () => { if (!response.writableEnded) incrementalAborts++ })
    setTimeout(() => {
      if (response.destroyed) return
      if (cursor === 1 && attempt === 1) { response.statusCode = 503; response.end(JSON.stringify({ error: "unavailable" })); return }
      if (cursor === 0) {
        response.end(JSON.stringify({ projects: [
          { id: "beta", name: "Beta duplicate", status: "archived", issues: [] },
          { id: "gamma", name: "Gamma", status: "active", issues: [{ id: "g1", title: "Incremental result" }] }
        ], nextCursor: 1 }))
        return
      }
      response.end(JSON.stringify({ projects: [
        { id: "delta", name: "Delta", status: "active", issues: [] },
        { id: "epsilon", name: "Epsilon", status: "archived", issues: [] }
      ], nextCursor: null }))
    }, 250)
    return
  }
  const segments = pathname.split("/").filter(Boolean)
  const rewrite = rewrites.find(entry => entry.segments.length === segments.length && entry.segments.every((segment, index) => segment.literal === undefined || segment.literal === segments[index]))
  const relative = pathname === "/" ? "index.html" : pathname.slice(1)
  const direct = path.join(root, relative.endsWith("/") || !path.extname(relative) ? relative + (relative.endsWith("/") ? "" : "/") + "index.html" : relative)
  const file = fs.existsSync(direct) || !rewrite ? direct : path.join(root, rewrite.file)
  const routeFailure = url.searchParams.get("route-failure")
  if (pathname === "/app/projects/alpha" && routeFailure) {
    const attempt = (routeFailureAttempts.get(routeFailure) || 0) + 1
    routeFailureAttempts.set(routeFailure, attempt)
    if (attempt === 1 && routeFailure !== "network") {
      let html = fs.readFileSync(file, "utf8")
      if (routeFailure === "invalid") html = html.replace(/data-k-application="[^"]+"/, 'data-k-application="invalid"')
      else if (routeFailure === "module") html = html.replace("</head>", '<script type="module" data-k-capability src="/missing-navigation.js"></script></head>')
      else if (routeFailure === "style") html = html.replace("</head>", '<link data-k-route-style rel="stylesheet" href="/missing-navigation.css"></head>')
      response.setHeader("content-type", "text/html")
      response.end(html)
      return
    }
  }
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  const initialProfile = await mkdtemp(new URL(".chrome-", fixture))
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--enable-logging=stderr", `--user-data-dir=${initialProfile}`, "--virtual-time-budget=12000", "--dump-dom", `http://127.0.0.1:${port}/app/projects`], { encoding: "utf8", timeout: 30_000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-browser-test="pass"/, browser.stdout.match(/data-browser-test="[^"]+"/)?.[0] ?? browser.stderr)
    const cleanup = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=5000", "--dump-dom", `http://127.0.0.1:${port}/app/projects?infinite-cleanup=1`], { encoding: "utf8", timeout: 20_000 })
    assert.equal(cleanup.status, 0, cleanup.stderr)
    assert.match(cleanup.stdout, /data-infinite-cleanup-test="pass"/, cleanup.stderr)
    const dialogCleanup = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=5000", "--dump-dom", `http://127.0.0.1:${port}/app/projects?dialog-cleanup=1`], { encoding: "utf8", timeout: 20_000 })
    assert.equal(dialogCleanup.status, 0, dialogCleanup.stderr)
    assert.match(dialogCleanup.stdout, /data-dialog-cleanup-test="pass"/, dialogCleanup.stderr)
    const history = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=5000", "--dump-dom", `http://127.0.0.1:${port}/app/projects?history=1`], { encoding: "utf8", timeout: 20_000 })
    assert.equal(history.status, 0, history.stderr)
    assert.match(history.stdout, /data-navigation-test="pass"/, history.stderr)
    for (const mode of ["network", "body", "invalid", "module", "style"]) {
      const runFailure = () => spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=20000", "--dump-dom", `http://127.0.0.1:${port}/app/projects?route-failure=${mode}`], { encoding: "utf8", timeout: 40_000 })
      let failure
      for (let attempt = 0; attempt < 3; attempt++) {
        failure = runFailure()
        if (!failure.stdout.includes('data-browser-test="fail-initial-loading"')) break
        await fetch(`http://127.0.0.1:${port}/api/reset-route-failure?mode=${mode}`)
      }
      assert.equal(failure.status, 0, failure.stderr)
      if (mode === "network" || mode === "body") assert.match(failure.stdout, /data-route-failure-test="pass"/, failure.stderr)
      else assert.match(failure.stdout, new RegExp(`data-route-failure-fallback="${mode}"`), failure.stderr)
    }
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
    const runLogin = () => spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=20000", "--dump-dom", `http://127.0.0.1:${port}/login?auth-login=1`], { encoding: "utf8", timeout: 40_000 })
    let login = runLogin()
    if (login.stdout.includes('data-browser-test="fail-auth-valid-login"')) login = runLogin()
    assert.equal(login.status, 0, login.stderr)
    assert.match(login.stdout, /data-auth-test="pass"/, login.stderr)
    const member = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/app/projects?auth=member`], { encoding: "utf8", timeout: 15_000 })
    assert.equal(member.status, 0, member.stderr)
    assert.match(member.stdout, /data-member-test="pass"/, member.stderr)
    for (const mode of ["anonymous", "rejected"]) {
      const auth = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/app/projects?auth=${mode}`], { encoding: "utf8", timeout: 15_000 })
      assert.equal(auth.status, 0, auth.stderr)
      assert.match(auth.stdout, new RegExp(`data-auth-direct-test="${mode}"`), auth.stderr)
    }
    for (const mode of ["valid", "malformed", "invalid-schema", "wrong-version", "empty"]) {
      const storage = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/app/projects?storage=${mode}`], { encoding: "utf8", timeout: 15_000 })
      assert.equal(storage.status, 0, storage.stderr)
      assert.match(storage.stdout, new RegExp(`data-storage-test="${mode}"`), storage.stderr)
    }
    await runIssueFormJourney(chrome, port)
  } finally {
    server.kill()
    await rm(initialProfile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
  }
}

async function runIssueFormJourney(chrome, applicationPort) {
  const profile = await mkdtemp(new URL(".chrome-", fixture))
  const debuggingPort = await availablePort()
  const url = `http://127.0.0.1:${applicationPort}/app/projects/alpha?issue-form=1`
  const browser = spawn(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--disable-background-networking", `--user-data-dir=${profile}`, `--remote-debugging-port=${debuggingPort}`, url], { stdio: "ignore" })
  let socket
  try {
    let target
    for (let attempt = 0; attempt < 200 && !target; attempt++) {
      try {
        const targets = await fetch(`http://127.0.0.1:${debuggingPort}/json/list`).then(response => response.json())
        target = targets.find(entry => entry.type === "page" && entry.url === url)
      } catch {}
      if (!target) await new Promise(resolve => setTimeout(resolve, 25))
    }
    if (!target) throw new Error("Issue form Chrome target did not start")
    socket = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true })
      socket.addEventListener("error", reject, { once: true })
    })
    await new Promise(resolve => setTimeout(resolve, 500))
    let nextId = 0
    const pending = new Map()
    socket.addEventListener("message", event => {
      const message = JSON.parse(event.data)
      const request = pending.get(message.id)
      if (!request) return
      pending.delete(message.id)
      if (message.error) request.reject(new Error(JSON.stringify(message.error)))
      else request.resolve(message.result)
    })
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++nextId
      pending.set(id, { resolve, reject })
      socket.send(JSON.stringify({ id, method, params }))
    })
    const evaluate = async expression => {
      const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text)
      return result.result.value
    }
    const enter = async () => {
      await send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 })
      await send("Input.dispatchKeyEvent", { type: "char", key: "Enter", code: "Enter", text: "\r", unmodifiedText: "\r", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 })
      await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 })
    }
    const escape = async () => {
      await send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 })
      await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 })
    }
    const click = async selector => {
      const { x, y } = await evaluate(`(() => { const rect = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } })()`)
      await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 })
      await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 })
    }
    const insert = text => send("Input.insertText", { text })
    const waitFor = (expression, timeout = 5000) => evaluate(`new Promise((resolve, reject) => { const started = Date.now(); const check = () => { if (${expression}) resolve(true); else if (Date.now() - started > ${timeout}) reject(new Error(${JSON.stringify(expression)})); else setTimeout(check, 10) }; check() })`)
    const chooseFile = (name, type, contents) => evaluate(`(() => { const transfer = new DataTransfer(); transfer.items.add(new File([${JSON.stringify(contents)}], ${JSON.stringify(name)}, { type: ${JSON.stringify(type)} })); const input = document.querySelector("#project-attachment"); input.files = transfer.files; input.dispatchEvent(new Event("change", { bubbles: true })) })()`)
    const waitForUploadAttempts = attempts => evaluate(`new Promise((resolve, reject) => { const started = Date.now(); const check = async () => { const counts = await fetch("/api/project-counts").then(response => response.json()); if (counts.uploadAttempts === ${attempts}) resolve(true); else if (Date.now() - started > 5000) reject(new Error("upload-attempt-${attempts}")); else setTimeout(check, 10) }; check() })`)
    const waitForUploadAborts = aborts => evaluate(`new Promise((resolve, reject) => { const started = Date.now(); const check = async () => { const counts = await fetch("/api/project-counts").then(response => response.json()); if (counts.uploadAborts === ${aborts}) resolve(true); else if (Date.now() - started > 5000) reject(new Error("upload-abort-${aborts}")); else setTimeout(check, 10) }; check() })`)

    await waitFor('document.querySelector("[data-setup-draft]") && document.querySelector("[data-issue-form]") && document.querySelector("[data-session-status]")?.textContent === "authenticated"')
    assert.deepEqual(await evaluate('({ step: document.querySelector("[data-setup-draft]").dataset.setupStep, name: document.querySelector("#setup-name").value, status: document.querySelector("[data-setup-status]").textContent, savedVersion: document.querySelector("[data-saved-setup-version]").textContent })'), { step: "1", name: "", status: "idle", savedVersion: "0" })
    await evaluate('document.querySelector("[data-setup-next]").click()')
    await new Promise(resolve => setTimeout(resolve, 50))
    assert.deepEqual(await evaluate('({ step: document.querySelector("[data-setup-draft]").dataset.setupStep, missing: document.querySelector("#setup-name").validity.valueMissing, focused: document.activeElement === document.querySelector("#setup-name") })'), { step: "1", missing: true, focused: true })
    await insert("Migration setup")
    await evaluate('document.querySelector("[data-setup-next]").click()')
    await waitFor('document.querySelector("[data-setup-draft]").dataset.setupStep === "2"')
    await evaluate('document.querySelector("#setup-summary").focus()')
    await insert("First autosave summary")
    await waitFor('document.querySelector("[data-setup-status]").textContent === "saving"')
    await evaluate('document.querySelector("#setup-summary").select()')
    await insert("Current autosave summary")
    await waitFor('document.querySelector("[data-setup-status]").textContent === "saved" && document.querySelector("[data-saved-setup-version]").textContent === "3"', 15000)
    await new Promise(resolve => setTimeout(resolve, 700))
    assert.deepEqual(await evaluate(`(async () => { const counts = await fetch("/api/project-counts").then(response => response.json()); return { attempts: counts.draftSaveAttempts, saves: counts.draftSaves, serverVersion: counts.savedDraftVersion, status: document.querySelector("[data-setup-status]").textContent, savedVersion: document.querySelector("[data-saved-setup-version]").textContent, error: Boolean(document.querySelector("[data-setup-error]")), summary: document.querySelector("#setup-summary").value } })()`), { attempts: 2, saves: 1, serverVersion: 3, status: "saved", savedVersion: "3", error: false, summary: "Current autosave summary" })

    await evaluate('document.querySelector("#setup-summary").select()')
    await insert("Navigation-safe summary")
    await waitFor('JSON.parse(localStorage.getItem("kudzu-alpha-setup-draft")).summary === "Navigation-safe summary"')
    await evaluate('document.querySelector(`a[href="/app/projects"]`).click()')
    await waitFor('document.querySelector("[data-project-list-page]")')
    await waitFor('document.querySelectorAll("[data-project-actions-popover]").length === 2')
    assert.deepEqual(await evaluate(`(() => { const triggers = [...document.querySelectorAll("[data-project-actions]")]; const popovers = [...document.querySelectorAll("[data-project-actions-popover]")]; return { unique: new Set(popovers.map(node => node.id)).size, linked: triggers.every((node, index) => node.popoverTargetElement === popovers[index]), unresolved: popovers.some(node => node.id.includes("$k")) } })()`), { unique: 2, linked: true, unresolved: false })
    await evaluate('document.querySelector(`[data-project-actions="alpha"]`).focus(); document.querySelector(`[data-project-actions="alpha"]`).click()')
    await waitFor('document.querySelector(`[data-project-actions-popover="alpha"]`).matches(":popover-open")')
    await escape()
    await waitFor('!document.querySelector(`[data-project-actions-popover="alpha"]`).matches(":popover-open")')
    assert.equal(await evaluate('document.activeElement === document.querySelector(`[data-project-actions="alpha"]`)'), true)
    await evaluate('document.querySelector(`[data-project-actions="alpha"]`).click()')
    await waitFor('document.querySelector(`[data-project-actions-popover="alpha"]`).matches(":popover-open")')
    await click("#unrelated-control")
    await waitFor('!document.querySelector(`[data-project-actions-popover="alpha"]`).matches(":popover-open")')
    const alphaId = await evaluate('document.querySelector(`[data-project-actions-popover="alpha"]`).id')
    await evaluate('window.__kPopoverRow = document.querySelector(`[data-project="alpha"]`); document.querySelector("#reverse-projects").click()')
    await waitFor('document.querySelector("#project-list tbody tr")?.dataset.project === "beta"')
    assert.deepEqual(await evaluate(`({ retained: document.querySelector('[data-project="alpha"]') === window.__kPopoverRow, id: document.querySelector('[data-project-actions-popover="alpha"]').id })`), { retained: true, id: alphaId })
    await evaluate('document.querySelector("#show-active").click()')
    await waitFor('!document.querySelector(`[data-project="beta"]`)')
    await evaluate('document.querySelector("#show-all").click()')
    await waitFor('document.querySelector(`[data-project="beta"]`)')
    assert.equal(await evaluate('new Set([...document.querySelectorAll("[data-project-actions-popover]")].map(node => node.id)).size === document.querySelectorAll("[data-project-actions-popover]").length'), true)
    await evaluate('window.__kOldPopover = document.querySelector(`[data-project-actions-popover="alpha"]`); window.__kOldPopover.showPopover(); window.__kOldPopover.querySelector(`a[href="/app/projects/alpha"]`).click()')
    await waitFor('document.querySelector("#setup-summary")?.value === "Navigation-safe summary"')
    assert.equal(await evaluate('!window.__kOldPopover.isConnected && !window.__kOldPopover.matches(":popover-open")'), true)
    assert.equal(await evaluate('document.querySelector("[data-setup-draft]").dataset.setupStep'), "2")
    await evaluate('location.reload()')
    await new Promise(resolve => setTimeout(resolve, 500))
    await waitFor('document.querySelector("#setup-summary")?.value === "Navigation-safe summary" && document.querySelector("[data-session-status]")?.textContent === "authenticated"')
    await evaluate('document.querySelector("#setup-summary").select()')
    await insert("Conflict-safe summary")
    await waitFor('document.querySelector("[data-setup-status]").textContent === "conflict"')
    assert.deepEqual(await evaluate('({ error: document.querySelector("[data-setup-error]").textContent, summary: document.querySelector("#setup-summary").value, stored: JSON.parse(localStorage.getItem("kudzu-alpha-setup-draft")).summary })'), { error: "Draft changed elsewhere.", summary: "Conflict-safe summary", stored: "Conflict-safe summary" })
    await evaluate('document.querySelector("[data-reset-setup]").click()')
    await waitFor('document.querySelector("[data-setup-draft]").dataset.setupStep === "1"')
    assert.deepEqual(await evaluate('({ name: document.querySelector("#setup-name").value, stored: localStorage.getItem("kudzu-alpha-setup-draft"), status: document.querySelector("[data-setup-status]").textContent, error: Boolean(document.querySelector("[data-setup-error]")), savedVersion: document.querySelector("[data-saved-setup-version]").textContent })'), { name: "", stored: null, status: "idle", error: false, savedVersion: "0" })

    assert.deepEqual(await evaluate('({ status: document.querySelector("[data-upload-status]").textContent, boundary: document.querySelector("[data-upload-progress-boundary]").textContent, progress: Boolean(document.querySelector("progress")), attachments: document.querySelectorAll("[data-attachment]").length })'), { status: "idle", boundary: "Upload progress is unavailable with fetch.", progress: false, attachments: 0 })
    await chooseFile("bad.json", "application/json", "{}")
    await waitFor('document.querySelector("[data-upload-status]").textContent === "invalid"')
    assert.deepEqual(await evaluate('({ error: document.querySelector("[data-upload-error]").textContent, disabled: document.querySelector("[data-upload-attachment]").disabled })'), { error: "Choose a plain text file.", disabled: true })
    await chooseFile("large.txt", "text/plain", "x".repeat(1025))
    await waitFor('document.querySelector("[data-upload-error]").textContent === "Attachment must be 1 KiB or smaller."')
    assert.equal(await evaluate('fetch("/api/project-counts").then(response => response.json()).then(counts => counts.uploadAttempts)'), 0)
    await chooseFile("release.txt", "text/plain", "Release attachment")
    await waitFor('document.querySelector("[data-upload-status]").textContent === "selected"')
    assert.deepEqual(await evaluate('({ name: document.querySelector("[data-selected-attachment]").textContent, size: document.querySelector("[data-selected-attachment-size]").textContent })'), { name: "release.txt", size: "18" })
    await evaluate('document.querySelector("[data-upload-attachment]").click()')
    await waitForUploadAttempts(1)
    await evaluate('document.querySelector("[data-cancel-upload]").click()')
    await waitFor('document.querySelector("[data-upload-status]").textContent === "cancelled"')
    await waitForUploadAborts(1)
    await evaluate('document.querySelector("[data-upload-attachment]").click()')
    await waitFor('document.querySelector("[data-upload-status]").textContent === "error"')
    assert.deepEqual(await evaluate('({ error: document.querySelector("[data-upload-error]").textContent, name: document.querySelector("[data-selected-attachment]").textContent })'), { error: "Attachment service unavailable.", name: "release.txt" })
    await evaluate('document.querySelector("[data-retry-upload]").click()')
    await waitFor('document.querySelector("[data-attachment=attachment-1]")')
    assert.deepEqual(await evaluate(`(async () => { const counts = await fetch("/api/project-counts").then(response => response.json()); return { attempts: counts.uploadAttempts, creates: counts.uploadCreates, status: document.querySelector("[data-upload-status]").textContent, attachment: document.querySelector("[data-attachment=attachment-1]").textContent } })()`), { attempts: 3, creates: 1, status: "success", attachment: "release.txt (18 bytes)" })
    await evaluate('document.querySelector("[data-upload-attachment]").click()')
    await waitForUploadAttempts(4)
    await evaluate('document.querySelector(`a[href="/app/projects"]`).click()')
    await waitFor('document.querySelector("[data-project-list-page]")')
    await waitForUploadAborts(2)
    await evaluate('document.querySelector(`a[href="/app/projects/alpha"]`).click()')
    await waitFor('document.querySelector("[data-attachment-upload]")')
    assert.deepEqual(await evaluate('({ status: document.querySelector("[data-upload-status]").textContent, attachments: document.querySelectorAll("[data-attachment]").length })'), { status: "idle", attachments: 0 })

    assert.deepEqual(await evaluate('({ dirty: document.querySelector("[data-form-dirty]").textContent, titleTouched: document.querySelector("[data-title-touched]").textContent, bodyTouched: document.querySelector("[data-body-touched]").textContent, assignee: Boolean(document.querySelector("[data-assignee-fields]")), rows: document.querySelectorAll("[data-checklist-row]").length, checklistTouched: document.querySelector("[data-checklist-touched]").textContent })'), { dirty: "clean", titleTouched: "untouched", bodyTouched: "untouched", assignee: false, rows: 1, checklistTouched: "untouched" })

    await evaluate('document.querySelector("#issue-title").focus()')
    await insert("Draft issue")
    await evaluate('document.querySelector("#issue-body").focus()')
    await insert("Draft issue body long enough")
    await evaluate('document.querySelector("[data-assignee-enabled]").click()')
    await waitFor('document.querySelector("[data-assignee-fields]")')
    await evaluate('document.querySelector("#issue-assignee").focus()')
    await insert("Ada")
    await evaluate('document.querySelector("#checklist-check-1").focus()')
    await insert("First step")
    await evaluate('document.querySelector("[data-add-checklist]").focus(); document.querySelector("[data-add-checklist]").click(); document.querySelector("[data-add-checklist]").click()')
    await waitFor('document.querySelectorAll("[data-checklist-row]").length === 3')
    await evaluate('globalThis.__check1 = document.querySelector("[data-checklist-row=check-1]"); globalThis.__check2 = document.querySelector("[data-checklist-row=check-2]"); globalThis.__check3 = document.querySelector("[data-checklist-row=check-3]")')
    await evaluate('document.querySelector("#checklist-check-2").focus()')
    await insert("Second step")
    await evaluate('document.querySelector("[data-reorder-checklist]").focus(); document.querySelector("[data-reorder-checklist]").click()')
    await waitFor('document.querySelector("[data-checklist-row]")?.dataset.checklistRow === "check-3"')
    assert.deepEqual(await evaluate('({ dirty: document.querySelector("[data-form-dirty]").textContent, titleTouched: document.querySelector("[data-title-touched]").textContent, bodyTouched: document.querySelector("[data-body-touched]").textContent, assigneeTouched: document.querySelector("[data-assignee-touched]").textContent, firstTouched: __check1.querySelector("[data-checklist-touched]").textContent, secondTouched: __check2.querySelector("[data-checklist-touched]").textContent, retained: __check1 === document.querySelector("[data-checklist-row=check-1]") && __check2 === document.querySelector("[data-checklist-row=check-2]") && __check3 === document.querySelector("[data-checklist-row=check-3]"), order: [...document.querySelectorAll("[data-checklist-row]")].map(row => row.dataset.checklistRow).join(",") })'), { dirty: "dirty", titleTouched: "touched", bodyTouched: "touched", assigneeTouched: "touched", firstTouched: "touched", secondTouched: "touched", retained: true, order: "check-3,check-2,check-1" })
    await evaluate('document.querySelector("[data-remove-checklist=check-2]").click()')
    await waitFor('document.querySelectorAll("[data-checklist-row]").length === 2')
    assert.equal(await evaluate('!__check2.isConnected && __check1.isConnected && __check3.isConnected'), true)
    await evaluate('document.querySelector("[data-reset-issue]").click()')
    await waitFor('document.querySelectorAll("[data-checklist-row]").length === 1 && !document.querySelector("[data-assignee-fields]")')
    assert.deepEqual(await evaluate('({ dirty: document.querySelector("[data-form-dirty]").textContent, titleTouched: document.querySelector("[data-title-touched]").textContent, bodyTouched: document.querySelector("[data-body-touched]").textContent, title: document.querySelector("#issue-title").value, body: document.querySelector("#issue-body").value, retainedOriginal: __check1 === document.querySelector("[data-checklist-row=check-1]"), releasedAdded: !__check2.isConnected && !__check3.isConnected, checklist: document.querySelector("#checklist-check-1").value, checklistTouched: document.querySelector("[data-checklist-touched]").textContent })'), { dirty: "clean", titleTouched: "untouched", bodyTouched: "untouched", title: "", body: "", retainedOriginal: true, releasedAdded: true, checklist: "", checklistTouched: "untouched" })

    await evaluate('document.querySelector("#issue-title").focus()')
    await enter()
    await new Promise(resolve => setTimeout(resolve, 50))
    assert.deepEqual(await evaluate(`(async () => { const counts = await fetch("/api/project-counts").then(response => response.json()), title = document.querySelector("#issue-title"); return { attempts: counts.issueCreateAttempts, missing: title.validity.valueMissing, focused: document.activeElement === title } })()`), { attempts: 0, missing: true, focused: true })

    await insert("Bug")
    await enter()
    await new Promise(resolve => setTimeout(resolve, 50))
    assert.deepEqual(await evaluate(`(async () => { const counts = await fetch("/api/project-counts").then(response => response.json()), title = document.querySelector("#issue-title"); return { attempts: counts.issueCreateAttempts, short: title.validity.tooShort, focused: document.activeElement === title } })()`), { attempts: 0, short: true, focused: true })

    await evaluate('document.querySelector("#issue-title").select()')
    await insert("Release blocker")
    await evaluate('document.querySelector("#issue-body").value = "Retain this detailed reproduction"; document.querySelector("[data-assignee-enabled]").click()')
    await waitFor('document.querySelector("#issue-assignee")')
    await evaluate('document.querySelector("#issue-assignee").focus()')
    await insert("Ada")
    await evaluate('document.querySelector("#checklist-check-1").focus()')
    await insert("Verify rollback")
    await evaluate('document.querySelector("#issue-title").focus()')
    await enter()
    await waitFor('document.querySelector("#issue-submit").disabled && document.querySelector("#issue-submit").textContent === "Creating issue"')
    assert.deepEqual(await evaluate('({ disabled: document.querySelector("#issue-submit").disabled, label: document.querySelector("#issue-submit").textContent })'), { disabled: true, label: "Creating issue" })
    await waitFor('document.querySelector("#issue-title-error")')
    assert.deepEqual(await evaluate(`(async () => { const counts = await fetch("/api/project-counts").then(response => response.json()), title = document.querySelector("#issue-title"); return { attempts: counts.issueCreateAttempts, creates: counts.issueCreates, error: document.querySelector("#issue-title-error").textContent, invalid: title.getAttribute("aria-invalid"), describedBy: title.getAttribute("aria-describedby"), focused: document.activeElement === title, title: title.value, body: document.querySelector("#issue-body").value, assignee: document.querySelector("#issue-assignee").value, checklist: document.querySelector("#checklist-check-1").value } })()`), { attempts: 1, creates: 0, error: "Use a more specific title.", invalid: "true", describedBy: "issue-title-error", focused: true, title: "Release blocker", body: "Retain this detailed reproduction", assignee: "Ada", checklist: "Verify rollback" })

    await evaluate('document.querySelector("#issue-title").select()')
    await insert("Release blocker fixed")
    await enter()
    await waitFor('document.querySelector("#issue-form-error")')
    assert.deepEqual(await evaluate(`(async () => { const counts = await fetch("/api/project-counts").then(response => response.json()), title = document.querySelector("#issue-title"); return { attempts: counts.issueCreateAttempts, creates: counts.issueCreates, error: document.querySelector("#issue-form-error").textContent, fieldError: Boolean(document.querySelector("#issue-title-error")), invalid: title.getAttribute("aria-invalid"), describedBy: title.getAttribute("aria-describedby"), title: title.value, body: document.querySelector("#issue-body").value } })()`), { attempts: 2, creates: 0, error: "Issue service unavailable.", fieldError: false, invalid: "false", describedBy: null, title: "Release blocker fixed", body: "Retain this detailed reproduction" })

    await enter()
    await waitFor('document.querySelector("#issue-success")')
    assert.deepEqual(await evaluate(`(async () => { const counts = await fetch("/api/project-counts").then(response => response.json()); return { attempts: counts.issueCreateAttempts, creates: counts.issueCreates, success: document.querySelector("#issue-success").textContent, fieldError: Boolean(document.querySelector("#issue-title-error")), formError: Boolean(document.querySelector("#issue-form-error")), title: document.querySelector("#issue-title").value, body: document.querySelector("#issue-body").value } })()`), { attempts: 3, creates: 1, success: "Issue created.", fieldError: false, formError: false, title: "Release blocker fixed", body: "Retain this detailed reproduction" })
  } finally {
    socket?.close()
    browser.kill()
    if (browser.exitCode === null) await Promise.race([
      new Promise(resolve => browser.once("exit", resolve)),
      new Promise(resolve => setTimeout(resolve, 2000))
    ])
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
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
      "/login": routeBytes("/login"),
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
