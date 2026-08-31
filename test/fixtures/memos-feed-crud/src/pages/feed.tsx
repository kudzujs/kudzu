import { useEffect, useState } from "react"
import { Shell } from "../Shell"
import { useSession } from "../session"

type Memo = { id: number; content: string; reactions: number }

export const layout = Shell

export default function Feed() {
  const session = useSession(state => state.session)
  const [memos, setMemos] = useState<Memo[]>([])
  const [page, setPage] = useState(1)
  const [refresh, setRefresh] = useState(0)
  const [status, setStatus] = useState("loading")
  const [error, setError] = useState("")
  const [connection, setConnection] = useState("connecting")

  useEffect(() => {
    if (!session.token) return
    setStatus("loading")
    setError("")
    void fetch(`/api/v1/memos?page=${page}&refresh=${refresh}`, { headers: { Authorization: `Bearer ${session.token}` } })
      .then(async response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      })
      .then(next => {
        setMemos(next.data)
        setStatus("success")
      })
      .catch(cause => {
        setError(cause instanceof Error ? cause.message : String(cause))
        setStatus("error")
      })
  }, [session.token, page, refresh])

  useEffect(() => {
    let stopped = false
    let socket: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let detach = () => {}
    let generation = 0
    let version = 0

    const connect = () => {
      const current = ++generation
      const next = new WebSocket("wss://example.invalid/memos/events")
      socket = next
      setConnection("connecting")
      const isCurrent = () => !stopped && current === generation && socket === next
      const onOpen = () => {
        if (isCurrent()) setConnection("connected")
      }
      const onMessage = (event: MessageEvent<string>) => {
        if (!isCurrent()) return
        const message = JSON.parse(event.data)
        if (message.version <= version) return
        version = message.version
        setMemos(message.data)
      }
      const onClose = () => {
        detach()
        if (!isCurrent()) return
        setConnection("reconnecting")
        reconnectTimer = setTimeout(connect, 50)
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

  return <main data-page={page}>
    <h1>Memo feed</h1>
    <p data-connection>{connection}</p>
    <form data-create onSubmit={async event => {
      event.preventDefault()
      const response = await fetch("/api/v1/memos", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.token}` },
        body: new FormData(event.currentTarget),
      })
      if (!response.ok) {
        setError(`HTTP ${response.status}`)
        return
      }
      setRefresh(refresh + 1)
    }}>
      <label>New memo <textarea name="content" required /></label>
      <button>Create</button>
    </form>
    <button data-next onClick={() => setPage(page + 1)}>Next page</button>
    <button data-refresh onClick={() => setRefresh(refresh + 1)}>Refresh</button>
    <a data-leave href="/">Leave feed</a>
    {status === "loading" && <p role="status">Loading memos</p>}
    {status === "error" && <p role="alert">{error}</p>}
    <ul id="memos">{memos.map(memo => <li key={memo.id} data-memo={memo.id}>
      <p>{memo.content}</p>
      <output data-reactions>{memo.reactions}</output>
      <button data-react onClick={async () => {
        const response = await fetch(`/api/v1/memos/${memo.id}/reactions`, { method: "POST", headers: { Authorization: `Bearer ${session.token}` } })
        if (!response.ok) setError(`HTTP ${response.status}`)
      }}>React</button>
      <button data-edit onClick={async () => {
        const response = await fetch(`/api/v1/memos/${memo.id}`, { method: "PUT", headers: { Authorization: `Bearer ${session.token}` } })
        if (!response.ok) {
          setError(`HTTP ${response.status}`)
          return
        }
        setRefresh(refresh + 1)
      }}>Edit</button>
      <button data-delete onClick={async () => {
        const response = await fetch(`/api/v1/memos/${memo.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${session.token}` } })
        if (!response.ok) {
          setError(`HTTP ${response.status}`)
          return
        }
        setRefresh(refresh + 1)
      }}>Delete</button>
    </li>)}</ul>
  </main>
}
