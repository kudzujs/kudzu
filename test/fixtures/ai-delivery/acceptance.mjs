import { readFile } from "node:fs/promises"
import { resolve } from "node:path"

const html = await readFile(resolve(process.argv[2], "dist/index.html"), "utf8")
const passed = /<button>Ready<\/button>/.test(html) && !/aria-hidden/.test(html)
process.stdout.write(`${JSON.stringify({ schema: 1, passed, checks: [{ id: "accessible Ready button", passed }], browser: { engine: "fixture", version: "1" } })}\n`)
if (!passed) process.exitCode = 1
