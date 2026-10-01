import assert from "node:assert/strict"
import { resolve } from "node:path"
import test from "node:test"
import { compileSource } from "../framework/compiler/source-compiler.mjs"

// Reduced from r5 and R8 realtime attempts: effect-only values can use an owned local.
for (const [variant, initial, renderWrite] of [["0", "0", false], ["null", "null", true], ["0-render", "0", true]]) test(`rejects the retained version ref initialized with ${variant}`, () => {
  const file = resolve("src/pages/realtime-version.tsx")
  const source = `import { useEffect, useRef, useState } from "@kudzujs/core"
function Feed() {
  const [paused, setPaused] = useState(false)
  const [message, setMessage] = useState("seed")
  const version = useRef(${initial})
  ${renderWrite ? `if (version.current === ${initial}) version.current = 1` : ""}
  useEffect(() => {
    ${renderWrite ? "" : "if (version.current === 0) version.current = 1"}
    if (paused) return
    const socket = new WebSocket("wss://example.invalid/feed")
    const onMessage = event => {
      const snapshot = JSON.parse(event.data)
      if (snapshot.version <= version.current) return
      version.current = snapshot.version
      setMessage(snapshot.message)
    }
    socket.addEventListener("message", onMessage)
    return () => {
      socket.removeEventListener("message", onMessage)
      socket.close()
    }
  }, [paused])
  return <main><button onClick={() => setPaused(!paused)}>Pause</button><p>{message}</p></main>
}
export default function Page() { return <Feed /> }
`
  assert.throws(() => compileSource(file, new Set([file]), new Map([[file, source]]), new Set(), new Map(), ""), error => {
    assert.match(error.message, /src\/pages\/realtime-version\.tsx:\d+:\d+/)
    assert.match(error.message, renderWrite ? /Mutable refs cannot be assigned during render/ : /Effect-private refs require one cleanup/)
    assert.match(error.message, /effect-local variable/)
    assert.doesNotMatch(error.message, /TypeError|\.kudzu/)
    return true
  })
})

test("rejects an effect-owned callback ref used by an intrinsic handler", () => {
  const file = resolve("src/pages/realtime-ref-event.tsx")
  const source = `import { useEffect, useRef, useState } from "@kudzujs/core"
export default function Page() {
  const [connected, setConnected] = useState(false)
  const resume = useRef<(() => void) | null>(null)
  useEffect(() => {
    resume.current = () => setConnected(true)
    return () => { resume.current = null }
  }, [])
  return <main><button onClick={() => resume.current?.()}>Resume</button><p>{connected ? "connected" : "idle"}</p></main>
}`
  assert.throws(() => compileSource(file, new Set([file]), new Map([[file, source]]), new Set(), new Map(), ""), error => {
    assert.match(error.message, /src\/pages\/realtime-ref-event\.tsx:9:\d+/)
    assert.match(error.message, /Effect-owned mutable refs cannot be used outside their owning effect/)
    assert.match(error.message, /state-driven effect/)
    return true
  })
})

test("keeps pause/resume in a state-driven owned effect", () => {
  const file = resolve("src/pages/realtime-state-pause.tsx")
  const source = `import { useEffect, useState } from "@kudzujs/core"
export default function Page() {
  const [paused, setPaused] = useState(false)
  const [connection, setConnection] = useState("connecting")
  useEffect(() => {
    if (paused) { setConnection("paused"); return }
    const socket = new WebSocket("wss://example.invalid/feed")
    const onOpen = () => setConnection("connected")
    socket.addEventListener("open", onOpen)
    return () => { socket.removeEventListener("open", onOpen); socket.close() }
  }, [paused])
  return <main><button onClick={() => setPaused(!paused)}>Toggle</button><p>{connection}</p></main>
}`
  const result = compileSource(file, new Set([file]), new Map([[file, source]]), new Set(), new Map(), "")
  assert.equal(result.moduleIR.effects.length, 1)
  assert.ok(result.moduleIR.handlers.length > 0)
})

test("diagnoses a non-null ref in a named Realtime component", () => {
  const file = resolve("src/pages/realtime-named-ref.tsx")
  const source = `import { useRef, useState } from "@kudzujs/core"
function Feed() {
  const [paused, setPaused] = useState(false)
  const version = useRef(1)
  return <button onClick={() => { version.current += 1; setPaused(!paused) }}>Resume</button>
}
export default function Page() { return <Feed /> }`
  assert.throws(() => compileSource(file, new Set([file]), new Map([[file, source]]), new Set(), new Map(), ""), error => {
    assert.match(error.message, /src\/pages\/realtime-named-ref\.tsx:4:\d+/)
    assert.match(error.message, /Mutable useRef\(\) values must be referenced exclusively inside one owned effect/)
    assert.match(error.message, /effect-local|useRef\(null\)/)
    return true
  })
})

test("diagnoses a non-null ref in a top-level variable component", () => {
  const file = resolve("src/pages/realtime-variable-ref.tsx")
  const source = `import { useRef } from "@kudzujs/core"
const Feed = () => {
  const version = useRef(1)
  return <button onClick={() => version.current++}>Resume</button>
}
export default function Page() { return <Feed /> }`
  assert.throws(() => compileSource(file, new Set([file]), new Map([[file, source]]), new Set(), new Map(), ""), /src\/pages\/realtime-variable-ref\.tsx:3:\d+ Mutable useRef\(\) values must be referenced exclusively inside one owned effect/)
})
