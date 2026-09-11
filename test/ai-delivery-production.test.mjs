import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFile, readdir } from "node:fs/promises"
import { dirname, join, relative, resolve } from "node:path"
import test from "node:test"

const root = resolve("test/fixtures/ai-delivery-production")
const tasks = ["content", "forms", "crud", "commerce", "realtime"]
const protocolHashes = {
  content: "ec147c8578b18ad04e0e7c7a2b3c3e50f6232c4c2d07ca18b3379d7e8bf66c41",
  forms: "d4cc0d087e0e5cdbb784317f77c5d137c48a8e7d0a2f83620e79c6d4353607f1",
  crud: "931450d6e4ff99ce841ab4d540bceb2e113c281d05a8e9222cbcccb6cbadc30c",
  commerce: "88df8c383d9d81dc5c9709583419db30cef513b54fb4ecdfc8347aa76232de4b",
  realtime: "57d081fa318a32b0886bc8fe5a1183d7d8f20c5c7b60d09561968ee5b9c3f947",
}

test("freezes five paired production AI delivery protocols", async () => {
  for (const task of tasks) assert.equal(await digestFile(join(root, task, "protocol.json")), protocolHashes[task])
  const protocols = await Promise.all(tasks.map(async task => JSON.parse(await readFile(join(root, task, "protocol.json"), "utf8"))))
  assert.deepEqual(protocols.map(protocol => protocol.task.class), ["content", "forms", "crud-shared-state", "commerce-derived-state", "resource-realtime"])
  assert.equal(new Set(protocols.map(protocol => JSON.stringify([protocol.model, protocol.tools.names, protocol.tools.permissions, protocol.budgets]))).size, 1)

  for (const protocol of protocols) {
    const directory = join(root, protocol.task.class === "crud-shared-state" ? "crud" : protocol.task.class === "commerce-derived-state" ? "commerce" : protocol.task.class === "resource-realtime" ? "realtime" : protocol.task.class)
    assert.equal(protocol.packet, "0.21.4")
    assert.equal(protocol.revision, 18)
    assert.match(protocol.id, /-r18$/)
    assert.match(protocol.revisionNote, /Future runs only/)
    assert.match(protocol.revisionNote, /r7 raw evidence and scores are unchanged/)
    assert.match(protocol.revisionNote, /frozen r6 inputs remain archived/)
    assert.deepEqual(protocol.variants.map(variant => variant.id), ["kudzu", "react-vite"])
    assert.deepEqual(protocol.variants.map(variant => protocol.schedule.filter(entry => entry.variant === variant.id).map(entry => entry.ordinal).sort()), [[0, 1, 2, 3, 4], [0, 1, 2, 3, 4]])
    assert.equal(await digestFile(join(directory, protocol.task.prompt)), protocol.task.promptSha256)
    assert.equal(await digestFile(join(directory, protocol.task.acceptanceContract.path)), protocol.task.acceptanceContract.sha256)
    assert.equal(await digestFile(resolveCommand(directory, protocol.model.adapter)), protocol.model.adapter.sha256)
    assert.equal(await digestFile(resolveCommand(directory, protocol.task.acceptance)), protocol.task.acceptance.sha256)
    for (const variant of protocol.variants) {
      assert.equal(await digestDirectory(join(directory, variant.starter)), variant.starterSha256)
      if (variant.id === "kudzu") {
        const manifest = JSON.parse(await readFile(join(directory, variant.starter, "package.json"), "utf8"))
        const lock = JSON.parse(await readFile(join(directory, variant.starter, "package-lock.json"), "utf8"))
        assert.equal(protocol.tools.versions.kudzu, "0.16.26")
        assert.equal(manifest.dependencies["@kudzujs/core"], "0.16.26")
        assert.equal(lock.packages[""].dependencies["@kudzujs/core"], "0.16.26")
        assert.equal(lock.packages["node_modules/@kudzujs/core"].version, "0.16.26")
        assert.equal(lock.packages["node_modules/@kudzujs/core"].integrity, "sha512-tBXxFr8P/WRbhmEsCnT4ymGRjcOyuYyTC0XpsoagUWhpdjMZfkGUTxyh4rgjyYvyrVHeEeeUKNxr+JDrH7RnPg==")
      }
      for (const context of variant.publicContext) assert.equal(await digestFile(resolve(directory, context.path)), context.sha256)
    }
  }
})

test("future production prompts communicate the corrected acceptance requirements", async () => {
  const content = await readFile(join(root, "content/prompt.md"), "utf8")
  const crud = await readFile(join(root, "crud/prompt.md"), "utf8")
  assert.match(content, /count and empty message may share that region/)
  assert.match(content, /aria-live="polite"/)
  assert.match(content, /\/topics\/performance\//)
  assert.match(content, /no scripts, module preloads, state markers, or JavaScript asset references/)
  assert.match(content, /React \+ Vite may retain its normal runtime/)
  assert.match(content, /Nonmatching cards may be removed from the DOM or hidden/)
  assert.match(crud, /No exact group-name wording is required/)
  assert.match(crud, /role="group"/)
  assert.match(crud, /aria-pressed="false"/)
})

function resolveCommand(directory, command) {
  return resolve(command.args.find(value => value.includes("{protocol}")).replace("{protocol}", directory))
}

async function digestFile(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex")
}

async function digestDirectory(rootDirectory) {
  const entries = []
  async function visit(directory) {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((left, right) => left.name.localeCompare(right.name))) {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) await visit(path)
      else if (entry.isFile()) entries.push(path)
    }
  }
  await visit(rootDirectory)
  const hash = createHash("sha256")
  for (const path of entries) hash.update(relative(rootDirectory, path).replaceAll("\\", "/")).update("\0").update(await readFile(path))
  return hash.digest("hex")
}
