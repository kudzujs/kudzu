import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { once } from "node:events"
import { readFile, rm, writeFile } from "node:fs/promises"
import test from "node:test"
import { parseDevPort } from "../framework/build.mjs"

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
    assert.doesNotMatch(initial.html, /at compile/)

    events = await eventStream(`${url}/__kudzu_reload?session=${initialClient.session}&revision=0`)
    assert.match((await events.next("build-error")).data, /Expected corresponding JSX closing tag for 'main'/)

    await writeFile(source, "export default function HomePage() { return <main>First valid build</main> }\n")
    await events.next("reload")
    const served = await poll(async () => {
      const html = await (await fetch(url)).text()
      return html.includes("First valid build") ? html : undefined
    })
    const firstClient = clientState(served)
    assert.equal(firstClient.session, initialClient.session)
    assert.equal(firstClient.revision, 1)
    assert.doesNotMatch(await readFile(output, "utf8"), /EventSource|__kudzu_reload/)

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
      return html.includes("Second valid build") ? html : undefined
    })
    const secondClient = clientState(second)
    assert.equal(secondClient.revision, 2)
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
