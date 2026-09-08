import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFile, readdir } from "node:fs/promises"
import { dirname, join, relative, resolve } from "node:path"
import test from "node:test"

const root = resolve("test/fixtures/ai-delivery-production")
const tasks = ["content", "forms", "crud", "commerce", "realtime"]
const protocolHashes = {
  content: "0c55f9a614a49df06c56576b7bc63ebd2069598e47a270de1d4cbaa56be30b64",
  forms: "30bb567ab1b199e052ec95dbe6426e40a357e4181e43c8900ac003eb7872f6e6",
  crud: "a5d7b04004510378d7beff3aa6990e03496ddb3766b2a089c19afbd25593a2d7",
  commerce: "6ba490ef520dd014ce641b86084b648fbe90bd5fd0e8d0b340ed4ca9e09bdae4",
  realtime: "0cfb2d17969125d796ef90a12c78b8d4041a23f27c633750ee04e03edfe650e7",
}

test("freezes five paired production AI delivery protocols", async () => {
  for (const task of tasks) assert.equal(await digestFile(join(root, task, "protocol.json")), protocolHashes[task])
  const protocols = await Promise.all(tasks.map(async task => JSON.parse(await readFile(join(root, task, "protocol.json"), "utf8"))))
  assert.deepEqual(protocols.map(protocol => protocol.task.class), ["content", "forms", "crud-shared-state", "commerce-derived-state", "resource-realtime"])
  assert.equal(new Set(protocols.map(protocol => JSON.stringify([protocol.model, protocol.tools.names, protocol.tools.permissions, protocol.budgets]))).size, 1)

  for (const protocol of protocols) {
    const directory = join(root, protocol.task.class === "crud-shared-state" ? "crud" : protocol.task.class === "commerce-derived-state" ? "commerce" : protocol.task.class === "resource-realtime" ? "realtime" : protocol.task.class)
    assert.equal(protocol.packet, "0.21.4")
    assert.equal(protocol.revision, 7)
    assert.match(protocol.id, /-r7$/)
    assert.match(protocol.revisionNote, /Future runs only/)
    assert.match(protocol.revisionNote, /r5 raw evidence and scores are unchanged/)
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
        assert.equal(protocol.tools.versions.kudzu, "0.16.25")
        assert.equal(manifest.dependencies["@kudzujs/core"], "0.16.25")
        assert.equal(lock.packages[""].dependencies["@kudzujs/core"], "0.16.25")
        assert.equal(lock.packages["node_modules/@kudzujs/core"].version, "0.16.25")
        assert.equal(lock.packages["node_modules/@kudzujs/core"].integrity, "sha512-dK+mCWWmV/9I5s3dEANnTkbwJRpZpwn4DtYVkMlyIysbO6/o+9vSIU5tnSTNGJALrY0kxsSFA8QL9QrlcFsK4w==")
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
