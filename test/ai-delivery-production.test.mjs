import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFile, readdir } from "node:fs/promises"
import { dirname, join, relative, resolve } from "node:path"
import test from "node:test"

const root = resolve("test/fixtures/ai-delivery-production")
const tasks = ["content", "forms", "crud", "commerce", "realtime"]

test("freezes five paired production AI delivery protocols", async () => {
  const protocols = await Promise.all(tasks.map(async task => JSON.parse(await readFile(join(root, task, "protocol.json"), "utf8"))))
  assert.deepEqual(protocols.map(protocol => protocol.task.class), ["content", "forms", "crud-shared-state", "commerce-derived-state", "resource-realtime"])
  assert.equal(new Set(protocols.map(protocol => JSON.stringify([protocol.model, protocol.tools.names, protocol.tools.permissions, protocol.budgets]))).size, 1)

  for (const protocol of protocols) {
    const directory = join(root, protocol.task.class === "crud-shared-state" ? "crud" : protocol.task.class === "commerce-derived-state" ? "commerce" : protocol.task.class === "resource-realtime" ? "realtime" : protocol.task.class)
    assert.equal(protocol.packet, "0.21.4")
    assert.equal(protocol.revision, 4)
    assert.match(protocol.id, /-r4$/)
    assert.match(protocol.revisionNote, /Completed r3 evidence is unchanged/)
    assert.deepEqual(protocol.variants.map(variant => variant.id), ["kudzu", "react-vite"])
    assert.deepEqual(protocol.variants.map(variant => protocol.schedule.filter(entry => entry.variant === variant.id).map(entry => entry.ordinal).sort()), [[0, 1, 2, 3, 4], [0, 1, 2, 3, 4]])
    assert.equal(await digestFile(join(directory, protocol.task.prompt)), protocol.task.promptSha256)
    assert.equal(await digestFile(join(directory, protocol.task.acceptanceContract.path)), protocol.task.acceptanceContract.sha256)
    assert.equal(await digestFile(resolveCommand(directory, protocol.model.adapter)), protocol.model.adapter.sha256)
    assert.equal(await digestFile(resolveCommand(directory, protocol.task.acceptance)), protocol.task.acceptance.sha256)
    for (const variant of protocol.variants) {
      assert.equal(await digestDirectory(join(directory, variant.starter)), variant.starterSha256)
      for (const context of variant.publicContext) assert.equal(await digestFile(resolve(directory, context.path)), context.sha256)
    }
  }
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
