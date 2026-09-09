import { readFile } from "node:fs/promises"
import { join } from "node:path"

// ponytail: copy only generic transport; the original acceptance file is hash-frozen.
// Consolidate when a new benchmark protocol replaces that immutable oracle.

export async function evaluate(cdp, expression) {
  const response = await cdp.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, cdp.sessionId)
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text)
  return response.result.value
}

export async function waitForPort(profileDirectory, child) {
  for (let attempt = 0; attempt < 1000; attempt++) {
    if (child.exitCode !== null || child.signalCode !== null) throw new Error(`Chrome exited early with ${child.exitCode ?? child.signalCode}`)
    try {
      const [port, path] = (await readFile(join(profileDirectory, "DevToolsActivePort"), "utf8")).trim().split("\n")
      return { port, path }
    } catch {}
    await new Promise(resolveSleep => setTimeout(resolveSleep, 10))
  }
  throw new Error("Chrome DevToolsActivePort did not appear")
}

export class CDP {
  constructor(url) {
    this.id = 0
    this.pending = new Map()
    this.exceptions = []
    this.failures = []
    this.socket = new WebSocket(url)
    this.ready = new Promise((resolveReady, reject) => { this.socket.onopen = resolveReady; this.socket.onerror = reject })
    this.socket.onmessage = event => {
      const message = JSON.parse(event.data)
      if (message.method === "Runtime.exceptionThrown") this.exceptions.push(message.params.exceptionDetails.text)
      if (message.method === "Network.loadingFailed" && !message.params.canceled) this.failures.push(message.params.errorText)
      if (!message.id) return
      const callback = this.pending.get(message.id)
      this.pending.delete(message.id)
      if (message.error) callback.reject(new Error(`${callback.method}: ${message.error.message}${callback.expression ? `: ${callback.expression}` : ""}`))
      else callback.resolve(message.result)
    }
  }
  async send(method, params = {}, sessionId) {
    await this.ready
    const id = ++this.id
    const response = new Promise((resolveResponse, reject) => this.pending.set(id, { resolve: resolveResponse, reject, method, expression: params.expression }))
    this.socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
    return response
  }
}
