import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { createServer } from "node:http"
import test from "node:test"
import { CDP } from "./browser-cdp.mjs"

for (const abrupt of [false, true]) test(`CDP rejects pending and future commands after ${abrupt ? "abrupt" : "normal"} browser disconnect`, { timeout: 5000 }, async t => {
  const server = createServer()
  t.after(() => server.close())
  server.on("upgrade", (request, socket) => {
    t.after(() => socket.destroy())
    const accept = createHash("sha1").update(request.headers["sec-websocket-key"] + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").digest("base64")
    socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`)
    socket.once("data", () => {
      const body = Buffer.from(JSON.stringify({ id: 1, result: { enabled: true } }))
      socket.write(Buffer.concat([Buffer.from([0x81, body.length]), body]))
      socket.once("data", () => abrupt ? socket.destroy() : socket.end(Buffer.from([0x88, 0])))
    })
  })
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve))
  const cdp = new CDP(`ws://127.0.0.1:${server.address().port}`)
  t.after(() => cdp.socket.close())
  assert.deepEqual(await cdp.send("Runtime.enable"), { enabled: true })
  await Promise.all([
    assert.rejects(cdp.send("Runtime.evaluate", { expression: "1" }), /Runtime\.evaluate: CDP connection (closed|failed)/),
    assert.rejects(cdp.send("Page.enable"), /Page\.enable: CDP connection (closed|failed)/),
  ])
  assert.equal(cdp.pending.size, 0)
  await assert.rejects(cdp.send("Runtime.disable"), /CDP connection (closed|failed)/)
})
