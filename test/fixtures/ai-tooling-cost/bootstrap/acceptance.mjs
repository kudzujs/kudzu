import { readFile } from "node:fs/promises"
import { join } from "node:path"

const workspace = process.argv[2]
const html = await readFile(join(workspace, "dist/index.html"), "utf8")
const compiled = await readFile(join(workspace, ".kudzu/pages/index.mjs"), "utf8")
const checks = [
  { id: "preserves Questions row and six-column breakpoint", passed: /<div class="row"><div class="col-md-6">Questions<\/div><\/div>/.test(html) },
  { id: "keeps route JavaScript-free", passed: !/<script\b|data-k-(?:on|state|text|attr|list|condition)/.test(html) },
  { id: "erases React Bootstrap from build output", passed: !/react-bootstrap|\bRow\b|\bCol\b/.test(compiled) },
]
const report = { schema: 1, passed: checks.every(check => check.passed), checks, browser: { engine: "static-html", version: "1" } }
process.stdout.write(`${JSON.stringify(report)}\n`)
if (!report.passed) process.exitCode = 1
