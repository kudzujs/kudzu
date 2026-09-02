import { spawn } from "node:child_process"
import { createHash } from "node:crypto"
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"
import { parseArgs } from "node:util"
import { gzipSync } from "node:zlib"

const { values } = parseArgs({ options: { protocol: { type: "string" }, out: { type: "string" } }, strict: true })
const protocolFile = values.protocol ? resolve(values.protocol) : fileURLToPath(new URL("./fixtures/ai-delivery/protocol.json", import.meta.url))
const protocolDirectory = dirname(protocolFile)
const outputDirectory = values.out ? resolve(values.out) : resolve("test-results", "ai-delivery", new Date().toISOString().replaceAll(":", "-"))
const protocolBytes = await readFile(protocolFile)
const protocol = JSON.parse(protocolBytes)
validateProtocol(protocol)
await verifyInputs(protocol, protocolDirectory)
await mkdir(dirname(outputDirectory), { recursive: true })
await mkdir(outputDirectory)
const temporaryDirectory = await mkdtemp(join(tmpdir(), "kudzu-ai-delivery-run-"))
const startedAt = new Date().toISOString()
const attempts = []
const run = () => ({
  schema: 1,
  status: attempts.length !== protocol.schedule.length ? "running" : attempts.some(attempt => attempt.attribution === "incomplete") ? "incomplete" : "complete",
  startedAt,
  ...(attempts.length === protocol.schedule.length ? { completedAt: new Date().toISOString() } : {}),
  protocol: { schema: protocol.schema, id: protocol.id, packet: protocol.packet, sha256: sha256(protocolBytes) },
  environment: { node: process.version, executable: process.execPath, platform: process.platform, arch: process.arch },
  schedule: protocol.schedule,
  variants: summarizeAttempts(attempts, protocol.variants),
  comparison: compareTooling(attempts, protocol.variants),
  attempts,
})

await writeJson(join(outputDirectory, "run.json"), run())
await cp(protocolFile, join(outputDirectory, "protocol.json"))
await cp(resolve(protocolDirectory, protocol.task.prompt), join(outputDirectory, "prompt.md"))

try {
  for (const scheduled of protocol.schedule) {
    const variant = protocol.variants.find(entry => entry.id === scheduled.variant)
    const evidenceDirectory = join(outputDirectory, "attempts", scheduled.id)
    const workspace = join(temporaryDirectory, scheduled.id)
    await mkdir(evidenceDirectory, { recursive: true })
    await cp(resolve(protocolDirectory, variant.starter), workspace, { recursive: true })
    const baseline = await inventory(workspace, sourceExcluded)
    const traceFile = join(evidenceDirectory, "adapter.trace.jsonl")
    const prompt = await readFile(resolve(protocolDirectory, protocol.task.prompt), "utf8")
    const publicContext = await Promise.all(variant.publicContext.map(async context => ({ ...context, content: await readFile(resolve(protocolDirectory, context.path), "utf8") })))
    const adapter = await runCommand(protocol.model.adapter, {
      cwd: workspace,
      timeout: protocol.budgets.elapsedMs,
      input: JSON.stringify({ schema: 1, attempt: scheduled.id, ordinal: scheduled.ordinal, variant: variant.id, workspace, trace: traceFile, prompt, model: protocol.model, tools: protocol.tools, budgets: protocol.budgets, publicContext })
    }, protocolDirectory, workspace)
    await writeFile(join(evidenceDirectory, "adapter.stdout"), adapter.stdout)
    await writeFile(join(evidenceDirectory, "adapter.stderr"), adapter.stderr)

    const recordedTrace = await readTrace(traceFile)
    const trace = recordedTrace ?? emptyTrace(scheduled.id, protocol.model, adapter.elapsedMs)
    if (recordedTrace) validateTrace(trace, protocol.model, protocol.tools)
    const build = await runCommand(variant.build, { cwd: workspace, timeout: protocol.budgets.elapsedMs }, protocolDirectory, workspace)
    await writeFile(join(evidenceDirectory, "build.stdout"), build.stdout)
    await writeFile(join(evidenceDirectory, "build.stderr"), build.stderr)
    const acceptanceCommand = protocol.task.acceptance
    const acceptanceRun = await runCommand(acceptanceCommand, { cwd: workspace, timeout: protocol.budgets.elapsedMs }, protocolDirectory, workspace)
    await writeFile(join(evidenceDirectory, "acceptance.stdout"), acceptanceRun.stdout)
    await writeFile(join(evidenceDirectory, "acceptance.stderr"), acceptanceRun.stderr)
    const acceptanceResult = parseAcceptance(acceptanceRun)
    const source = await inventory(workspace, sourceExcluded)
    const artifactRoot = resolve(workspace, variant.artifactDirectory)
    const artifacts = await inventory(artifactRoot, () => false)
    await copyInventory(source.entries, workspace, join(evidenceDirectory, "source"))
    await copyInventory(artifacts.entries, artifactRoot, join(evidenceDirectory, "artifacts"))
    const metrics = metricsFor(trace, protocol.model.pricing)
    const exceeded = budgetFailures(metrics, protocol.budgets)
    const status = !adapter.error && adapter.status === 0 && !build.error && build.status === 0 && acceptanceResult.passed && !exceeded.length ? "success" : "failure"
    const result = {
      schema: 1,
      id: scheduled.id,
      variant: variant.id,
      condition: variant.condition ?? null,
      ordinal: scheduled.ordinal,
      status,
      attribution: !recordedTrace ? "incomplete" : protocol.model.provider === "fixture" ? "reproducible" : "fully-attributable",
      provider: trace.provider,
      metrics,
      budgetExceeded: exceeded,
      sourceRetention: retention(baseline, source),
      artifacts: summarizeInventory(artifacts),
      acceptance: acceptanceResult,
      commands: {
        adapter: commandResult(adapter),
        build: commandResult(build),
        acceptance: commandResult(acceptanceRun),
      },
      inputs: {
        protocol: sha256(protocolBytes),
        prompt: protocol.task.promptSha256,
        adapter: protocol.model.adapter.sha256,
        starter: variant.starterSha256,
        acceptance: protocol.task.acceptance.sha256,
      },
      evidence: relative(outputDirectory, evidenceDirectory).replaceAll(sep, "/"),
    }
    await writeJson(join(evidenceDirectory, "result.json"), result)
    attempts.push(result)
    await writeJson(join(outputDirectory, "run.json"), run())
  }
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true })
}
process.stdout.write(`${JSON.stringify(run())}\n`)

function validateProtocol(value) {
  if (!plain(value) || value.schema !== 1 || typeof value.packet !== "string" || typeof value.id !== "string") throw new Error("Invalid AI delivery protocol v1")
  if (!plain(value.model) || !plain(value.model.adapter) || !plain(value.model.pricing) || !plain(value.tools) || !plain(value.budgets) || !plain(value.task) || !plain(value.task.acceptance)) throw new Error("AI delivery protocol requires model, tools, budgets, task, adapter, pricing, and acceptance records")
  if (!Array.isArray(value.variants) || !Array.isArray(value.schedule) || value.variants.length !== 2 || !value.schedule.length) throw new Error("AI delivery protocol requires two paired variants and a non-empty schedule")
  const variants = new Map(value.variants.map(variant => [variant.id, variant]))
  if (variants.size !== 2 || [...variants.keys()].some(id => typeof id !== "string" || !id)) throw new Error("AI delivery protocol requires two uniquely named variants")
  const attempts = new Set()
  const ordinals = new Map(value.variants.map(variant => [variant.id, []]))
  for (const entry of value.schedule) {
    if (!plain(entry) || typeof entry.id !== "string" || !variants.has(entry.variant) || !Number.isInteger(entry.ordinal) || entry.ordinal < 0 || attempts.has(entry.id)) throw new Error("Invalid or duplicate AI delivery schedule entry")
    attempts.add(entry.id)
    ordinals.get(entry.variant).push(entry.ordinal)
  }
  const paired = [...ordinals.values()].map(values => JSON.stringify([...values].sort((left, right) => left - right)))
  if (new Set(paired).size !== 1) throw new Error("AI delivery schedule must retain equal attempt ordinals for both variants")
  for (const budget of Object.values(value.budgets)) if (!Number.isInteger(budget) || budget < 0) throw new Error("AI delivery budgets must be non-negative integers")
  for (const variant of value.variants) if (!plain(variant.build) || typeof variant.starter !== "string" || typeof variant.starterSha256 !== "string" || typeof variant.artifactDirectory !== "string" || !Array.isArray(variant.publicContext)) throw new Error("Invalid AI delivery variant")
}

async function verifyInputs(value, directory) {
  await verifyFile(resolve(directory, value.task.prompt), value.task.promptSha256, "prompt")
  await verifyFile(resolveCommandFile(value.model.adapter, directory), value.model.adapter.sha256, "adapter")
  await verifyFile(resolveCommandFile(value.task.acceptance, directory), value.task.acceptance.sha256, "acceptance")
  for (const variant of value.variants) {
    const actual = (await inventory(resolve(directory, variant.starter), () => false)).sha256
    if (actual !== variant.starterSha256) throw new Error(`${variant.id} starter digest ${actual} does not match protocol ${variant.starterSha256}`)
    for (const context of variant.publicContext) {
      if (!plain(context) || typeof context.path !== "string" || typeof context.sha256 !== "string") throw new Error(`Invalid ${variant.id} public context`)
      await verifyFile(resolve(directory, context.path), context.sha256, `${variant.id} public context`)
    }
  }
}

async function verifyFile(path, expected, label) {
  const actual = sha256(await readFile(path))
  if (actual !== expected) throw new Error(`${label} digest ${actual} does not match protocol ${expected}`)
}

function resolveCommandFile(command, directory) {
  const argument = command.args.find(value => value.includes("{protocol}"))
  if (!argument) throw new Error("Pinned script commands require one {protocol} argument")
  return resolve(argument.replace("{protocol}", directory))
}

async function runCommand(specification, options, protocolRoot, workspace) {
  const executable = specification.command === "node" ? process.execPath : specification.command
  const args = specification.args.map(value => value.replaceAll("{protocol}", protocolRoot).replaceAll("{workspace}", workspace))
  const started = performance.now()
  return new Promise(resolveResult => {
    const child = spawn(executable, args, { cwd: options.cwd, stdio: ["pipe", "pipe", "pipe"], env: { ...process.env } })
    const stdout = []
    const stderr = []
    let outputBytes = 0
    let timedOut = false
    let settled = false
    const timer = setTimeout(() => { timedOut = true; child.kill("SIGKILL") }, options.timeout)
    child.stdout.on("data", chunk => { outputBytes += chunk.length; if (outputBytes <= 1 << 20) stdout.push(chunk) })
    child.stderr.on("data", chunk => { outputBytes += chunk.length; if (outputBytes <= 1 << 20) stderr.push(chunk) })
    child.on("error", error => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolveResult({ status: null, signal: null, error: error.message, timedOut, elapsedMs: elapsed(started), stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr) })
    })
    child.on("close", (status, signal) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolveResult({ status, signal, error: outputBytes > 1 << 20 ? "command output exceeded 1048576 bytes" : null, timedOut, elapsedMs: elapsed(started), stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr) })
    })
    child.stdin.end(options.input ?? "")
  })
}

async function readTrace(path) {
  let value
  try { value = await readFile(path, "utf8") } catch (error) {
    if (error.code === "ENOENT") return null
    throw error
  }
  if (!value.trim()) return null
  const lines = value.trim().split("\n")
  if (lines.length !== 1) throw new Error("Adapter trace must contain exactly one raw attribution record")
  return JSON.parse(lines[0])
}

function emptyTrace(attempt, model, elapsedMs) {
  return {
    schema: 1,
    provider: { requestId: `missing:${attempt}`, model: model.id, revision: model.revision },
    usage: { inputTokens: 0, outputTokens: 0, reasoningTokens: 0 },
    elapsedMs: Math.round(elapsedMs),
    tools: [],
    buildAttempts: 0,
    correctionCycles: 0,
  }
}

function validateTrace(trace, model, tools) {
  if (!plain(trace) || trace.schema !== 1 || !plain(trace.provider) || !plain(trace.usage) || !Array.isArray(trace.tools)) throw new Error("Invalid adapter attribution trace")
  if (!trace.provider.requestId || trace.provider.model !== model.id || trace.provider.revision !== model.revision) throw new Error("Adapter provider attribution does not match the pinned model")
  for (const field of ["inputTokens", "outputTokens", "reasoningTokens"]) if (!Number.isInteger(trace.usage[field]) || trace.usage[field] < 0) throw new Error("Adapter token usage must be non-negative integers")
  if (!Number.isInteger(trace.elapsedMs) || trace.elapsedMs < 0) throw new Error("Adapter elapsed time must be a non-negative integer")
  if (!Number.isInteger(trace.buildAttempts) || trace.buildAttempts < 0 || !Number.isInteger(trace.correctionCycles) || trace.correctionCycles < 0) throw new Error("Invalid adapter attempt metrics")
  if (trace.tools.some(tool => !plain(tool) || !tools.names.includes(tool.name))) throw new Error("Adapter used a tool outside the pinned tool set")
}

function metricsFor(trace, pricing) {
  const tokens = { input: trace.usage.inputTokens, output: trace.usage.outputTokens, reasoning: trace.usage.reasoningTokens }
  const costUsdNanos = Math.round((tokens.input * pricing.inputUsdNanosPerMillion + tokens.output * pricing.outputUsdNanosPerMillion + tokens.reasoning * pricing.reasoningUsdNanosPerMillion) / 1_000_000)
  return {
    tokens,
    costUsdNanos,
    elapsedMs: trace.elapsedMs,
    toolCalls: trace.tools.length,
    filesRead: new Set(trace.tools.filter(tool => tool.name === "read").map(tool => tool.path)).size,
    filesModified: new Set(trace.tools.filter(tool => tool.name === "write" || tool.name === "replace").map(tool => tool.path)).size,
    buildAttempts: trace.buildAttempts,
    correctionCycles: trace.correctionCycles,
  }
}

function budgetFailures(metrics, budgets) {
  return [
    ["inputTokens", metrics.tokens.input], ["outputTokens", metrics.tokens.output], ["reasoningTokens", metrics.tokens.reasoning],
    ["elapsedMs", metrics.elapsedMs], ["toolCalls", metrics.toolCalls], ["filesRead", metrics.filesRead], ["filesModified", metrics.filesModified], ["buildAttempts", metrics.buildAttempts],
  ].filter(([name, value]) => value > budgets[name]).map(([name]) => name)
}

function summarizeAttempts(attempts, variants) {
  return variants.map(variant => {
    const selected = attempts.filter(attempt => attempt.variant === variant.id)
    const successful = selected.filter(attempt => attempt.status === "success")
    const costs = successful.map(attempt => attempt.metrics.costUsdNanos).sort((left, right) => left - right)
    return {
      id: variant.id,
      attempts: selected.length,
      successes: successful.length,
      successRateMillionths: selected.length ? Math.round(successful.length / selected.length * 1_000_000) : null,
      costPerSuccessUsdNanos: successful.length && selected.every(attempt => attempt.attribution !== "incomplete") ? Math.round(selected.reduce((total, attempt) => total + attempt.metrics.costUsdNanos, 0) / successful.length) : null,
      medianSuccessfulCostUsdNanos: costs.length ? median(costs) : null,
      tokensPerSuccess: successful.length && selected.every(attempt => attempt.attribution !== "incomplete") ? Math.round(selected.reduce((total, attempt) => total + totalTokens(attempt.metrics.tokens), 0) / successful.length) : null,
      medianSuccessfulTokens: successful.length ? median(successful.map(attempt => totalTokens(attempt.metrics.tokens)).sort((left, right) => left - right)) : null,
    }
  })
}

function compareTooling(attempts, variants) {
  const baseline = variants.find(variant => variant.condition === "baseline")
  const assisted = variants.find(variant => variant.condition === "tool-assisted")
  if (!baseline || !assisted) return null
  const summaries = summarizeAttempts(attempts, variants)
  const before = summaries.find(summary => summary.id === baseline.id)
  const after = summaries.find(summary => summary.id === assisted.id)
  return {
    baseline: before,
    toolAssisted: after,
    tokenCostPerSuccessDelta: before.tokensPerSuccess === null || after.tokensPerSuccess === null ? null : after.tokensPerSuccess - before.tokensPerSuccess,
    monetaryCostPerSuccessDeltaUsdNanos: before.costPerSuccessUsdNanos === null || after.costPerSuccessUsdNanos === null ? null : after.costPerSuccessUsdNanos - before.costPerSuccessUsdNanos,
    identicalAcceptance: protocol.task.acceptance.sha256,
  }
}

function totalTokens(tokens) {
  return tokens.input + tokens.output + tokens.reasoning
}

function median(values) {
  const middle = Math.floor(values.length / 2)
  return values.length % 2 ? values[middle] : Math.round((values[middle - 1] + values[middle]) / 2)
}

function parseAcceptance(command) {
  let report
  try { report = JSON.parse(command.stdout.toString("utf8")) } catch { report = undefined }
  return {
    passed: command.status === 0 && report?.schema === 1 && report.passed === true,
    status: command.status,
    elapsedMs: command.elapsedMs,
    report: report ?? null,
  }
}

async function inventory(root, excluded) {
  const entries = []
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true }).then(values => values.sort((left, right) => left.name.localeCompare(right.name)))) {
      const path = join(directory, entry.name)
      const relativePath = relative(root, path).replaceAll(sep, "/")
      if (excluded(relativePath)) continue
      if (entry.isSymbolicLink()) throw new Error(`AI delivery evidence rejects symlink ${relativePath}`)
      if (entry.isDirectory()) await visit(path)
      else if (entry.isFile()) {
        const bytes = await readFile(path)
        entries.push({ path: relativePath, bytes, rawBytes: bytes.length, gzipBytes: gzipSync(bytes).length, sha256: sha256(bytes) })
      }
    }
  }
  try { await visit(root) } catch (error) {
    if (error.code !== "ENOENT") throw error
  }
  const hash = createHash("sha256")
  for (const entry of entries) hash.update(entry.path).update("\0").update(entry.bytes)
  return { entries, sha256: hash.digest("hex") }
}

function sourceExcluded(path) {
  return ["dist", "node_modules", ".git", ".kudzu", ".tools"].includes(path.split("/")[0])
}

async function copyInventory(entries, root, destination) {
  for (const entry of entries) {
    const target = join(destination, entry.path)
    await mkdir(dirname(target), { recursive: true })
    await cp(join(root, entry.path), target)
  }
}

function summarizeInventory(value) {
  return {
    files: value.entries.length,
    rawBytes: value.entries.reduce((total, entry) => total + entry.rawBytes, 0),
    gzipBytes: value.entries.reduce((total, entry) => total + entry.gzipBytes, 0),
    sha256: value.sha256,
    entries: value.entries.map(({ path, rawBytes, gzipBytes, sha256 }) => ({ path, rawBytes, gzipBytes, sha256 })),
  }
}

function retention(baseline, source) {
  const final = new Map(source.entries.map(entry => [entry.path, entry.sha256]))
  const retained = baseline.entries.filter(entry => final.get(entry.path) === entry.sha256)
  return {
    method: "byte-identical-files-v1",
    baselineFiles: baseline.entries.length,
    baselineBytes: baseline.entries.reduce((total, entry) => total + entry.rawBytes, 0),
    retainedFiles: retained.length,
    retainedBytes: retained.reduce((total, entry) => total + entry.rawBytes, 0),
  }
}

function commandResult(value) {
  return { status: value.status, signal: value.signal, error: value.error, timedOut: value.timedOut, elapsedMs: value.elapsedMs, stdoutSha256: sha256(value.stdout), stderrSha256: sha256(value.stderr) }
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`)
}

function plain(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex")
}

function elapsed(started) {
  return Number((performance.now() - started).toFixed(1))
}
