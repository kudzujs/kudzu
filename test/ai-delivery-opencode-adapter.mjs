import { spawn, spawnSync } from "node:child_process"
import { renameSync, writeFileSync } from "node:fs"

const started = performance.now()

const input = JSON.parse(await new Promise((resolve, reject) => {
  let value = ""
  process.stdin.setEncoding("utf8")
  process.stdin.on("data", chunk => { value += chunk })
  process.stdin.on("end", () => resolve(value))
  process.stdin.on("error", reject)
}))

const deadline = input.deadline ?? Date.now() + input.budgets.elapsedMs
const events = []
let pending = ""
let invalid = false
let timedOut = false
persist(null, false)
const install = await run("npm", ["ci", "--ignore-scripts", "--no-audit", "--no-fund"], 120_000)

const context = input.publicContext.map(entry => entry.content).join("\n\n")
const prompt = `${input.prompt}\n\n${context}\n\nUse only ordinary file and shell tools inside this workspace. Do not inspect files outside the workspace. Do not edit generated output, package manifests, lockfiles, or test infrastructure. Implement the requested feature in authored source, run npm run build, and stop.`
const execution = install.status === 0 && !timedOut
  ? await run(process.env.OPENCODE_BIN ?? "opencode", ["run", "--pure", "--auto", "--model", input.model.id, "--format", "json", "--dir", input.workspace, prompt], Infinity, true)
  : install
if (pending.trim()) record(pending)
persist(execution.status, execution.status === 0 && !timedOut && !invalid && events.some(event => event.type === "step_finish") && !events.some(event => event.type === "error"))
if (execution.status !== 0 || timedOut || invalid) process.exitCode = 1

function record(line) {
  if (!line.trim()) return
  try { events.push(JSON.parse(line)) } catch { invalid = true }
}

function persist(status, complete) {
const finishes = events.filter(event => event.type === "step_finish")
const toolEvents = events.filter(event => event.type === "tool_use")
const tools = toolEvents.flatMap(event => normalizeTool(event.part))
const usage = finishes.reduce((total, event) => ({
  inputTokens: total.inputTokens + event.part.tokens.input + event.part.tokens.cache.read,
  outputTokens: total.outputTokens + event.part.tokens.output,
  reasoningTokens: total.reasoningTokens + event.part.tokens.reasoning,
}), { inputTokens: 0, outputTokens: 0, reasoningTokens: 0 })
const sessionID = events.find(event => event.sessionID)?.sessionID ?? input.attempt
// Atomic checkpoints retain the last complete record even if the runner kills us mid-write.
writeFileSync(`${input.trace}.tmp`, `${JSON.stringify({
  schema: 1,
  provider: { requestId: sessionID, model: input.model.id, revision: input.model.revision },
  usage,
  providerCostUsd: finishes.reduce((total, event) => total + (event.part.cost ?? 0), 0),
  elapsedMs: Math.round(performance.now() - started),
  tools,
  buildAttempts: tools.filter(tool => tool.name === "build").length,
  correctionCycles: Math.max(0, tools.filter(tool => tool.name === "build").length - 1),
  adapterStatus: status,
  complete,
  timedOut,
})}\n`)
renameSync(`${input.trace}.tmp`, input.trace)
}

function normalizeTool(part) {
  if (part.tool === "read") return [{ name: "read", path: part.state.input.filePath ?? part.state.input.path ?? null }]
  if (["apply_patch", "write", "edit"].includes(part.tool)) return patchPaths(part.state.input.patchText).map(path => ({ name: "write", path })).concat(part.state.input.filePath ? [{ name: "write", path: part.state.input.filePath }] : [])
  if (part.tool === "grep" || part.tool === "glob") return [{ name: part.tool, path: part.state.input.path ?? null }]
  if (part.tool !== "bash") return [{ name: part.tool, path: null }]
  const command = part.state.input.command ?? ""
  return [{ name: /(?:npm\s+run\s+build|\bkudzu\s+build\b|\bvite\s+build\b)/.test(command) ? "build" : "shell", path: null }]
}

function patchPaths(patch) {
  return typeof patch === "string" ? [...patch.matchAll(/^\*\*\* (?:Add|Update|Delete) File: (.+)$/gm)].map(match => match[1]) : []
}

function run(command, args, timeout, model = false) {
  return new Promise(resolve => {
    const remaining = Math.min(timeout, deadline - Date.now())
    if (remaining <= 0) { timedOut = true; persist(null, false); resolve({ status: null }); return }
    const managed = process.env.KUDZU_AI_DELIVERY_GROUP === "1"
    const child = spawn(command, args, { cwd: input.workspace, env: process.env, detached: process.platform !== "win32" && !managed, stdio: ["ignore", "pipe", "pipe"] })
    const timer = setTimeout(() => {
      timedOut = true
      persist(null, false)
      if (!child.pid) return
      if (process.platform === "win32") {
        const killed = spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"])
        if (killed.error || killed.status !== 0) throw new Error("Could not terminate adapter child tree")
      } else {
        try { process.kill(-(managed ? process.pid : child.pid), "SIGKILL") } catch (error) { if (error.code !== "ESRCH") throw error }
      }
    }, remaining)
    child.stdout.setEncoding("utf8").on("data", chunk => {
      process.stdout.write(chunk)
      if (!model) return
      pending += chunk
      const lines = pending.split("\n")
      pending = lines.pop()
      for (const line of lines) record(line)
      persist(null, false)
    })
    child.stderr.on("data", chunk => process.stderr.write(chunk))
    child.on("close", status => { clearTimeout(timer); resolve({ status }) })
    child.on("error", error => { clearTimeout(timer); process.stderr.write(error.message); resolve({ status: 1 }) })
  })
}
