#!/usr/bin/env node

import { build, dev } from "../framework/build.mjs"

const command = process.argv[2] ?? "dev"

if (command === "build") {
  await build()
} else if (command === "dev") {
  await dev()
} else {
  console.error(`Unknown command: ${command}\nUse: kudzu <build|dev>`)
  process.exitCode = 1
}
