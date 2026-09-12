import { createHash } from "node:crypto"
import { readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { parseArgs } from "node:util"
import { fileURLToPath } from "node:url"

const hash = value => createHash("sha256").update(value).digest("hex")
const readTools = new Set(["read", "glob", "grep", "list"])
const usageKeys = ["input", "cacheRead", "cacheWrite", "output", "reasoning"]
const emptyUsage = () => Object.fromEntries(usageKeys.map(key => [key, 0]))

export function auditTrace(text) {
  const steps = [], tools = [], ignoredLines = [], errors = []
  const seenSteps = new Set(), started = new Set(), observations = new Map()
  let sessionID, mutationEpoch = 0
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (!line.trim()) continue
    const lineNumber = index + 1
    if (!line.trimStart().startsWith("{")) { ignoredLines.push(lineNumber); continue }
    let event
    try { event = JSON.parse(line) } catch { throw new Error(`Invalid JSON at line ${lineNumber}`) }
    if (typeof event.type !== "string") throw new Error(`Missing event type at line ${lineNumber}`)
    if (event.sessionID) {
      if (sessionID && sessionID !== event.sessionID) throw new Error(`Mixed sessions at line ${lineNumber}`)
      sessionID = event.sessionID
    }
    const part = event.part ?? {}, message = part.messageID
    if (event.type === "error") errors.push(lineNumber)
    if (event.type === "step_start") {
      if (!message) throw new Error(`Missing step message at line ${lineNumber}`)
      started.add(message)
    }
    if (event.type === "step_finish") {
      if (!message || seenSteps.has(message)) throw new Error(`Missing or duplicate finished message at line ${lineNumber}`)
      seenSteps.add(message)
      const tokens = part.tokens
      const usage = { input: tokens?.input, cacheRead: tokens?.cache?.read, cacheWrite: tokens?.cache?.write, output: tokens?.output, reasoning: tokens?.reasoning }
      if (Object.values(usage).some(value => !Number.isSafeInteger(value) || value < 0)) throw new Error(`Invalid usage at line ${lineNumber}`)
      steps.push({ line: lineNumber, message, reason: part.reason ?? null, usage })
    }
    if (event.type !== "tool_use") continue
    const state = part.state
    if (typeof part.tool !== "string" || !message || !state || typeof state.input !== "object" || state.input === null) throw new Error(`Invalid tool event at line ${lineNumber}`)
    const output = typeof state.output === "string" ? state.output : null
    const tool = {
      line: lineNumber, message, name: part.tool, status: state.status,
      input: state.input, outputBytes: output === null ? null : Buffer.byteLength(output),
      truncated: state.metadata?.truncated === true || state.metadata?.display?.truncated === true,
    }
    // ponytail: shell parsing is deliberately heuristic; review these candidates before phase attribution.
    tool.buildCandidate = part.tool === "bash" && /(?:^|[;&|\n])\s*(?:npm\s+run\s+build|(?:npx\s+)?(?:kudzu|vite)\s+build)\b/.test(state.input.command ?? "")
    if (readTools.has(part.tool) && state.status === "completed" && output !== null && !tool.truncated) {
      const signature = hash(JSON.stringify([part.tool, canonical(state.input), output]))
      const previous = observations.get(signature)
      if (previous) tool.exactRepeat = { line: previous.line, interveningPotentialMutation: previous.epoch !== mutationEpoch }
      observations.set(signature, { line: lineNumber, epoch: mutationEpoch })
    } else if (!readTools.has(part.tool) && part.tool !== "todowrite") mutationEpoch++
    tools.push(tool)
  }
  if (!steps.length) throw new Error("No recorded model usage")
  const firstBuild = tools.find(tool => tool.buildCandidate) ?? null
  const buildStep = firstBuild ? steps.findIndex(step => step.message === firstBuild.message) : -1
  const phases = Object.fromEntries(["beforeFirstBuild", "firstBuildMessage", "afterFirstBuild", "unpartitioned"].map(name => [name, { steps: 0, usage: emptyUsage(), legacyNormalizedTokens: 0 }]))
  for (const [index, step] of steps.entries()) {
    step.phase = buildStep === -1 ? "unpartitioned" : index < buildStep ? "beforeFirstBuild" : index === buildStep ? "firstBuildMessage" : "afterFirstBuild"
    const phase = phases[step.phase]
    phase.steps++
    for (const key of usageKeys) phase.usage[key] += step.usage[key]
    // Match the existing adapter, not a new invoice interpretation. Cache writes remain separate.
    phase.legacyNormalizedTokens += step.usage.input + step.usage.cacheRead + step.usage.output + step.usage.reasoning
  }
  const totals = emptyUsage()
  for (const phase of Object.values(phases)) for (const key of usageKeys) totals[key] += phase.usage[key]
  const unfinishedMessages = [...new Set([...started, ...tools.map(tool => tool.message)])].filter(message => !seenSteps.has(message))
  return {
    sha256: hash(text), sessionID: sessionID ?? null, ignoredLines, errors,
    recordedSteps: steps.length, unfinishedMessages,
    terminalStopObserved: steps.at(-1).reason === "stop" && !unfinishedMessages.length && !errors.length,
    firstBuildCandidate: firstBuild ? { line: firstBuild.line, message: firstBuild.message, command: firstBuild.input.command } : null,
    phases, usage: totals,
    legacyNormalizedTokens: Object.values(phases).reduce((sum, phase) => sum + phase.legacyNormalizedTokens, 0),
    toolCalls: tools.length,
    recordedToolOutputBytes: tools.reduce((sum, tool) => sum + (tool.outputBytes ?? 0), 0),
    missingOutputLines: tools.filter(tool => tool.outputBytes === null).map(tool => tool.line),
    truncatedOutputLines: tools.filter(tool => tool.truncated).map(tool => tool.line),
    exactRepeatedObservations: tools.filter(tool => tool.exactRepeat).map(tool => ({ line: tool.line, name: tool.name, input: tool.input, outputBytes: tool.outputBytes, previousLine: tool.exactRepeat.line, interveningPotentialMutation: tool.exactRepeat.interveningPotentialMutation })),
    tools, steps,
  }
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]))
  return value
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { values, positionals } = parseArgs({ options: { out: { type: "string" }, details: { type: "boolean" } }, allowPositionals: true, strict: true })
  if (!positionals.length) throw new Error("Use: node test/ai-harness-audit.mjs [--details] [--out report.json] <adapter.stdout> ...")
  const reports = []
  for (const file of positionals) {
    try {
      const report = auditTrace(await readFile(file, "utf8"))
      if (!values.details) { delete report.tools; delete report.steps }
      reports.push({ file: resolve(file), status: "audited", ...report })
    } catch (error) {
      reports.push({ file: resolve(file), status: "invalid", error: error.message })
    }
  }
  const complete = reports.every(report => report.status === "audited")
  const report = JSON.stringify({ schema: 1, complete, caveat: "Read-only recorded-event audit. Build boundaries are heuristic; steps are not per-command costs. Exact repeats are review candidates, not safe cache hits or token savings. Output bytes exclude metadata and are not guaranteed model-visible context. Terminal stop does not establish task acceptance or complete billing.", reports }, null, 2) + "\n"
  if (values.out) await writeFile(values.out, report, { flag: "wx" })
  else process.stdout.write(report)
  if (!complete) process.exitCode = 1
}
