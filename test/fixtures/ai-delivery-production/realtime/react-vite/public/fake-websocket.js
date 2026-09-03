(function () {
  let nextId = 1
  const sockets = []

  class DeterministicWebSocket extends EventTarget {
    static CONNECTING = 0
    static OPEN = 1
    static CLOSING = 2
    static CLOSED = 3

    constructor(url) {
      super()
      this.id = nextId++
      this.url = String(url)
      this.readyState = DeterministicWebSocket.CONNECTING
      this.closeCount = 0
      this.listenerCount = 0
      sockets.push(this)
      queueMicrotask(() => controls.open(this.id))
    }

    addEventListener(type, listener, options) {
      this.listenerCount += 1
      super.addEventListener(type, listener, options)
    }

    removeEventListener(type, listener, options) {
      this.listenerCount = Math.max(0, this.listenerCount - 1)
      super.removeEventListener(type, listener, options)
    }

    close() {
      if (this.readyState === DeterministicWebSocket.CLOSED) return
      this.readyState = DeterministicWebSocket.CLOSED
      this.closeCount += 1
      this.dispatchEvent(new Event("close"))
    }
  }

  const controls = {
    sockets,
    latest() {
      return sockets.at(-1) || null
    },
    open(id) {
      const socket = sockets.find(item => item.id === id)
      if (!socket || socket.readyState !== DeterministicWebSocket.CONNECTING) return
      socket.readyState = DeterministicWebSocket.OPEN
      socket.dispatchEvent(new Event("open"))
    },
    message(id, snapshot) {
      const socket = sockets.find(item => item.id === id)
      if (!socket) return
      socket.dispatchEvent(new MessageEvent("message", { data: JSON.stringify(snapshot) }))
    },
    drop(id) {
      sockets.find(item => item.id === id)?.close()
    },
    stats() {
      return sockets.map(({ id, readyState, closeCount, listenerCount }) => ({ id, readyState, closeCount, listenerCount }))
    },
  }

  globalThis.WebSocket = DeterministicWebSocket
  globalThis.__MEMOS_SOCKET__ = controls
})()
