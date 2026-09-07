import assert from "node:assert/strict"
import { resolve } from "node:path"
import test from "node:test"
import { compileSource } from "../framework/compiler/source-compiler.mjs"

// Reduced from r5 realtime-kudzu-0/3 and the realtime-kudzu-1 null-ref workaround.
for (const initial of ["0", "null"]) test(`rejects the r5 retained version ref initialized with ${initial}`, () => {
  const file = resolve("src/pages/realtime-version.tsx")
  const source = `import { useEffect, useRef, useState } from "@kudzujs/core"
function Feed() {
  const [paused, setPaused] = useState(false)
  const [message, setMessage] = useState("seed")
  const version = useRef(${initial})
  ${initial === "null" ? "if (version.current === null) version.current = 1" : ""}
  useEffect(() => {
    ${initial === "0" ? "if (version.current === 0) version.current = 1" : ""}
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
    assert.match(error.message, initial === "0" ? /Effect-private refs require one cleanup/ : /Mutable refs cannot be assigned during render/)
    assert.doesNotMatch(error.message, /TypeError|\.kudzu/)
    return true
  })
})
