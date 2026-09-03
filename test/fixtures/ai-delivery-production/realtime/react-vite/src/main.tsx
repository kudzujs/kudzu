import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"

type Memo = { id: string; author: string; content: string; createdAt: string; tag: string }
type Snapshot = { version: number; memos: Memo[] }

const seedMemos: Memo[] = [
  { id: "memo-103", author: "Nora", content: "Production deploy is green. Realtime smoke test is next.", createdAt: "2026-09-03T09:30:00.000Z", tag: "release" },
  { id: "memo-102", author: "Ilya", content: "The ownership review is ready for comments.", createdAt: "2026-09-03T08:15:00.000Z", tag: "engineering" },
  { id: "memo-101", author: "Mina", content: "Support handoff notes are in the team workspace.", createdAt: "2026-09-02T16:45:00.000Z", tag: "operations" },
]

function Feed() {
  const [memos, setMemos] = useState<Memo[]>(seedMemos)
  const [connection, setConnection] = useState("connecting")

  useEffect(() => {
    let stopped = false
    let socket: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let detach = () => {}
    let generation = 0
    let version = 1

    const connect = () => {
      const current = ++generation
      const next = new WebSocket("wss://example.invalid/memos/team-feed")
      socket = next
      setConnection("connecting")
      const isCurrent = () => !stopped && current === generation && socket === next
      const onOpen = () => {
        if (isCurrent()) setConnection("connected")
      }
      const onMessage = (event: MessageEvent<string>) => {
        if (!isCurrent()) return
        const snapshot = JSON.parse(event.data) as Snapshot
        if (snapshot.version <= version) return
        version = snapshot.version
        setMemos(snapshot.memos)
      }
      const onClose = () => {
        detach()
        if (!isCurrent()) return
        setConnection("reconnecting")
        reconnectTimer = setTimeout(connect, 80)
      }
      detach = () => {
        next.removeEventListener("open", onOpen)
        next.removeEventListener("message", onMessage)
        next.removeEventListener("close", onClose)
      }
      next.addEventListener("open", onOpen)
      next.addEventListener("message", onMessage)
      next.addEventListener("close", onClose)
    }

    connect()
    return () => {
      stopped = true
      generation += 1
      if (reconnectTimer !== null) clearTimeout(reconnectTimer)
      detach()
      socket?.close()
    }
  }, [])

  return <section id="feed" aria-labelledby="feed-title">
    <div className="feed-heading">
      <div><p className="eyebrow">Shared workspace</p><h1 id="feed-title">Team memos</h1></div>
      <p className="connection" role="status" aria-live="polite" data-connection={connection}>{connection}</p>
    </div>
    <ul className="memo-list">{memos.map(memo => <li className="memo" key={memo.id} data-memo-id={memo.id}>
      <header><strong>{memo.author}</strong><time dateTime={memo.createdAt}>{memo.createdAt.slice(11, 16)} UTC</time></header>
      <p>{memo.content}</p><span className="tag">#{memo.tag}</span>
    </li>)}</ul>
  </section>
}

function App() {
  const [feedMounted, setFeedMounted] = useState(true)
  return <><a className="skip" href="#feed">Skip to feed</a><div className="shell">
    <aside className="sidebar"><a className="brand" href="/">Memos Live</a><nav aria-label="Product"><a href="/" aria-current="page">Team feed</a><a href="/about/">About</a></nav><p className="account">Acme workspace<br /><strong>nora@example.test</strong></p></aside>
    <main className="workspace"><header className="topbar"><div><p className="eyebrow">Thursday, September 3</p><strong>Good morning, Nora</strong></div><span className="avatar" aria-label="Nora's account">N</span></header>
      {feedMounted ? <Feed /> : <section className="empty"><h1>Feed closed</h1><p>Realtime ownership has been released.</p></section>}
      <button className="owner-control" onClick={() => setFeedMounted(!feedMounted)}>{feedMounted ? "Close feed" : "Open feed"}</button>
    </main>
  </div></>
}

createRoot(document.getElementById("root")!).render(<App />)
