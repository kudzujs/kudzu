#!/usr/bin/env node

import * as module from "node:module"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const command = process.argv[2] ?? "dev"

if (command === "build" && !process.env.KUDZU_BUILD_CHILD) {
  const child = spawnSync(process.execPath, ["--expose-gc", "--max-semi-space-size=8", fileURLToPath(import.meta.url), ...process.argv.slice(2)], {
    stdio: "inherit",
    env: { ...process.env, KUDZU_BUILD_CHILD: "1" }
  })
  if (child.error) throw child.error
  process.exitCode = child.status ?? 1
} else if (command === "build" || command === "dev") {
  module.enableCompileCache?.()
  const { build, dev } = await import("../framework/build.mjs")
  await (command === "build" ? build : dev)()
} else {
  console.error(`Unknown command: ${command}\nUse: kudzu <build|dev>`)
  process.exitCode = 1
}
