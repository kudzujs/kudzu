#!/usr/bin/env node

import * as module from "node:module"

const command = process.argv[2] ?? "dev"

if (command === "build" || command === "dev") {
  module.enableCompileCache?.()
  const { build, dev } = await import("../framework/build.mjs")
  await (command === "build" ? build : dev)()
} else {
  console.error(`Unknown command: ${command}\nUse: kudzu <build|dev>`)
  process.exitCode = 1
}
