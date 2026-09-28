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
