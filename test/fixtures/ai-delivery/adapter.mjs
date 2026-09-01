import { readFile, writeFile } from "node:fs/promises"
import { spawnSync } from "node:child_process"
import { resolve } from "node:path"

const input = JSON.parse(await new Promise((resolveInput, reject) => {
  let value = ""
  process.stdin.setEncoding("utf8")
  process.stdin.on("data", chunk => { value += chunk })
  process.stdin.on("end", () => resolveInput(value))
  process.stdin.on("error", reject)
}))
const source = resolve(input.workspace, "src/value.txt")
const before = await readFile(source, "utf8")
const successful = input.ordinal === 0
await writeFile(source, before.replace("Pending", successful ? "Ready" : "Wrong"))
const build = spawnSync(process.execPath, ["build.mjs"], { cwd: input.workspace, encoding: "utf8" })
if (build.status !== 0) throw new Error(build.stderr || build.stdout)
await writeFile(input.trace, `${JSON.stringify({
  schema: 1,
  provider: { requestId: `fixture-${input.attempt}`, model: input.model.id, revision: input.model.revision },
    usage: { inputTokens: 20, outputTokens: 5, reasoningTokens: 0 },
    elapsedMs: 10,
  tools: [{ name: "read", path: "src/value.txt" }, { name: "write", path: "src/value.txt" }],
  buildAttempts: 1,
  correctionCycles: 0
})}\n`)
if (!successful) process.stderr.write("deliberate fixture failure retained by the runner\n")
