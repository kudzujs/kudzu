import { spawn } from "node:child_process"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { parseArgs } from "node:util"

const { values } = parseArgs({ options: { out: { type: "string" }, summarize: { type: "boolean" } }, strict: true })
const output = resolve(values.out ?? `test-results/ai-delivery-production/${new Date().toISOString().replaceAll(":", "-")}`)
const tasks = ["content", "forms", "crud", "commerce", "realtime"]
const runner = resolve("test/ai-delivery-runner.mjs")
await mkdir(output, { recursive: true })

if (!values.summarize) {
  for (const task of tasks) {
    const protocol = resolve(`test/fixtures/ai-delivery-production/${task}/protocol.json`)
    const result = await run(process.execPath, [runner, "--protocol", protocol, "--out", resolve(output, task)])
    await writeFile(resolve(output, `${task}.stdout`), result.stdout)
    await writeFile(resolve(output, `${task}.stderr`), result.stderr)
    if (result.status !== 0) throw new Error(`${task} protocol failed to execute: ${result.stderr || result.stdout}`)
  }
}

const runs = await Promise.all(tasks.map(task => readFile(resolve(output, task, "run.json"), "utf8").then(JSON.parse)))
const variants = ["kudzu", "react-vite"].map(id => {
  const attempts = runs.flatMap(run => run.attempts.filter(attempt => attempt.variant === id))
  const successful = attempts.filter(attempt => attempt.status === "success")
  const taskCosts = runs.map(run => run.variants.find(variant => variant.id === id).tokensPerSuccess)
  return {
    id,
    attempts: attempts.length,
    successes: successful.length,
    successRateMillionths: Math.round(successful.length / attempts.length * 1_000_000),
    taskTokenCostPerSuccess: taskCosts,
    medianTaskTokenCostPerSuccess: taskCosts.every(value => value !== null) ? median([...taskCosts].sort((left, right) => left - right)) : null,
    medians: Object.fromEntries(["elapsedMs", "toolCalls", "filesRead", "filesModified", "buildAttempts", "correctionCycles"].map(field => [field, successful.length ? median(successful.map(attempt => attempt.metrics[field]).sort((left, right) => left - right)) : null])),
  }
})
const complete = runs.every(run => run.status === "complete")
const attributable = runs.every(run => run.attempts.every(attempt => attempt.attribution !== "incomplete"))
const suite = {
  schema: 1,
  packet: "0.21.4",
  status: complete && attributable ? "complete" : "incomplete",
  methodology: "five predeclared production task classes; five interleaved attempts per framework and task; failures retained in cost-per-success denominators",
  tasks: runs.map((run, index) => ({ id: tasks[index], protocol: run.protocol, status: run.status, variants: run.variants })),
  variants,
}
await writeFile(resolve(output, "suite.json"), `${JSON.stringify(suite, null, 2)}\n`)
process.stdout.write(`${JSON.stringify(suite)}\n`)

function median(values) {
  const middle = Math.floor(values.length / 2)
  return values.length % 2 ? values[middle] : Math.round((values[middle - 1] + values[middle]) / 2)
}

function run(command, args) {
  return new Promise(resolveRun => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"], env: process.env })
    let stdout = ""
    let stderr = ""
    child.stdout.setEncoding("utf8").on("data", chunk => { stdout += chunk })
    child.stderr.setEncoding("utf8").on("data", chunk => { stderr += chunk })
    child.on("close", status => resolveRun({ status, stdout, stderr }))
    child.on("error", error => resolveRun({ status: 1, stdout, stderr: `${stderr}${error.message}` }))
  })
}
