import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFile, readdir } from "node:fs/promises"
import { dirname, join, relative, resolve } from "node:path"
import test from "node:test"

const root = resolve("test/fixtures/ai-delivery-production")
const tasks = ["content", "forms", "crud", "commerce", "realtime"]
const protocolHashes = {
  content: "1d47ee2ee374621588bf51abdd99a01965f3cd3e45d388bd2d81d9729a01a3fe",
  forms: "0238f0cb93f58f8f30a5d4d7b866c0086acc828349feb11060e35574eae7c113",
  crud: "55d713049c24cbc7fab631929f6d697bed205fde03077677600c077229295f1d",
  commerce: "acc27f6846ec3dea4adc0a7fb4d76c525f32455fabf56f40a2d2a7b46d4849cc",
  realtime: "9326b7e150144fca987fccf7b2027083c3cd5f04f887d2259cf347dd8ef2b4e1",
}

test("freezes five paired production AI delivery protocols", async () => {
  for (const task of tasks) assert.equal(await digestFile(join(root, task, "protocol.json")), protocolHashes[task])
  const protocols = await Promise.all(tasks.map(async task => JSON.parse(await readFile(join(root, task, "protocol.json"), "utf8"))))
  assert.deepEqual(protocols.map(protocol => protocol.task.class), ["content", "forms", "crud-shared-state", "commerce-derived-state", "resource-realtime"])
  assert.equal(new Set(protocols.map(protocol => JSON.stringify([protocol.model, protocol.tools.names, protocol.tools.permissions, protocol.budgets]))).size, 1)

  for (const protocol of protocols) {
    const directory = join(root, protocol.task.class === "crud-shared-state" ? "crud" : protocol.task.class === "commerce-derived-state" ? "commerce" : protocol.task.class === "resource-realtime" ? "realtime" : protocol.task.class)
    assert.equal(protocol.packet, "0.21.4")
    assert.equal(protocol.revision, 8)
    assert.match(protocol.id, /-r8$/)
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
