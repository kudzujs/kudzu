import { spawn } from "node:child_process"
import { createHash } from "node:crypto"
import { createServer } from "node:http"
import { access, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises"
import { constants } from "node:fs"
import { arch, cpus, platform, release, tmpdir } from "node:os"
import { dirname, extname, join, relative, resolve, sep } from "node:path"
import { performance } from "node:perf_hooks"
import { fileURLToPath, pathToFileURL } from "node:url"
import { gzipSync } from "node:zlib"

const workspace = dirname(fileURLToPath(import.meta.url))
const root = resolve(workspace, "../..")
const dependencies = join(root, "benchmarks/commerce/frameworks/node_modules")
const resultsDirectory = join(workspace, "results")
const check = process.argv.length === 3 && process.argv[2] === "--check"
if (process.argv.length > (check ? 3 : 2)) throw new Error(`Usage: node ${relative(process.cwd(), fileURLToPath(import.meta.url))} [--check]`)
const browserProfiles = check ? 1 : Number(process.env.BENCHMARK_PROFILES ?? 7)
if (!Number.isSafeInteger(browserProfiles) || browserProfiles < 1) throw new Error("BENCHMARK_PROFILES must be a positive integer")

const targets = [
  { id: "kudzu", label: "Kudzu current", architecture: "pre-rendered HTML with route capabilities", root: join(workspace, "kudzu"), dist: join(workspace, "kudzu/dist") },
  { id: "react", label: "React", architecture: "client-side VDOM", root: join(workspace, "react"), dist: join(workspace, "react/dist") },
  { id: "vue", label: "Vue", architecture: "client-side reactive renderer", root: join(workspace, "vue"), dist: join(workspace, "vue/dist") },
  { id: "svelte", label: "Svelte", architecture: "client-side compiled renderer", root: join(workspace, "svelte"), dist: join(workspace, "svelte/dist") },
  { id: "astro", label: "Astro + React", architecture: "pre-rendered HTML with a hydrated React island", root: join(workspace, "astro"), dist: join(workspace, "astro/dist") },
]
const operationNames = ["scalarCommit", "secondCommit", "objectReplace", "childState", "conditionalUnmount", "conditionalMount", "rowLocalState", "rowUpdate", "rowFilter", "rowRestore", "rowReverse", "rowRemove", "rowAppend", "rowReaddedState", "svgKeyboard", "searchReduce", "searchRestore", "effectUpdateCleanup", "asyncHandler"]

await requireFiles()
const started = performance.now()
const buildSamples = Object.fromEntries(targets.map(target => [target.id, []]))
if (!check) for (const target of targets) await build(target, false)
for (let round = 0; round < (check ? 1 : 7); round++) {
  for (const target of rotate(targets, round)) buildSamples[target.id].push(await build(target, true))
}
await validateStaticArtifacts()
const browser = await measureBrowsers(browserProfiles)
const versions = await frameworkVersions()
for (const target of targets) target.label += target.id === "kudzu" ? ` ${versions.kudzu}` : ` ${versions[target.id]}`
const report = {
  schemaVersion: 2,
  mode: check ? "check" : "measure",
  command: `${browserProfiles === 7 || check ? "" : `BENCHMARK_PROFILES=${browserProfiles} `}node benchmarks/runtime-matrix/run.mjs${check ? " --check" : ""}`,
  warmupBuildsPerTarget: check ? 0 : 1,
  measuredBuildsPerTarget: check ? 1 : 7,
  measuredBrowserProfilesPerTarget: browserProfiles,
  operationTiming: "In-page click-to-observed-complete timing; layout forced before resolve; validation outside each timed interval.",
  durationMilliseconds: round(performance.now() - started),
  versions,
  checkout: await gitState(),
  environment: browser.environment,
  targets: Object.fromEntries(targets.map(target => [target.id, {
    label: target.label,
    architecture: target.architecture,
    build: summarizeBuilds(buildSamples[target.id]),
    buildMilliseconds: summarize(buildSamples[target.id].map(sample => sample.milliseconds)),
    artifacts: buildSamples[target.id].at(-1).output,
    browser: summarizeBrowser(browser.samples[target.id]),
  }])),
}
await mkdir(resultsDirectory, { recursive: true })
await writeFile(join(resultsDirectory, "raw.json"), `${JSON.stringify(report, null, 2)}\n`)
await writeFile(join(resultsDirectory, "report.md"), markdown(report))
console.log(`Runtime matrix ${report.mode} passed for ${targets.length} targets in ${(report.durationMilliseconds / 1000).toFixed(1)} s`)
console.log(`Results: ${relative(root, join(resultsDirectory, "raw.json"))}, ${relative(root, join(resultsDirectory, "report.md"))}`)

async function requireFiles() {
  for (const path of ["react", "react-dom", "vue", "svelte", "vite", "@sveltejs/vite-plugin-svelte", "@vitejs/plugin-vue"].map(name => join(dependencies, name, "package.json")).concat(join(root, "bin/kudzu.mjs"))) await access(path, constants.R_OK)
}

async function build(target, measured) {
  await rm(target.dist, { recursive: true, force: true })
  if (target.id === "kudzu") await rm(join(target.root, ".kudzu"), { recursive: true, force: true })
  const invocation = target.id === "kudzu"
    ? [process.execPath, [join(root, "bin/kudzu.mjs"), "build"], target.root]
    : target.id === "astro"
      ? [join(target.root, "node_modules/.bin/astro"), ["build", "--root", target.root], workspace]
      : [process.execPath, [join(workspace, "build-vite.mjs"), target.id], workspace]
  const began = performance.now()
  const peakRssBytes = measured ? await timedRun(...invocation) : (await run(...invocation), null)
  const milliseconds = round(performance.now() - began)
  return measured ? { milliseconds, peakRssBytes, output: await measureArtifacts(target.dist) } : null
}

async function measureArtifacts(directory) {
  const groups = { html: { files: 0, raw: 0, gzip: 0 }, js: { files: 0, raw: 0, gzip: 0 }, other: { files: 0, raw: 0, gzip: 0 }, totalDist: { files: 0, raw: 0, gzip: 0 } }
  const paths = []
  const digest = createHash("sha256")
  for (const file of (await walk(directory)).sort()) {
    const data = await readFile(file)
    const path = relative(directory, file).split(sep).join("/")
    const compressed = gzipSync(data, { level: 9 }).length
    paths.push(path)
    digest.update(path).update("\0").update(data).update("\0")
    groups.totalDist.files++
    groups.totalDist.raw += data.length
    groups.totalDist.gzip += compressed
    const group = extname(file) === ".html" ? groups.html : [".js", ".mjs"].includes(extname(file)) ? groups.js : groups.other
    group.files++; group.raw += data.length; group.gzip += compressed
  }
  return { ...groups, pageCount: groups.html.files, pathCount: paths.length, paths, sha256: digest.digest("hex") }
}

async function validateStaticArtifacts() {
  for (const target of targets) {
    const html = await readFile(join(target.dist, "static/index.html"), "utf8")
    if (!html.includes("data-static-content") || /<script\b/i.test(html)) throw new Error(`${target.label} static sibling is missing content or contains JavaScript`)
  }
}

async function measureBrowsers(count) {
  const chrome = await findChrome()
  const servers = Object.fromEntries(await Promise.all(targets.map(async target => [target.id, await startServer(target.dist)])))
  const samples = Object.fromEntries(targets.map(target => [target.id, []]))
  let chromeVersion
  try {
    for (let profile = 0; profile < count; profile++) {
      for (const target of rotate(targets, profile)) {
        console.log(`Browser ${profile + 1}/${count}: ${target.label}`)
        const sample = await browserSample(target, servers[target.id].origin, chrome, profile)
        chromeVersion ||= sample.chromeVersion
        delete sample.chromeVersion
        samples[target.id].push(sample)
      }
    }
  } finally { await Promise.all(Object.values(servers).map(server => server.close())) }
  return { samples, environment: { chrome: chromeVersion, chromeBinary: chrome, node: process.version, platform: `${platform()} ${release()} ${arch()}`, cpu: `${cpus()[0]?.model || "unknown"} (${cpus().length} logical CPUs)` } }
}

async function browserSample(target, origin, chrome, profile) {
  const profileDirectory = await mkdtemp(join(tmpdir(), `runtime-matrix-${target.id}-${profile}-`))
  let browser, client
  try {
    browser = await launchChrome(chrome, profileDirectory)
    client = await connect(browser.webSocketUrl)
    const version = await client.send("Browser.getVersion")
    const { targetId } = await client.send("Target.createTarget", { url: "about:blank" })
    const { sessionId } = await client.send("Target.attachToTarget", { targetId, flatten: true })
    const send = (method, params = {}) => client.send(method, params, sessionId)
    const errors = []
    const javascriptRequests = new Map()
    client.onEvent(message => {
      if (message.sessionId !== sessionId) return
      if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text)
      if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") errors.push(`console.error: ${message.params.args.map(value => value.value || value.description).join(" ")}`)
      if (message.method === "Log.entryAdded" && message.params.entry.level === "error") errors.push(message.params.entry.text)
      if (message.method === "Network.loadingFailed" && !message.params.canceled) errors.push(`network: ${message.params.errorText}`)
      if (message.method === "Network.responseReceived" && message.params.response.status >= 400) errors.push(`HTTP ${message.params.response.status}: ${message.params.response.url}`)
      if (message.method === "Network.responseReceived" && (message.params.type === "Script" || /(?:java|ecma)script/i.test(message.params.response.mimeType))) javascriptRequests.set(message.params.requestId, { url: message.params.response.url, path: new URL(message.params.response.url).pathname, mimeType: message.params.response.mimeType, status: message.params.response.status, transferBytes: 0 })
      if (message.method === "Network.loadingFinished" && javascriptRequests.has(message.params.requestId)) javascriptRequests.get(message.params.requestId).transferBytes = message.params.encodedDataLength
    })
    await Promise.all([send("Page.enable"), send("Runtime.enable"), send("Network.enable"), send("Log.enable"), send("Performance.enable")])
    const cpuBefore = await performanceMetrics(send)
    await send("Page.addScriptToEvaluateOnNewDocument", { source: initialReadyScript() })
    await send("Page.navigate", { url: `${origin}/` })
    await waitForDocument(send, `${origin}/`)
    await waitForValue(send, "Number.isFinite(globalThis.__runtimeMatrixReady)")
    const initialDomReadyMilliseconds = await evaluate(send, `globalThis.__runtimeMatrixReady`)
    if (!Number.isFinite(initialDomReadyMilliseconds)) throw new Error(`Initial DOM readiness was not recorded: ${await evaluate(send, `JSON.stringify({rows:document.querySelectorAll('[data-row]').length,records:document.querySelectorAll('[data-record]').length,effect:document.querySelector('[data-effect-setup]')?.textContent,error:globalThis.__runtimeMatrixError})`)}`)
    await evaluate(send, validationExpression("initial"))
    const cpuAfterLoad = await performanceMetrics(send)
    const heapAfterLoad = await send("Runtime.getHeapUsage")
    const preloadGraph = await evaluate(send, `({modulepreload:[...document.querySelectorAll('link[rel="modulepreload"]')].map(link=>({path:new URL(link.href).pathname,as:link.as||null})),preload:[...document.querySelectorAll('link[rel="preload"]')].map(link=>({path:new URL(link.href).pathname,as:link.as||null})),moduleScripts:[...document.querySelectorAll('script[type="module"]')].map(script=>script.src?new URL(script.src).pathname:"inline")})`)
    const operations = {}
    for (const name of operationNames) {
      operations[name] = await evaluate(send, operationExpression(name), true)
      await evaluate(send, validationExpression(name))
    }
    await new Promise(accept => setTimeout(accept, 100))
    if (errors.length) throw new Error(`${target.label} browser errors:\n- ${errors.join("\n- ")}`)
    const cpuAfterJourney = await performanceMetrics(send)
    const heapAfterJourney = await send("Runtime.getHeapUsage")
    const requests = [...javascriptRequests.values()]
    const uniqueRequests = [...new Map(requests.map(request => [request.url, request])).values()]
    const javascript = { route: "/", requestCount: requests.length, transferBytes: round(requests.reduce((sum, request) => sum + request.transferBytes, 0)), uniqueSessionRequestCount: uniqueRequests.length, uniqueSessionTransferBytes: round(uniqueRequests.reduce((sum, request) => sum + request.transferBytes, 0)), requests }
    const cpu = { source: "CDP Performance.getMetrics deltas", load: metricDelta(cpuBefore, cpuAfterLoad), fullJourney: metricDelta(cpuBefore, cpuAfterJourney), journeyAfterLoad: metricDelta(cpuAfterLoad, cpuAfterJourney) }
    const heap = { source: "CDP Runtime.getHeapUsage", afterLoad: heapAfterLoad, afterFullJourney: heapAfterJourney }
    const delayedScripts = await resilienceSample(client, target, origin, "delay")
    const missingScript = await resilienceSample(client, target, origin, "missing")
    await send("Emulation.setScriptExecutionDisabled", { value: true })
    await send("Page.navigate", { url: `${origin}/static` })
    await waitForDocument(send, `${origin}/static`)
    await evaluate(send, `(() => { if(document.querySelector('[data-static-content]')?.textContent!=='This route needs no JavaScript.' || document.scripts.length!==0) throw new Error('static sibling failed without JavaScript'); return true })()`)
    await send("Page.navigate", { url: `${origin}/` })
    await waitForDocument(send, `${origin}/`)
    await evaluate(send, `(() => { const rendered=!!document.querySelector('h1') && document.querySelectorAll('[data-row]').length===1000; if(rendered!==${target.id === "kudzu" || target.id === "astro"}) throw new Error('unexpected JavaScript-disabled root behavior'); return true })()`)
    return { chromeVersion: version.product, initialDomReadyMilliseconds: round(initialDomReadyMilliseconds), javascript, preloadGraph, cpu, heap, operations, resilience: { delayedScripts, missingScript } }
  } finally {
    client?.close()
    await closeChrome(browser)
    await rm(profileDirectory, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
  }
}

async function resilienceSample(client, target, origin, mode) {
  const { targetId } = await client.send("Target.createTarget", { url: "about:blank" })
  const { sessionId } = await client.send("Target.attachToTarget", { targetId, flatten: true })
  const send = (method, params = {}) => client.send(method, params, sessionId)
  const preRendered = target.id === "kudzu" || target.id === "astro"
  let intercepted = 0, failedPath, interceptError
  const heldMilliseconds = []
  client.onEvent(message => {
    if (message.sessionId !== sessionId || message.method !== "Fetch.requestPaused") return
    intercepted++
    if (mode === "missing" && !failedPath) {
      failedPath = new URL(message.params.request.url).pathname
      void client.send("Fetch.failRequest", { requestId: message.params.requestId, errorReason: "Failed" }, sessionId).catch(error => { interceptError = error })
      return
    }
    const began = performance.now()
    const resume = () => {
      const held = performance.now() - began
      if (mode === "delay" && held < 2000) return setTimeout(resume, 2000 - held)
      heldMilliseconds.push(held)
      void client.send("Fetch.continueRequest", { requestId: message.params.requestId }, sessionId).catch(error => { interceptError = error })
    }
    setTimeout(resume, mode === "delay" ? 2000 : 0)
  })
  try {
    await Promise.all([send("Page.enable"), send("Runtime.enable"), send("Network.enable")])
    await send("Network.setCacheDisabled", { cacheDisabled: true })
    await send("Fetch.enable", { patterns: [{ urlPattern: "*", resourceType: "Script", requestStage: "Response" }] })
    await send("Page.navigate", { url: `${origin}/` })
    await waitForCondition(() => intercepted > 0 || interceptError, 10000, `${target.label} ${mode} script interception`)
    if (interceptError) throw interceptError

    if (mode === "delay") {
      await waitForValue(send, "document.body !== null")
      if (preRendered) await waitForValue(send, `document.querySelectorAll('[data-row]').length===1000 && document.querySelectorAll('[data-record]').length===2000 && document.querySelectorAll('[data-detail]').length===200`)
      const initial = await evaluate(send, `({heading:document.querySelector('h1')?.textContent||null,rows:document.querySelectorAll('[data-row]').length,records:document.querySelectorAll('[data-record]').length,details:document.querySelectorAll('[data-detail]').length})`)
      const complete = initial.heading === "Runtime matrix" && initial.rows === 1000 && initial.records === 2000 && initial.details === 200
      if (complete !== preRendered) throw new Error(`${target.label} delayed-script initial content mismatch: ${JSON.stringify(initial)}`)
      if (preRendered && heldMilliseconds.length) throw new Error(`${target.label} delayed scripts resumed before complete initial HTML was parsed`)
      await waitForValue(send, `document.querySelectorAll('[data-row]').length===1000 && document.querySelectorAll('[data-record]').length===2000 && document.querySelectorAll('[data-detail]').length===200 && document.querySelector('[data-effect-setup]')?.textContent==='setup 0' && document.querySelector('[data-child-setup]')?.textContent==='setup 0' && document.querySelector('[data-row="500"]')?.dataset.mounted==='true'`)
      await evaluate(send, `document.querySelector('[data-action="scalar"]').click()`)
      await waitForValue(send, `document.querySelector('[data-scalar]')?.textContent==='1'`)
      if (interceptError) throw interceptError
      const minimumHold = Math.min(...heldMilliseconds)
      if (!Number.isFinite(minimumHold) || minimumHold < 2000) throw new Error(`${target.label} script response was not delayed two seconds`)
      return { passed: true, configuredDelayMilliseconds: 2000, minimumObservedDelayMilliseconds: round(minimumHold), delayedScriptResponses: intercepted, initialContent: preRendered ? "complete-pre-rendered" : "unavailable-client-shell", eventualFullReadiness: true, usableOperation: true }
    }

    await waitForDocument(send, `${origin}/`)
    await new Promise(accept => setTimeout(accept, 250))
    const root = await evaluate(send, `({heading:document.querySelector('h1')?.textContent||null,mains:document.querySelectorAll('main').length,rows:document.querySelectorAll('[data-row]').length,records:document.querySelectorAll('[data-record]').length,details:document.querySelectorAll('[data-detail]').length,scalar:document.querySelector('[data-scalar]')?.textContent||null})`)
    const complete = root.heading === "Runtime matrix" && root.mains === 1 && root.rows === 1000 && root.records === 2000 && root.details === 200 && root.scalar === "0"
    const unavailable = root.heading === null && root.mains === 0 && root.rows === 0 && root.records === 0 && root.details === 0
    if (preRendered ? !complete : !unavailable) throw new Error(`${target.label} missing-script root content mismatch: ${JSON.stringify(root)}`)
    const rootOperationPresent = await evaluate(send, `!!document.querySelector('[data-action="scalar"]')`)
    if (rootOperationPresent) await evaluate(send, `document.querySelector('[data-action="scalar"]').click()`)
    await new Promise(accept => setTimeout(accept, 250))
    const operationCommitted = await evaluate(send, `document.querySelector('[data-scalar]')?.textContent==='1'`)
    await send("Fetch.disable")
    await send("Page.navigate", { url: `${origin}/static` })
    await waitForDocument(send, `${origin}/static`)
    await evaluate(send, `(() => { if(document.querySelector('[data-static-content]')?.textContent!=='This route needs no JavaScript.' || document.scripts.length!==0) throw new Error('missing-script static sibling failed'); return true })()`)
    return { passed: true, failedScriptResponses: 1, failedScriptPath: failedPath, rootContent: preRendered ? "complete-pre-rendered" : "unavailable-client-shell", rootOperationPresent, rootOperationCommitted: operationCommitted, noPartialCorruption: true, staticSiblingComplete: true }
  } finally {
    await client.send("Target.closeTarget", { targetId }).catch(() => {})
  }
}

function initialReadyScript() {
  return `(() => {
    globalThis.__runtimeMatrixReady = null;
    const ready = () => { try {
      if (document.querySelectorAll('[data-row]').length !== 1000 || document.querySelectorAll('[data-record]').length !== 2000 || document.querySelectorAll('[data-detail]').length !== 200 || document.querySelector('[data-effect-setup]')?.textContent !== 'setup 0' || document.querySelector('[data-child-setup]')?.textContent !== 'setup 0' || document.querySelector('[data-row="500"]')?.dataset.mounted !== 'true') return;
      observer.disconnect(); document.body.offsetHeight; globalThis.__runtimeMatrixReady = performance.now();
    } catch (error) { globalThis.__runtimeMatrixError = error?.stack || String(error) } };
    const observer = new MutationObserver(ready); observer.observe(document, { attributes:true, childList:true, characterData:true, subtree:true });
    document.addEventListener('DOMContentLoaded', ready, { once:true }); ready();
  })()`
}

function operationExpression(name) {
  const operation = {
    scalarCommit: ["scalar", `document.querySelector('[data-scalar]').textContent === '1' && document.querySelector('[data-controlled]').value === '1' && document.querySelector('[data-scalar]').className === 'odd' && document.querySelector('[data-scalar]').getAttribute('data-value') === '1' && document.querySelector('[data-scalar]').style.color === 'blue'`],
    secondCommit: ["second", `document.querySelector('[data-second]').textContent === '2' && document.querySelector('[data-derived]').textContent === '3'`],
    objectReplace: ["object", `document.querySelector('[data-object]').textContent === 'Ada 1'`],
    childState: ["child-state", `document.querySelector('[data-child-state]').textContent === '1' && document.querySelector('[data-child-setup]').textContent === 'setup 1' && document.querySelector('[data-child-cleanup]').textContent === 'cleanup 0'`],
    conditionalUnmount: ["conditional", `document.querySelectorAll('[data-detail]').length === 0 && document.querySelector('[data-child-cleanup]').textContent === 'cleanup 1'`],
    conditionalMount: ["conditional", `document.querySelectorAll('[data-detail]').length === 200 && document.querySelector('[data-child-state]').textContent === '0' && document.querySelector('[data-child-setup]').textContent === 'setup 0'`],
    rowLocalState: [`document.querySelector('[data-row-toggle="500"]').click()`, `document.querySelector('[data-row="500"]')?.dataset.selected === 'true' && document.querySelector('[data-row-toggle="500"]')?.getAttribute('aria-pressed') === 'true'`],
    rowUpdate: ["row-update", `document.querySelector('[data-row-toggle="500"]')?.textContent === 'Row 500 updated'`],
    rowFilter: ["row-filter", `document.querySelectorAll('[data-row]').length === 1 && document.querySelector('[data-row="500"]')?.dataset.selected === 'true'`],
    rowRestore: ["row-restore", `document.querySelectorAll('[data-row]').length === 1000 && document.querySelectorAll('[data-row][data-mounted="true"]').length === 1000 && document.querySelector('[data-row="500"]')?.dataset.selected === 'true'`],
    rowReverse: ["row-reverse", `document.querySelector('[data-row]')?.getAttribute('data-row') === '999' && [...document.querySelectorAll('[data-row]')].at(-1)?.getAttribute('data-row') === '0'`],
    rowRemove: ["row-remove", `document.querySelectorAll('[data-row]').length === 999 && !document.querySelector('[data-row="500"]') && document.querySelector('[data-row-cleanup]').textContent === 'cleaned 500'`],
    rowAppend: ["row-append", `document.querySelectorAll('[data-row]').length === 1000 && [...document.querySelectorAll('[data-row]')].at(-1)?.getAttribute('data-row') === '500' && document.querySelector('[data-row="500"]')?.dataset.selected === 'false' && document.querySelector('[data-row="500"]')?.dataset.mounted === 'true'`],
    rowReaddedState: [`document.querySelector('[data-row-toggle="500"]').click()`, `document.querySelector('[data-row="500"]')?.dataset.selected === 'true'`],
    svgKeyboard: [`document.querySelector('[data-point="2"]').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}))`, `document.querySelector('[data-selected-point]').textContent === '2' && document.querySelector('[data-point="2"]').getAttribute('aria-pressed') === 'true' && document.querySelector('[data-point="1"]').getAttribute('aria-pressed') === 'false'`],
    searchReduce: ["search", `document.querySelectorAll('[data-record]').length === 1 && document.querySelector('[data-record="1337"]')?.textContent === 'Unique needle'`],
    searchRestore: ["search-restore", `document.querySelectorAll('[data-record]').length === 2000`],
    effectUpdateCleanup: ["effect", `document.querySelector('[data-effect-setup]').textContent === 'setup 1' && document.querySelector('[data-effect-cleanup]').textContent === 'cleanup 0'`],
    asyncHandler: ["async", `document.querySelector('[data-async]').textContent === '1'`],
  }[name]
  return `new Promise((resolve, reject) => {
    const done = () => { if (!(${operation[1]})) return; clearTimeout(timeout); observer.disconnect(); document.body.offsetHeight; resolve(Number((performance.now() - started).toFixed(3))); };
    const observer = new MutationObserver(done); observer.observe(document.querySelector('main'), { attributes:true, childList:true, characterData:true, subtree:true });
    const timeout = setTimeout(() => { observer.disconnect(); const list=document.querySelector('[data-rows]'), row=document.querySelector('[data-row]'); reject(new Error('Timed out: ${name} '+JSON.stringify({rows:document.querySelectorAll('[data-row]').length,cleanup:document.querySelector('[data-row-cleanup]')?.textContent,list:list?.outerHTML.slice(0,100),parent:row?.parentElement?.outerHTML.slice(0,100),first:list?.firstElementChild?.getAttribute('data-row'),last:list?.lastElementChild?.getAttribute('data-row')}))) }, 10000);
    const started = performance.now(); ${operation[0].includes(".") ? operation[0] : `document.querySelector('[data-action="${operation[0]}"]').click()`}; done();
  })`
}

function validationExpression(stage) {
  return `(() => {
    const stage=${JSON.stringify(stage)}, fail=message=>{throw new Error(stage+': '+message)}, rows=[...document.querySelectorAll('[data-row]')];
    if (document.querySelectorAll('main').length!==1 || document.querySelector('h1')?.textContent!=='Runtime matrix') fail('wrong landmark/content');
    for (const id of ['scalar-heading','conditional-heading','rows-heading','search-heading','svg-heading','effects-heading']) if (document.querySelector('[aria-labelledby="'+id+'"]')?.querySelector('#'+id)?.tagName!=='H2') fail('bad accessible section '+id);
    if(Number(document.querySelector('[data-derived]')?.textContent)!==Number(document.querySelector('[data-scalar]')?.textContent)+Number(document.querySelector('[data-second]')?.textContent)) fail('wrong multi-state derived output');
    if(document.querySelector('[data-point="1"]')?.getAttribute('role')!=='button'||document.querySelector('[data-point="1"]')?.getAttribute('tabindex')!=='0'||document.querySelector('svg')?.getAttribute('aria-labelledby')!=='svg-title') fail('bad accessible SVG');
    if (!globalThis.__rowNodes) globalThis.__rowNodes=new Map(rows.map(node=>[node.getAttribute('data-row'),node]));
    if (stage==='initial') { if(rows.length!==1000||document.querySelectorAll('[data-record]').length!==2000||document.querySelectorAll('[data-detail]').length!==200) fail('wrong initial ranges'); globalThis.__record1337=document.querySelector('[data-record="1337"]'); globalThis.__initialRow0=document.querySelector('[data-row="0"]'); }
    if (['rowUpdate','rowFilter'].includes(stage)) for (const row of rows) { const id=row.getAttribute('data-row'); if(globalThis.__rowNodes.get(id)!==row) fail('retained row identity changed '+id); }
    if (stage==='rowUpdate' && globalThis.__rowNodes.get('500')!==document.querySelector('[data-row="500"]')) fail('updated row identity changed');
    if (stage==='rowRestore') { if(globalThis.__rowNodes.get('500')!==document.querySelector('[data-row="500"]')) fail('filtered row identity changed'); if(globalThis.__initialRow0===document.querySelector('[data-row="0"]')) fail('removed filtered row was not recreated'); globalThis.__rowNodes=new Map(rows.map(node=>[node.getAttribute('data-row'),node])); }
    if (['rowReverse','rowRemove','rowAppend'].includes(stage)) for (const row of rows) { const id=row.getAttribute('data-row'); if(id!=='500' && globalThis.__rowNodes.get(id)!==row) fail('retained row identity changed '+id); }
    if (stage==='rowReverse' && rows.some((row,index)=>row.getAttribute('data-row')!==String(999-index))) fail('wrong reverse order');
    if (stage==='rowAppend' && globalThis.__rowNodes.get('500')===document.querySelector('[data-row="500"]')) fail('removed row was not recreated');
    if (stage==='searchReduce' && globalThis.__record1337!==document.querySelector('[data-record="1337"]')) fail('surviving search row identity changed');
    return true;
  })()`
}

function summarizeBrowser(samples) {
  return {
    freshProfiles: samples.length,
    initialDomReadyMilliseconds: summarize(samples.map(sample => sample.initialDomReadyMilliseconds)),
    operations: Object.fromEntries(operationNames.map(name => [name, summarize(samples.map(sample => sample.operations[name]))])),
    javascript: {
      routeTransferBytes: summarize(samples.map(sample => sample.javascript.transferBytes)),
      uniqueSessionTransferBytes: summarize(samples.map(sample => sample.javascript.uniqueSessionTransferBytes)),
      requestCounts: [...new Set(samples.map(sample => sample.javascript.requestCount))],
    },
    cpu: {
      loadCompileMilliseconds: summarize(samples.map(sample => sample.cpu.load.v8CompileMilliseconds)),
      loadScriptMilliseconds: summarize(samples.map(sample => sample.cpu.load.scriptMilliseconds)),
      fullJourneyCompileMilliseconds: summarize(samples.map(sample => sample.cpu.fullJourney.v8CompileMilliseconds)),
      fullJourneyScriptMilliseconds: summarize(samples.map(sample => sample.cpu.fullJourney.scriptMilliseconds)),
      fullJourneyTaskMilliseconds: summarize(samples.map(sample => sample.cpu.fullJourney.taskMilliseconds)),
    },
    heap: {
      afterLoadUsedBytes: summarize(samples.map(sample => sample.heap.afterLoad.usedSize)),
      afterFullJourneyUsedBytes: summarize(samples.map(sample => sample.heap.afterFullJourney.usedSize)),
    },
    resilience: samples.map(sample => sample.resilience),
    rawProfiles: samples,
    validation: { passed: true, browserErrors: 0, initialRows: 1000, initialSearchRecords: 2000, conditionalNodes: 200, retainedRowIdentityChecked: true, rowOwnershipCleanupChecked: true, conditionalOwnershipChecked: true, accessibleSvgKeyboardChecked: true, delayedTwoSecondScriptsChecked: true, oneMissingScriptChecked: true, staticSiblingAndJavaScriptDisabledChecked: true },
  }
}

function summarizeBuilds(samples) {
  const digests = [...new Set(samples.map(sample => sample.output.sha256))]
  const pathCounts = [...new Set(samples.map(sample => sample.output.pathCount))]
  return { freshProcesses: samples.length, peakRssBytes: summarize(samples.map(sample => sample.peakRssBytes)), outputDeterministic: digests.length === 1 && pathCounts.length === 1, outputDigests: digests, outputPathCounts: pathCounts, rawSamples: samples }
}

function summarize(samples) {
  const ordered = [...samples].sort((a, b) => a - b)
  return { samples, median: median(ordered), min: ordered[0], q1: percentile(ordered, .25), q3: percentile(ordered, .75), max: ordered.at(-1) }
}
function median(values) { const values2=[...values].sort((a,b)=>a-b), middle=Math.floor(values2.length/2); return values2.length%2?values2[middle]:(values2[middle-1]+values2[middle])/2 }
function percentile(values, quantile) { const ordered=[...values].sort((a,b)=>a-b); return ordered[Math.max(0,Math.ceil(ordered.length*quantile)-1)] }

async function frameworkVersions() {
  const readVersion = async name => JSON.parse(await readFile(join(dependencies, name, "package.json"), "utf8")).version
  return { kudzu: JSON.parse(await readFile(join(root, "package.json"), "utf8")).version, react: await readVersion("react"), reactDom: await readVersion("react-dom"), vue: await readVersion("vue"), svelte: await readVersion("svelte"), astro: JSON.parse(await readFile(join(workspace, "astro/node_modules/astro/package.json"), "utf8")).version, vite: await readVersion("vite"), svelteVitePlugin: await readVersion("@sveltejs/vite-plugin-svelte") }
}

async function gitState() {
  const commit = (await commandOutput("git", ["rev-parse", "HEAD"], root)).trim()
  const status = await commandOutput("git", ["status", "--porcelain"], root)
  const files = (await walk(workspace)).filter(file => !file.includes(`${sep}dist${sep}`) && !file.includes(`${sep}.kudzu${sep}`) && !file.includes(`${sep}results${sep}`))
  const hash = createHash("sha256")
  for (const file of files.sort()) hash.update(relative(root, file)).update("\0").update(await readFile(file)).update("\0")
  return { commit, uncommitted: status.trim().length > 0, benchmarkSourceSha256: hash.digest("hex") }
}

function markdown(report) {
  const artifactRows = targets.map(({ id }) => { const value=report.targets[id]; return `| ${value.label} | ${value.architecture} | ${format(value.buildMilliseconds.median)} | ${format(value.build.peakRssBytes.median / 1048576)} | ${value.artifacts.pathCount} / ${value.artifacts.pageCount} | ${value.artifacts.sha256.slice(0,12)} | ${value.artifacts.html.raw} / ${value.artifacts.html.gzip} | ${value.artifacts.js.raw} / ${value.artifacts.js.gzip} | ${value.artifacts.totalDist.raw} / ${value.artifacts.totalDist.gzip} | ${format(value.browser.initialDomReadyMilliseconds.median)} |` }).join("\n")
  const operationRows = operationNames.map(name => `| ${name} | ${targets.map(({id})=>format(report.targets[id].browser.operations[name].median)).join(" | ")} |`).join("\n")
  const browserRows = targets.map(({ id }) => { const value=report.targets[id].browser; return `| ${report.targets[id].label} | ${format(value.javascript.routeTransferBytes.median)} | ${format(value.javascript.uniqueSessionTransferBytes.median)} | ${format(value.cpu.loadCompileMilliseconds.median)} / ${format(value.cpu.loadScriptMilliseconds.median)} | ${format(value.cpu.fullJourneyCompileMilliseconds.median)} / ${format(value.cpu.fullJourneyScriptMilliseconds.median)} | ${format(value.cpu.fullJourneyTaskMilliseconds.median)} | ${format(value.heap.afterLoadUsedBytes.median / 1048576)} | ${format(value.heap.afterFullJourneyUsedBytes.median / 1048576)} |` }).join("\n")
  return `# Runtime Matrix Benchmark\n\n- Mode: ${report.mode}\n- Schema: ${report.schemaVersion}\n- Builds: ${report.measuredBuildsPerTarget} measured${report.warmupBuildsPerTarget ? ` after ${report.warmupBuildsPerTarget} warmup` : ""}; targets interleaved by round, each in a fresh process\n- Browser: ${report.measuredBrowserProfilesPerTarget} fresh rotating profiles per target\n- Timing: in-page completion observation and forced layout; correctness and identity validation outside timed intervals\n- Architecture caveat: Kudzu serves complete initial HTML and route-specific direct-DOM capabilities. Astro pre-renders a React island; React, Vue, and Svelte start from client-rendered shells.\n\n| Target | Architecture | Build ms | Peak RSS MiB | Paths / pages | Output SHA-256 | HTML raw / gzip B | JS raw / gzip B | Dist raw / gzip B | Complete initial DOM ms |\n| --- | --- | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: |\n${artifactRows}\n\n| Target | Route fetched JS B | Unique session JS B | Load compile / execute ms | Journey compile / execute ms | Journey task CPU ms | Load heap MiB | Journey heap MiB |\n| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |\n${browserRows}\n\n| Operation (ms) | ${targets.map(target => target.label).join(" | ")} |\n| --- | ${targets.map(() => "---:").join(" | ")} |\n${operationRows}\n\nRaw build samples and manifests, preload graphs, browser requests, CPU/heap snapshots, resilience outcomes, quartiles, environment, versions, checkout, source hash, and validation metadata are in \`raw.json\`.\n`
}

async function startServer(directory) {
  const rootDirectory = resolve(directory)
  const server = createServer(async (request, response) => { try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname)
    if (pathname === "/favicon.ico") { response.writeHead(204); return response.end() }
    const relativePath = pathname === "/" ? "index.html" : pathname.endsWith("/") || !extname(pathname) ? `${pathname.slice(1)}/index.html` : pathname.slice(1)
    const file = resolve(rootDirectory, relativePath)
    if (file !== rootDirectory && !file.startsWith(`${rootDirectory}${sep}`)) throw Object.assign(new Error(), { status: 403 })
    const data = await readFile(file); response.writeHead(200, { "Content-Type": contentType(file), "Content-Length": data.length, "Cache-Control": "no-store" }); response.end(data)
  } catch (error) { response.writeHead(error.status || 404, { "Content-Type": "text/plain" }); response.end("Not found") } })
  await new Promise((accept, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", accept) })
  return { origin: `http://127.0.0.1:${server.address().port}`, close: () => new Promise(accept => server.close(accept)) }
}

async function findChrome() { for (const path of process.env.CHROME_BIN ? [process.env.CHROME_BIN] : ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser"]) if (await access(path, constants.X_OK).then(()=>true,()=>false)) return path; throw new Error("Chrome not found") }
async function launchChrome(executable, profile) {
  const child=spawn(executable,["--headless=new","--remote-debugging-port=0",`--user-data-dir=${profile}`,"--no-first-run","--disable-default-apps","--disable-background-networking","--disable-component-update","--disable-sync","about:blank"],{stdio:["ignore","ignore","pipe"]}); let output=""
  try { const webSocketUrl=await new Promise((accept,reject)=>{const timeout=setTimeout(()=>reject(new Error(`Chrome startup timed out:\n${output}`)),15000);child.once("error",reject);child.once("exit",code=>reject(new Error(`Chrome exited (${code}):\n${output}`)));child.stderr.on("data",chunk=>{output+=chunk;const match=output.match(/DevTools listening on (ws:\/\/\S+)/);if(match){clearTimeout(timeout);accept(match[1])}})});return{child,webSocketUrl} } catch(error){await stopProcess(child);throw error}
}
async function closeChrome(browser) { if(browser) await stopProcess(browser.child) }
async function stopProcess(child) { if(child.exitCode!==null)return;child.kill("SIGTERM");await Promise.race([new Promise(accept=>child.once("exit",accept)),new Promise(accept=>setTimeout(accept,2000))]);if(child.exitCode===null){child.kill("SIGKILL");await new Promise(accept=>child.once("exit",accept))} }
async function connect(url) {
  const socket=new WebSocket(url);await new Promise((accept,reject)=>{socket.addEventListener("open",accept,{once:true});socket.addEventListener("error",reject,{once:true})});let id=0;const pending=new Map(),listeners=new Set();socket.addEventListener("message",event=>{const message=JSON.parse(event.data);if(message.id){const waiter=pending.get(message.id);if(!waiter)return;pending.delete(message.id);message.error?waiter.reject(new Error(`${waiter.method}: ${message.error.message}`)):waiter.resolve(message.result)}else for(const listener of listeners)listener(message)});return{send(method,params={},sessionId){const messageId=++id;socket.send(JSON.stringify({id:messageId,method,params,...(sessionId&&{sessionId})}));return new Promise((resolvePromise,reject)=>pending.set(messageId,{resolve:resolvePromise,reject,method}))},onEvent(listener){listeners.add(listener)},close(){socket.close()}}
}
async function waitForDocument(send,url){const deadline=Date.now()+30000;while(Date.now()<deadline){if(await evaluate(send,`location.href === ${JSON.stringify(url)} && document.readyState === 'complete'`))return;await new Promise(accept=>setTimeout(accept,10))}throw new Error(`Timed out waiting for ${url}`)}
async function waitForValue(send,expression){const deadline=Date.now()+30000;while(Date.now()<deadline){if(await evaluate(send,expression))return;await new Promise(accept=>setTimeout(accept,10))}throw new Error(`Timed out waiting for ${expression}`)}
async function waitForCondition(condition,timeout,label){const deadline=Date.now()+timeout;while(Date.now()<deadline){if(condition())return;await new Promise(accept=>setTimeout(accept,10))}throw new Error(`Timed out waiting for ${label}`)}
async function evaluate(send,expression,awaitPromise=false){const result=await send("Runtime.evaluate",{expression,awaitPromise,returnByValue:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value}
async function walk(directory){const files=[];for(const entry of await readdir(directory,{withFileTypes:true})){const path=join(directory,entry.name);if(entry.isDirectory())files.push(...await walk(path));else if(entry.isFile())files.push(path)}return files}
function run(command,args,cwd){return new Promise((resolvePromise,reject)=>{const child=spawn(command,args,{cwd,stdio:["ignore","pipe","pipe"]});let output="";child.stdout.on("data",chunk=>output+=chunk);child.stderr.on("data",chunk=>output+=chunk);child.once("error",reject);child.once("close",code=>code===0?resolvePromise():reject(new Error(`${command} failed (${code}):\n${output}`)))})}
function timedRun(command,args,cwd){return new Promise((resolvePromise,reject)=>{const marker="__RUNTIME_MATRIX_MAX_RSS_KIB__";const child=spawn("/usr/bin/time",["-f",`${marker}%M`,command,...args],{cwd,stdio:["ignore","pipe","pipe"]});let output="",stderr="";child.stdout.on("data",chunk=>output+=chunk);child.stderr.on("data",chunk=>{output+=chunk;stderr+=chunk});child.once("error",reject);child.once("close",code=>{if(code!==0)return reject(new Error(`${command} failed (${code}):\n${output}`));const match=stderr.match(new RegExp(`${marker}(\\d+)`));match?resolvePromise(Number(match[1])*1024):reject(new Error(`GNU time did not report peak RSS for ${command}`))})})}
function commandOutput(command,args,cwd){return new Promise((resolvePromise,reject)=>{const child=spawn(command,args,{cwd,stdio:["ignore","pipe","pipe"]});let stdout="",stderr="";child.stdout.on("data",chunk=>stdout+=chunk);child.stderr.on("data",chunk=>stderr+=chunk);child.once("error",reject);child.once("close",code=>code===0?resolvePromise(stdout):reject(new Error(`${command} failed: ${stderr}`)))})}
function rotate(values,offset){return values.map((_,index)=>values[(index+offset)%values.length])}
function round(value){return Number(value.toFixed(3))}
function format(value){return Number(value.toFixed(3)).toString()}
function contentType(file){return extname(file)===".html"?"text/html; charset=utf-8":[".js",".mjs"].includes(extname(file))?"text/javascript; charset=utf-8":"application/octet-stream"}
async function performanceMetrics(send){const {metrics}=await send("Performance.getMetrics");return Object.fromEntries(metrics.map(metric=>[metric.name,metric.value]))}
function metricDelta(before,after){const milliseconds=name=>round(((after[name]??0)-(before[name]??0))*1000);return{scriptMilliseconds:milliseconds("ScriptDuration"),taskMilliseconds:milliseconds("TaskDuration"),v8CompileMilliseconds:milliseconds("V8CompileDuration")}}
