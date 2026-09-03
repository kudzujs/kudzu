import { spawn } from "node:child_process"
import { readFile, writeFile } from "node:fs/promises"

const input = JSON.parse(await new Promise((resolve, reject) => {
  let value = ""
  process.stdin.setEncoding("utf8")
  process.stdin.on("data", chunk => { value += chunk })
  process.stdin.on("end", () => resolve(value))
  process.stdin.on("error", reject)
}))

const install = await run("npm", ["ci", "--ignore-scripts", "--no-audit", "--no-fund"], input.workspace, 120_000)
if (install.status !== 0) throw new Error(install.stderr || install.stdout)

const context = input.publicContext.map(entry => entry.content).join("\n\n")
const prompt = `${input.prompt}\n\n${context}\n\nUse only ordinary file and shell tools inside this workspace. Do not inspect files outside the workspace. Do not edit generated output, package manifests, lockfiles, or test infrastructure. Implement the requested feature in authored source, run npm run build, and stop.`
const started = performance.now()
const execution = await run(process.env.OPENCODE_BIN ?? "opencode", ["run", "--pure", "--auto", "--model", input.model.id, "--format", "json", "--dir", input.workspace, prompt], input.workspace, input.budgets.elapsedMs)
process.stdout.write(execution.stdout)
process.stderr.write(execution.stderr)

const events = execution.stdout.trim().split("\n").filter(Boolean).map(line => JSON.parse(line))
const finishes = events.filter(event => event.type === "step_finish")
const toolEvents = events.filter(event => event.type === "tool_use")
const tools = toolEvents.flatMap(event => normalizeTool(event.part))
const usage = finishes.reduce((total, event) => ({
  inputTokens: total.inputTokens + event.part.tokens.input + event.part.tokens.cache.read,
  outputTokens: total.outputTokens + event.part.tokens.output,
  reasoningTokens: total.reasoningTokens + event.part.tokens.reasoning,
}), { inputTokens: 0, outputTokens: 0, reasoningTokens: 0 })
const sessionID = events.find(event => event.sessionID)?.sessionID ?? input.attempt
await writeFile(input.trace, `${JSON.stringify({
  schema: 1,
  provider: { requestId: sessionID, model: input.model.id, revision: input.model.revision },
  usage,
  providerCostUsd: finishes.reduce((total, event) => total + (event.part.cost ?? 0), 0),
  elapsedMs: Math.round(performance.now() - started),
  tools,
  buildAttempts: tools.filter(tool => tool.name === "build").length,
  correctionCycles: Math.max(0, tools.filter(tool => tool.name === "build").length - 1),
  adapterStatus: execution.status,
})}\n`)
if (execution.status !== 0) process.exitCode = execution.status || 1

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

function run(command, args, cwd, timeout) {
  return new Promise(resolve => {
    const child = spawn(command, args, { cwd, env: process.env, stdio: ["ignore", "pipe", "pipe"] })
    let stdout = ""
    let stderr = ""
    const timer = setTimeout(() => child.kill("SIGKILL"), timeout)
    child.stdout.setEncoding("utf8").on("data", chunk => { stdout += chunk })
    child.stderr.setEncoding("utf8").on("data", chunk => { stderr += chunk })
    child.on("close", status => { clearTimeout(timer); resolve({ status, stdout, stderr }) })
    child.on("error", error => { clearTimeout(timer); resolve({ status: 1, stdout, stderr: `${stderr}${error.message}` }) })
  })
}
