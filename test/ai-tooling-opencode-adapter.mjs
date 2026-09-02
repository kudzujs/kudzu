import { spawn } from "node:child_process"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"

const input = JSON.parse(await new Promise((resolve, reject) => {
  let value = ""
  process.stdin.setEncoding("utf8")
  process.stdin.on("data", chunk => { value += chunk })
  process.stdin.on("end", () => resolve(value))
  process.stdin.on("error", reject)
}))

await mkdir(join(input.workspace, ".tools"), { recursive: true })
const install = await run("npm", ["ci", "--ignore-scripts", "--no-audit", "--no-fund"], input.workspace, 120_000)
if (install.status !== 0) throw new Error(install.stderr || install.stdout)
const installed = JSON.parse(await readFile(join(input.workspace, "node_modules/@kudzujs/core/package.json"), "utf8"))
if (installed.version !== "0.16.14") throw new Error(`Expected @kudzujs/core 0.16.14, received ${installed.version}`)
await writeFile(join(input.workspace, ".tools/kudzu.mjs"), `import { spawnSync } from "node:child_process"\nimport { join } from "node:path"\nconst args = process.argv.slice(2)\nconst result = spawnSync(process.execPath, [join(import.meta.dirname, "../node_modules/@kudzujs/core/bin/kudzu.mjs"), ...args], { stdio: "inherit" })\nprocess.exitCode = result.status ?? 1\n`)

const context = input.publicContext.map(entry => entry.content).join("\n\n")
const commands = input.variant === "tool-assisted"
  ? "Available Kudzu commands: node .tools/kudzu.mjs build --json; node .tools/kudzu.mjs inspect --json; node .tools/kudzu.mjs explain --route / --json."
  : "Available Kudzu command: node .tools/kudzu.mjs build. Do not use --json, inspect, or explain in this condition."
const prompt = `${input.prompt}\n\n${context}\n\n${commands}\nUse ordinary file and shell tools only inside this workspace. Do not inspect or modify .tools. Complete the task by editing authored source, verify it with the available Kudzu command, and stop.`
const started = performance.now()
const execution = await run(process.env.OPENCODE_BIN ?? "opencode", ["run", "--pure", "--auto", "--model", input.model.id, "--format", "json", "--dir", input.workspace, prompt], input.workspace, input.budgets.elapsedMs)
process.stdout.write(execution.stdout)
process.stderr.write(execution.stderr)

const events = execution.stdout.trim().split("\n").filter(Boolean).map(line => JSON.parse(line))
const finishes = events.filter(event => event.type === "step_finish")
const toolEvents = events.filter(event => event.type === "tool_use")
const commandsUsed = toolEvents.filter(event => event.part.tool === "bash").map(event => event.part.state.input.command ?? "")
const prohibited = input.variant === "baseline" && commandsUsed.some(command => /\.tools\/kudzu\.mjs\s+(inspect|explain)|\.tools\/kudzu\.mjs\s+build\s+--json/.test(command))
const tools = toolEvents.flatMap(event => normalizeTool(event.part))
const usage = finishes.reduce((total, event) => ({
  inputTokens: total.inputTokens + event.part.tokens.input + event.part.tokens.cache.read,
  outputTokens: total.outputTokens + event.part.tokens.output,
  reasoningTokens: total.reasoningTokens + event.part.tokens.reasoning,
}), { inputTokens: 0, outputTokens: 0, reasoningTokens: 0 })
const sessionID = events.find(event => event.sessionID)?.sessionID ?? input.attempt
const trace = {
  schema: 1,
  provider: { requestId: sessionID, model: input.model.id, revision: input.model.revision },
  usage,
  providerCostUsd: finishes.reduce((total, event) => total + (event.part.cost ?? 0), 0),
  elapsedMs: Math.round(performance.now() - started),
  tools,
  buildAttempts: tools.filter(tool => tool.name === "build").length,
  correctionCycles: Math.max(0, tools.filter(tool => tool.name === "build").length - 1),
  prohibitedToolUse: prohibited,
  adapterStatus: execution.status,
}
await writeFile(input.trace, `${JSON.stringify(trace)}\n`)
if (execution.status !== 0 || prohibited) process.exitCode = execution.status || 2

function normalizeTool(part) {
  if (part.tool === "read") return [{ name: "read", path: part.state.input.filePath ?? part.state.input.path ?? null }]
  if (part.tool === "apply_patch" || part.tool === "write" || part.tool === "edit") return [{ name: "write", path: firstPatchPath(part.state.input.patchText) ?? part.state.input.filePath ?? null }]
  if (part.tool !== "bash") return [{ name: part.tool, path: null }]
  const command = part.state.input.command ?? ""
  if (/\.tools\/kudzu\.mjs\s+build\b/.test(command)) return [{ name: "build", path: null }]
  if (/\.tools\/kudzu\.mjs\s+inspect\b/.test(command)) return [{ name: "inspect", path: null }]
  if (/\.tools\/kudzu\.mjs\s+explain\b/.test(command)) return [{ name: "explain", path: null }]
  return [{ name: "shell", path: null }]
}

function firstPatchPath(patch) {
  return typeof patch === "string" ? /^\*\*\* (?:Add|Update|Delete) File: (.+)$/m.exec(patch)?.[1] ?? null : null
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
