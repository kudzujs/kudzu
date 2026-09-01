#!/usr/bin/env node

import * as module from "node:module"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const command = process.argv[2] ?? "dev"

if ((command === "build" || command === "inspect" || command === "explain") && !process.env.KUDZU_BUILD_CHILD) {
  const child = spawnSync(process.execPath, ["--expose-gc", "--max-semi-space-size=8", fileURLToPath(import.meta.url), ...process.argv.slice(2)], {
    stdio: "inherit",
    env: { ...process.env, KUDZU_BUILD_CHILD: "1" }
  })
  if (child.error) throw child.error
  process.exitCode = child.status ?? 1
} else if (command === "build" || command === "dev" || command === "inspect" || command === "explain") {
  module.enableCompileCache?.()
  const { build, dev, explain, inspect } = await import("../framework/build.mjs")
  const json = (command === "build" || command === "explain") && process.argv.includes("--json")
  try {
    if (command === "inspect" || command === "explain") {
      const args = process.argv.slice(3)
      const routeIndex = args.indexOf("--route")
      const route = routeIndex === -1 ? undefined : args[routeIndex + 1]
      const validExplain = command !== "explain" || args.length === 3 && args.filter(arg => arg === "--json").length === 1 && args.filter(arg => arg === "--route").length === 1 && route && !route.startsWith("--") && args.every((arg, index) => arg === "--json" || arg === "--route" || index === routeIndex + 1)
      if (!process.argv.includes("--json")) {
        console.error(command === "inspect" ? "Use: kudzu inspect --json" : "Use: kudzu explain --route <route> --json")
        process.exitCode = 1
      } else if (!validExplain) {
        console.error("Use: kudzu explain --route <route> --json")
        process.exitCode = 1
      } else {
        const log = console.log
        console.log = console.error
        try {
          process.stdout.write(`${JSON.stringify(await (command === "inspect" ? inspect() : explain({ route })))}\n`)
        } finally {
          console.log = log
        }
      }
    } else await (command === "build" ? build({ quiet: json }) : dev())
  } catch (error) {
    const { diagnosticEnvelope } = await import("../framework/compiler/diagnostics.mjs")
    const envelope = diagnosticEnvelope(error)
    if (!envelope) throw error
    console.error(json ? JSON.stringify(envelope) : error.message)
    process.exitCode = 1
  }
} else {
  console.error(`Unknown command: ${command}\nUse: kudzu <build|dev|inspect|explain>`)
  process.exitCode = 1
}
