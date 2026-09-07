import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFile, readdir } from "node:fs/promises"
import { dirname, join, relative, resolve } from "node:path"
import test from "node:test"

const root = resolve("test/fixtures/ai-delivery-production")
const tasks = ["content", "forms", "crud", "commerce", "realtime"]
const protocolHashes = {
  content: "bef415122ae52d3a4a89410651b22184d826ebe280990b8cb131c79257ea350e",
  forms: "0326c15bb8ff16e7b2de83b065a52136be8e5dcf24fec3f88d4eef3e2b9c291a",
  crud: "8aae69d1ad3a04e451dad9ffcc7cffb8a6ed4e5917ab784a02ba7c0b3ed5b568",
  commerce: "3287722a0cd0e451b098fe6c483f43cd12ec0e85d5409077b2f46b8536528843",
  realtime: "921875aa44e44d702e4f4ecd307e44cd769e6a9dc2206babace9cbd6cc8daadf",
}

test("freezes five paired production AI delivery protocols", async () => {
  for (const task of tasks) assert.equal(await digestFile(join(root, task, "protocol.json")), protocolHashes[task])
  const protocols = await Promise.all(tasks.map(async task => JSON.parse(await readFile(join(root, task, "protocol.json"), "utf8"))))
  assert.deepEqual(protocols.map(protocol => protocol.task.class), ["content", "forms", "crud-shared-state", "commerce-derived-state", "resource-realtime"])
  assert.equal(new Set(protocols.map(protocol => JSON.stringify([protocol.model, protocol.tools.names, protocol.tools.permissions, protocol.budgets]))).size, 1)

  for (const protocol of protocols) {
    const directory = join(root, protocol.task.class === "crud-shared-state" ? "crud" : protocol.task.class === "commerce-derived-state" ? "commerce" : protocol.task.class === "resource-realtime" ? "realtime" : protocol.task.class)
    assert.equal(protocol.packet, "0.21.4")
    assert.equal(protocol.revision, 6)
    assert.match(protocol.id, /-r6$/)
    assert.match(protocol.revisionNote, /Future runs only/)
    assert.match(protocol.revisionNote, /r5 raw evidence and scores are unchanged/)
    assert.match(protocol.revisionNote, /No r6 model run has been performed/)
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
        assert.equal(protocol.tools.versions.kudzu, "0.16.24")
        assert.equal(manifest.dependencies["@kudzujs/core"], "0.16.24")
        assert.equal(lock.packages[""].dependencies["@kudzujs/core"], "0.16.24")
        assert.equal(lock.packages["node_modules/@kudzujs/core"].version, "0.16.24")
        assert.equal(lock.packages["node_modules/@kudzujs/core"].integrity, "sha512-qLcVItXkI7vI5ktOC16+87uQ4BqQTQOVrFqR4AK7gz4eMN4imL7o+ocUBc7znuVsMML98ChKLRgMSsUot7GUhg==")
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
