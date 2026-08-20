import { useEffect, useState } from "react"

type RoomSnapshot = {
  roomName: string
  chat: Array<{ name: string; msg: string; time: string }>
  spectators: string[]
}

export default function RoomSocialPage() {
  const [role, setRole] = useState("player")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [snapshot, setSnapshot] = useState<RoomSnapshot>({
    roomName: "점심 내기",
    chat: [],
    spectators: [],
  })

  useEffect(() => {
    let stopped = false
    let socket: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let detach = () => {}
    let generation = 0
    const connect = () => {
      const current = ++generation
      const next = new WebSocket("wss://example.invalid/events?room=office&name=Lupin&role=" + role)
      socket = next
      const isCurrent = () => !stopped && current === generation && socket === next
      const onMessage = (event: MessageEvent<string>) => {
        if (isCurrent()) setSnapshot(JSON.parse(event.data))
      }
      const onClose = () => {
        detach()
        if (isCurrent()) reconnectTimer = setTimeout(connect, 50)
      }
      detach = () => {
        next.removeEventListener("message", onMessage)
        next.removeEventListener("close", onClose)
      }
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
  }, [role])

  return <main>
    <h1>{snapshot.roomName}</h1>
    <p>현재 역할: <strong>{role === "player" ? "플레이어" : "관전자"}</strong></p>

    <form onSubmit={async event => {
      event.preventDefault()
      const msg = message.trim()
      if (!msg) return
      await fetch("/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roomId: "office", name: "Lupin", msg }),
      })
      setMessage("")
    }}>
      <label htmlFor="chat-message">메시지</label>
      <input id="chat-message" value={message} onInput={event => setMessage(event.currentTarget.value)} />
      <button type="submit">보내기</button>
    </form>

    <ol>{snapshot.chat.map((entry, index) => <li key={index}>
      <strong>{entry.name}</strong> <time>{entry.time}</time> {entry.msg}
    </li>)}</ol>

    <h2>관전자</h2>
    <ul>{snapshot.spectators.map((name, index) => <li key={index}>{name}</li>)}</ul>

    {role === "player" ? <button onClick={async () => {
      await fetch("/leave", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roomId: "office", name: "Lupin" }),
      })
      setRole("spectator")
    }}>관전으로 전환</button> : <button onClick={async () => {
      const tokenKey = "sw-tok-office"
      const response = await fetch("/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          roomId: "office",
          name: "Lupin",
          token: localStorage.getItem(tokenKey) ?? "",
        }),
      })
      const joined = await response.json()
      if (!joined.ok) {
        setError(joined.error)
        return
      }
      localStorage.setItem(tokenKey, joined.token)
      setRole("player")
    }}>플레이어로 참여</button>}
    {error && <p role="alert">{error}</p>}
  </main>
}
