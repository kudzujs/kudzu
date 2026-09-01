import { mkdir, readFile, writeFile } from "node:fs/promises"

const value = (await readFile(new URL("./src/value.txt", import.meta.url), "utf8")).trim()
await mkdir(new URL("./dist", import.meta.url), { recursive: true })
await writeFile(new URL("./dist/index.html", import.meta.url), `<!doctype html><html><body><button>${value}</button></body></html>`)
