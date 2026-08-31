#!/usr/bin/env node

import * as module from "node:module"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const command = process.argv[2] ?? "dev"

if ((command === "build" || command === "inspect") && !process.env.KUDZU_BUILD_CHILD) {
  const child = spawnSync(process.execPath, ["--expose-gc", "--max-semi-space-size=8", fileURLToPath(import.meta.url), ...process.argv.slice(2)], {
    stdio: "inherit",
    env: { ...process.env, KUDZU_BUILD_CHILD: "1" }
  })
  if (child.error) throw child.error
  process.exitCode = child.status ?? 1
} else if (command === "build" || command === "dev" || command === "inspect") {
  module.enableCompileCache?.()
  const { build, dev, inspect } = await import("../framework/build.mjs")
  const json = command === "build" && process.argv.includes("--json")
  try {
    if (command === "inspect") {
      if (!process.argv.includes("--json")) {
        console.error("Use: kudzu inspect --json")
        process.exitCode = 1
      } else {
        const log = console.log
        console.log = console.error
        try {
          process.stdout.write(`${JSON.stringify(await inspect())}\n`)
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
  console.error(`Unknown command: ${command}\nUse: kudzu <build|dev|inspect>`)
  process.exitCode = 1
}
