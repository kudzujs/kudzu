import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { once } from "node:events"
import { readFile, rm, writeFile } from "node:fs/promises"
import test from "node:test"
import { parseDevPort } from "../framework/build.mjs"
import { restoreState, snapshotState, stateSchema } from "../framework/dev-state.js"

const fixture = new URL("./fixtures/dev/", import.meta.url)
const source = new URL("src/pages/index.tsx", fixture)
const output = new URL("dist/index.html", fixture)
const command = new URL("../bin/kudzu.mjs", import.meta.url).pathname

test("parses PORT as a strict decimal integer", () => {
  assert.equal(parseDevPort(undefined), 3000)
  assert.equal(parseDevPort(""), 3000)
  assert.equal(parseDevPort("  "), 3000)
  assert.equal(parseDevPort("0"), 0)
  assert.equal(parseDevPort("3001"), 3001)
  for (const value of ["0x10", "1e3", "1.5", "+1", "-1", "12x", "65536"]) {
    assert.throws(() => parseDevPort(value), /Invalid dev server port/)
  }
})

test("restores route-unique named state across slot insertion and reordering", () => {
  const storage = memoryStorage()
  const previous = new Map([
    ["s0", 3],
    ["s1", "Grown"],
    ["s2", true],
    ["s3", [{ id: 2, name: "Oak" }]],
    ["s4", "removed"],
    ["s5", [1]],
    ["s6", "first"],
    ["s7", "second"]
  ])
  const previousSchema = stateSchema([
    { id: "s0", name: "count" }, { id: "s1", name: "controlled" }, { id: "s2", name: "open" },
    { id: "s3", name: "items" }, { id: "s4", name: "removed" }, { id: "s5", name: "changedShape" },
    { id: "s6", name: "value" }, { id: "s7", name: "value" }
  ])
  assert.equal(previousSchema.some(([, name]) => name === "value"), false)
  assert.equal(snapshotState(storage, "/docs?q=1#examples", previous, previousSchema, 1000), true)

  const state = new Map([
    ["s0", "inserted"],
    ["s1", false],
    ["s2", 0],
    ["s3", []],
    ["s4", "Kudzu"],
    ["s5", {}],
    ["s6", "new first"],
    ["s7", 9],
    ["s8", "new second"]
  ])
  const currentSchema = stateSchema([
    { id: "s0", name: "inserted" }, { id: "s1", name: "open" }, { id: "s2", name: "count" },
    { id: "s3", name: "items" }, { id: "s4", name: "controlled" }, { id: "s5", name: "changedShape" },
    { id: "s6", name: "value" }, { id: "s7", name: "other" }, { id: "s8", name: "value" }
  ])
  const commits = []
  assert.deepEqual(restoreState(storage, "/docs?q=1#examples", state, currentSchema, id => {
    commits.push([id, new Map(state)])
  }, 1001), ["s2", "s4", "s1", "s3"])
  assert.deepEqual([...state], [
    ["s0", "inserted"], ["s1", true], ["s2", 3], ["s3", [{ id: 2, name: "Oak" }]],
    ["s4", "Grown"], ["s5", {}], ["s6", "new first"], ["s7", 9], ["s8", "new second"]
  ])
  assert.equal(commits.length, 4)
  for (const [, committedState] of commits) assert.deepEqual([...committedState], [...state])
  assert.deepEqual(restoreState(storage, "/docs?q=1#examples", state, currentSchema, () => {}, 1002), [])
})

test("does not restore a hook name after a same-named hook is inserted", () => {
  const storage = memoryStorage()
  const previousSchema = stateSchema([{ id: "s0", name: "mode" }])
  snapshotState(storage, "/", new Map([["s0", "preserved"]]), previousSchema, 1)
  const currentSchema = stateSchema([{ id: "s0", name: "mode" }, { id: "s1", name: "mode" }])
  const state = new Map([["s0", "first"], ["s1", "second"]])
  assert.deepEqual(currentSchema, [])
  assert.deepEqual(restoreState(storage, "/", state, currentSchema, () => assert.fail(), 2), [])
  assert.deepEqual([...state], [["s0", "first"], ["s1", "second"]])
})

test("rolls back every state and DOM commit when restoration commit fails", () => {
  const storage = memoryStorage()
  const schema = stateSchema([{ id: "s0", name: "count" }, { id: "s1", name: "items" }])
  snapshotState(storage, "/", new Map([["s0", 7], ["s1", [{ id: 2 }]]]), schema, 1)
  const state = new Map([["s0", 0], ["s1", []]])
  const calls = []
  assert.deepEqual(restoreState(storage, "/", state, schema, id => {
    calls.push([id, structuredClone([...state])])
    if (id === "s1" && state.get(id).length) throw new Error("list commit failed")
  }, 2), [])
  assert.deepEqual([...state], [["s0", 0], ["s1", []]])
  assert.deepEqual(calls.map(([id]) => id), ["s0", "s1", "s0", "s1"])
  assert.deepEqual(calls[0][1], [["s0", 7], ["s1", [{ id: 2 }]]])
  assert.deepEqual(calls[2][1], [["s0", 0], ["s1", []]])
})

test("clears stale snapshots, expires safely, and rejects unsafe values", () => {
  const storage = memoryStorage()
  const schema = stateSchema([{ id: "s0", name: "value" }])
  assert.equal(snapshotState(storage, "/", new Map([["s0", 1]]), schema, 1), true)
  assert.equal(snapshotState(storage, "/", new Map([["s0", undefined]]), schema, 1), false)
  assert.equal(storage.getItem("__kudzu_state:/"), null)
  assert.equal(snapshotState(storage, "/", new Map([["s0", NaN]]), schema, 1), false)
  assert.equal(snapshotState(storage, "/", new Map([["s0", 1n]]), schema, 1), false)
  assert.equal(snapshotState(storage, "/", new Map([["s0", () => {}]]), schema, 1), false)
  const cycle = {}; cycle.self = cycle
  assert.equal(snapshotState(storage, "/", new Map([["s0", cycle]]), schema, 1), false)
  assert.equal(snapshotState(storage, "/docs?q=1#one", new Map([["s0", 1]]), schema, 1), true)
  assert.equal(storage.getItem("__kudzu_state:/docs"), null)
  assert.equal(storage.getItem("__kudzu_state:/docs?q=1#two"), null)
  assert.deepEqual(restoreState(storage, "/docs?q=1#one", new Map([["s0", 0]]), schema, () => assert.fail(), 10002), [])
  storage.setItem("__kudzu_state:/broken", "{")
  assert.deepEqual(restoreState(storage, "/broken"), [])
  assert.equal(storage.getItem("__kudzu_state:/broken"), null)
  storage.setItem("__kudzu_state:/static", JSON.stringify({ time: Date.now(), values: [] }))
  assert.deepEqual(restoreState(storage, "/static"), [])
  assert.equal(storage.getItem("__kudzu_state:/static"), null)
  const quota = memoryStorage()
  quota.setItem("__kudzu_state:/", "stale")
  quota.setItem = () => { throw new Error("quota") }
  assert.equal(snapshotState(quota, "/", new Map([["s0", 1]]), schema), false)
  assert.equal(quota.getItem("__kudzu_state:/"), null)
  assert.doesNotThrow(() => snapshotState({ removeItem() { throw new Error("denied") } }, "/", new Map(), []))
  assert.deepEqual(restoreState({ getItem() { throw new Error("denied") } }, "/"), [])
})

test("dev server reports build errors and reloads without changing output HTML", async () => {
  const original = await readFile(source, "utf8")
  let server
  let events
  try {
    await writeFile(source, "export default function Broken() { return <main>broken</div> }\n")
    server = spawn(process.execPath, [command, "dev"], {
      cwd: fixture,
      env: { ...process.env, PORT: "0" },
      stdio: ["ignore", "pipe", "pipe"]
    })
    const url = await serverUrl(server)
    const initial = await poll(async () => {
      const response = await fetch(url)
      const html = await response.text()
      return html.includes("Kudzu build error") ? { html, response } : undefined
    })
    assert.equal(initial.response.headers.get("cache-control"), "no-store")
    const initialClient = clientState(initial.html)
    assert.equal(initialClient.revision, 0)
    assert.match(initial.html, /role="alert"/)
    assert.match(initial.html, /const schema=\[\]/)
    assert.match(initial.html, /dev\.restoreState\(sessionStorage,route,runtime\?\.browserState,schema/)
    assert.doesNotMatch(initial.html, /at compile/)

    events = await eventStream(`${url}/__kudzu_reload?session=${initialClient.session}&revision=0`)
    assert.match((await events.next("build-error")).data, /Expected corresponding JSX closing tag for 'main'/)

    await writeFile(source, 'import { useState } from "@kudzujs/core"\nexport default function HomePage() { const [count, setCount] = useState(0); return <button onClick={() => setCount(count + 1)}>First valid build {count}</button> }\n')
    await events.next("reload")
    const served = await poll(async () => {
      const html = await (await fetch(url)).text()
      return html.includes("First valid build") ? html : undefined
    })
    const firstClient = clientState(served)
    assert.equal(firstClient.session, initialClient.session)
    assert.equal(firstClient.revision, 1)
    assert.match(served, /const schema=\[\["s0","count"\]\]/)
    assert.match(served, /route=location\.pathname\+location\.search\+location\.hash/)
    assert.match(served, /Promise\.allSettled\(urls\.map/)
    assert.match(served, /restoreState\(sessionStorage,route,runtime\?\.browserState,schema/)
    assert.match(served, /snapshotState\(sessionStorage,route,runtime\?\.browserState,schema/)
    assert.doesNotMatch(await readFile(output, "utf8"), /EventSource|__kudzu_reload/)
    const helper = await fetch(`${url}/__kudzu_dev.js`)
    assert.equal(helper.status, 200)
    assert.match(helper.headers.get("content-type"), /^text\/javascript/)
    assert.match(await helper.text(), /snapshotState/)

    const publicPage = await fetch(`${url}/body.html`)
    const publicHtml = await publicPage.text()
    assert.match(publicHtml, /<!-- earlier <\/body> -->[\s\S]*<\/BoDy >\s*<script>[\s\S]*EventSource/)
    assert.equal(publicPage.headers.get("cache-control"), "no-store")
    const asset = await fetch(`${url}/data.txt`)
    assert.equal(asset.headers.get("cache-control"), "no-store")

    events.close()
    await writeFile(source, "export default function HomePage() { return <main>Second valid build</main> }\n")
    const second = await poll(async () => {
      const html = await (await fetch(url)).text()
      return html.includes("Second valid build") && clientState(html).revision === 2 ? html : undefined
    })
    const secondClient = clientState(second)
    assert.equal(secondClient.revision, 2)
    assert.match(second, /const schema=\[\]/)
    events = await eventStream(`${url}/__kudzu_reload?session=${secondClient.session}&revision=1`)
    await events.next("reload")
    events.close()
    events = await eventStream(`${url}/__kudzu_reload?session=stale-session&revision=2`)
    await events.next("reload")
    events.close()
    events = await eventStream(`${url}/__kudzu_reload?session=${secondClient.session}&revision=2`)
    await writeFile(source, "export default function Broken() { return <main>{</main> }\n")
    assert.match((await events.next("build-error")).data, /Expression expected/)
    await writeFile(source, original)
    await events.next("reload")
  } finally {
    events?.close()
    await writeFile(source, original)
    if (server?.exitCode === null) {
      server.kill()
      await once(server, "exit")
    }
    await rm(new URL("dist", fixture), { recursive: true, force: true })
    await rm(new URL(".kudzu", fixture), { recursive: true, force: true })
  }
})

test("dev server resolves validated runtime route fallbacks after exact files", async () => {
  const runtimeFixture = new URL("./fixtures/runtime-params-dev/", import.meta.url)
  let server
  try {
    server = spawn(process.execPath, [command, "dev"], {
      cwd: runtimeFixture,
      env: { ...process.env, PORT: "0" },
      stdio: ["ignore", "pipe", "pipe"]
    })
    const url = await serverUrl(server)
    const id = "550e8400-e29b-41d4-a716-446655440000"
    const runtime = await fetch(`${url}/포털/orgs/acme/items/${id}?view=full`)
    const html = await runtime.text()
    assert.equal(runtime.status, 200)
    assert.match(html, /data-k-text="p0"/)
    assert.match(html, /const schema=\[\["s0","status"\]\]/)
    const trailing = await fetch(`${url}/포털/orgs/acme/items/${id}/`)
    assert.equal(trailing.status, 200)
    const unicode = await fetch(`${url}/포털/orgs/acme/items/%E6%9C%A8`)
    assert.equal(unicode.status, 200)
    const dotted = await fetch(`${url}/포털/orgs/acme/items/report.json`)
    assert.equal(dotted.status, 200)
    const encodedDot = await fetch(`${url}/포털/orgs/acme/items/report%2Ejson`)
    assert.equal(encodedDot.status, 200)

    const exact = await fetch(`${url}/포털/orgs/acme/items/new`)
    assert.equal(exact.status, 200)
    assert.match(await exact.text(), /data-static-new.*const schema=\[\["s0","label"\]\]/s)
    assert.equal((await fetch(`${url}/%ed%8f%ac%ed%84%b8/orgs/acme/items/${id}`)).status, 200)

    for (const path of [
      `/orgs/acme/items/${id}`,
      "/포털/orgs/acme/items/",
      "/포털/orgs/acme/items/%2F",
      "/포털/orgs/acme/items/%252f",
      "/포털/orgs/acme/items/%252e%252e",
      "/포털/orgs/acme/items/%C2%85",
      "/포털/orgs/acme/items/%E0%A4%A",
      `/포털/orgs/acme/items/${id}/extra`,
      `/포털/teams/acme/items/${id}`
    ]) {
      assert.equal((await fetch(`${url}${path}`)).status, 404, path)
    }
  } finally {
    if (server?.exitCode === null) {
      server.kill()
      await once(server, "exit")
    }
    await rm(new URL("dist", runtimeFixture), { recursive: true, force: true })
    await rm(new URL(".kudzu", runtimeFixture), { recursive: true, force: true })
  }
})

function memoryStorage() {
  const values = new Map()
  return {
    getItem(key) { return values.get(key) ?? null },
    setItem(key, value) { values.set(key, value) },
    removeItem(key) { values.delete(key) }
  }
}

function clientState(html) {
  const match = html.match(/__kudzu_reload\?session=([^&"]+)&revision=(\d+)/)
  assert.ok(match, "Missing dev client state")
  return { session: match[1], revision: Number(match[2]) }
}

async function serverUrl(server) {
  let output = ""
  let errors = ""
  server.stderr.on("data", chunk => { errors += chunk })
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Dev server did not start\n${errors}`)), 10000)
    server.stdout.on("data", chunk => {
      output += chunk
      const match = output.match(/Kudzu dev server: (http:\/\/127\.0\.0\.1:\d+)/)
      if (match) {
        clearTimeout(timer)
        resolve(match[1])
      }
    })
    server.on("exit", code => {
      clearTimeout(timer)
      reject(new Error(`Dev server exited with ${code}\n${errors}`))
    })
  })
}

async function poll(check, timeout = 10000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    try {
      const result = await check()
      if (result) return result
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  throw new Error("Timed out polling dev server")
}

async function eventStream(url) {
  const controller = new AbortController()
  const response = await fetch(url, { signal: controller.signal })
  assert.equal(response.status, 200)
  assert.match(response.headers.get("content-type"), /^text\/event-stream/)
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  const queue = []
  const waiters = []
  let buffer = ""
  ;(async () => {
    try {
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true }).replaceAll("\r", "")
        let boundary
        while ((boundary = buffer.indexOf("\n\n")) !== -1) {
          const block = buffer.slice(0, boundary)
          buffer = buffer.slice(boundary + 2)
          const type = block.match(/^event: (.+)$/m)?.[1]
          if (!type) continue
          const event = { type, data: [...block.matchAll(/^data: ?(.*)$/gm)].map(match => match[1]).join("\n") }
          const waiter = waiters.find(entry => entry.type === type)
          if (waiter) {
            waiters.splice(waiters.indexOf(waiter), 1)
            waiter.resolve(event)
          } else queue.push(event)
        }
      }
    } catch (error) {
      if (!controller.signal.aborted) for (const waiter of waiters) waiter.reject(error)
    }
  })()
  return {
    next(type) {
      const queued = queue.find(event => event.type === type)
      if (queued) {
        queue.splice(queue.indexOf(queued), 1)
        return Promise.resolve(queued)
      }
      return new Promise((resolve, reject) => {
        const entry = {
          type,
          resolve(event) {
            clearTimeout(timer)
            resolve(event)
          },
          reject
        }
        waiters.push(entry)
        const timer = setTimeout(() => {
          const index = waiters.indexOf(entry)
          if (index !== -1) {
            waiters.splice(index, 1)
            reject(new Error(`Timed out waiting for ${type}`))
          }
        }, 10000)
      })
    },
    close() { controller.abort() }
  }
}
