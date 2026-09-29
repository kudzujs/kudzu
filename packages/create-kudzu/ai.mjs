import { spawn, spawnSync } from "node:child_process"
import { mkdir, mkdtemp, open, readFile, realpath } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { parseArgs } from "node:util"

export async function docs(root, heading) {
  const directory = join(root, "node_modules/@kudzujs/core")
  const { version } = JSON.parse(await readFile(join(directory, "package.json"), "utf8"))
  const path = join(directory, "README.md")
  const lines = (await readFile(path, "utf8")).split(/\r?\n/)
  const sections = []
  let fence
  for (const [index, line] of lines.entries()) {
    const delimiter = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/)
    if (delimiter) {
      if (!fence) fence = delimiter[1]
      else if (delimiter[1][0] === fence[0] && delimiter[1].length >= fence.length && !delimiter[2].trim()) fence = undefined
      continue
    }
    const title = !fence && line.match(/^##[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$/)
    if (title) sections.push({ heading: title[1], start: index })
  }
  const result = { version, path, headings: sections.map(section => section.heading) }
  if (heading === undefined) return result
  const matches = sections.filter(section => section.heading.toLowerCase() === heading.toLowerCase())
  if (matches.length !== 1) throw new Error(`Expected one exact README heading. Available: ${result.headings.join(", ")}`)
  const section = matches[0], end = sections[sections.indexOf(section) + 1]?.start ?? lines.length
  const text = lines.slice(section.start, end).join("\n")
  return { version, path, heading: section.heading, startLine: section.start + 1, endLine: end, text: text.slice(0, 6000), truncated: text.length > 6000 }
}

export async function check(root, timeoutMs = 300000) {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 1200000) throw new Error("timeout-ms must be an integer from 1 to 1200000")
  root = await realpath(root)
  if (process.env.KUDZU_AI_CHECK_ROOT === root) throw new Error("scripts.check must not invoke ai check recursively")
  const manifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"))
  if (typeof manifest.scripts?.check !== "string" || !manifest.scripts.check.trim()) throw new Error("package.json must define scripts.check")
  const logs = join(root, ".kudzu-ai")
  await mkdir(logs, { recursive: true })
  const directory = await mkdtemp(join(logs, "check-")), path = join(directory, "output.log")
  const log = await open(path, "wx+")
  const start = performance.now()
  const managed = process.env.KUDZU_AI_DELIVERY_GROUP === "1"
  try {
    const result = await new Promise(resolveRun => {
      const child = spawn(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "check"], {
        cwd: root, detached: process.platform !== "win32" && !managed, shell: process.platform === "win32",
        stdio: ["ignore", log.fd, log.fd], env: { ...process.env, FORCE_COLOR: "0", KUDZU_AI_CHECK_ROOT: root },
      })
      let timedOut = false, interrupted = null, error = null
      const terminate = () => {
        if (!child.pid || child.exitCode !== null || child.signalCode !== null) return
        if (process.platform === "win32") {
          const killed = spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { encoding: "utf8" })
          if (killed.status !== 0) error = killed.error?.message ?? killed.stderr ?? "Could not terminate check tree"
        } else {
          const pids = [managed ? child.pid : -child.pid]
          if (managed) {
            // Keep the outer group alive on this tool's timeout; stop only its ordinary descendants.
            const table = spawnSync("ps", ["-A", "-o", "pid=", "-o", "ppid="], { encoding: "utf8", timeout: 1000, maxBuffer: 1024 * 1024 })
            if (table.status !== 0) error = table.error?.message || table.stderr?.trim() || "Could not inspect managed check descendants"
            else {
              const parents = table.stdout.trim().split("\n").map(line => line.trim().split(/\s+/).map(Number))
              if (parents.some(row => row.length !== 2 || row.some(id => !Number.isSafeInteger(id) || id < 0))) error = "Invalid managed check process table"
              else for (let index = 0; index < pids.length; index++) for (const [pid, parent] of parents) {
                if (parent === pids[index] && pid > 1 && pid !== process.pid && !pids.includes(pid)) pids.push(pid)
              }
            }
          }
          for (const pid of pids.reverse()) try { process.kill(pid, "SIGKILL") } catch (failure) { if (failure.code !== "ESRCH") error = failure.message }
        }
      }
      const onInterrupt = signal => { interrupted = signal; terminate() }
      const onSigint = () => onInterrupt("SIGINT"), onSigterm = () => onInterrupt("SIGTERM")
      process.once("SIGINT", onSigint)
      process.once("SIGTERM", onSigterm)
      const timer = setTimeout(() => { timedOut = true; terminate() }, timeoutMs)
      child.once("error", failure => { error = failure.message })
      child.once("close", (exitCode, signal) => {
        clearTimeout(timer)
        process.removeListener("SIGINT", onSigint)
        process.removeListener("SIGTERM", onSigterm)
        resolveRun({ exitCode, signal, timedOut, interrupted, error })
      })
    })
    const { size } = await log.stat()
    const passed = result.exitCode === 0 && !result.timedOut && !result.interrupted && !result.error
    const limit = passed ? 512 : 4096
    const buffer = Buffer.alloc(Math.min(size, limit))
    // ponytail: a bounded excerpt never substitutes for the retained full log.
    let excerpt
    if (size <= limit) {
      const { bytesRead } = await log.read(buffer, 0, buffer.length, 0)
      excerpt = buffer.subarray(0, bytesRead).toString("utf8")
    } else if (passed) {
      await log.read(buffer, 0, limit, size - limit)
      excerpt = buffer.toString("utf8")
    } else {
      const middle = Buffer.alloc(8192)
      let diagnostic = ""
      // ponytail: scan at most the first MiB for a useful error; the full log stays on disk.
      for (let offset = 2048; offset < Math.min(size - 2048, 1 << 20); offset += middle.length - 128) {
        const length = Math.min(middle.length, size - 2048 - offset)
        await log.read(middle, 0, length, offset)
        const text = middle.subarray(0, length).toString("utf8")
        const match = /(?:\berror(?: TS\d{4})?|\bfailed)\s*:|\bTS\d{4}\s*:|✖/i.exec(text)
        if (!match) continue
        const start = Math.max(text.lastIndexOf("\n", match.index) + 1, match.index - 120)
        const end = text.indexOf("\n", match.index)
        diagnostic = text.slice(start, end < 0 ? match.index + 240 : Math.min(end, match.index + 240)).trim()
        break
      }
      const edge = diagnostic ? 1536 : 2048
      await log.read(buffer, 0, edge, 0)
      await log.read(buffer, edge, edge, size - edge)
      excerpt = buffer.subarray(0, edge).toString("utf8") + "\n[... omitted; read full output.log ...]\n" + (diagnostic ? diagnostic.slice(0, 400) + "\n[... omitted ...]\n" : "") + buffer.subarray(edge, edge * 2).toString("utf8")
    }
    return {
      command: "npm run check", passed,
      ...result, elapsedMs: Math.round(performance.now() - start),
      log: { path, bytes: size, excerpt, truncated: size > limit },
      browserVerified: false, note: "Fresh check result only; later edits invalidate it. Compiler success is not browser or accessibility proof.",
    }
  } finally {
    await log.close()
  }
}

if (process.argv[1] && await realpath(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { positionals, values } = parseArgs({ allowPositionals: true, strict: true, options: { "timeout-ms": { type: "string" } } })
    const root = dirname(fileURLToPath(import.meta.url)), [command, heading] = positionals
    let result
    if (command === "docs" && positionals.length <= 2 && values["timeout-ms"] === undefined) result = await docs(root, heading)
    else if (command === "check" && positionals.length === 1) {
      if (values["timeout-ms"] !== undefined && !/^\d+$/.test(values["timeout-ms"])) throw new Error("timeout-ms must be a decimal integer")
      result = await check(root, values["timeout-ms"] === undefined ? undefined : Number(values["timeout-ms"]))
      if (!result.passed) process.exitCode = result.exitCode || 1
    } else throw new Error("Use: npm run ai -- docs [heading] | npm run ai -- check [--timeout-ms 300000]")
    process.stdout.write(JSON.stringify(result) + "\n")
  } catch (error) {
    process.stderr.write(JSON.stringify({ error: error.message }) + "\n")
    process.exitCode = 1
  }
}
