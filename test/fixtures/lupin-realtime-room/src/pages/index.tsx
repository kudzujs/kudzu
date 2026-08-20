import { useEffect, useRef, useState } from "react"

type Snapshot = {
  room: string
  phase: string
  participants: Array<{ id: string; name: string; score: number }>
}

export default function RealtimeRoomPage() {
  const [connection, setConnection] = useState("connecting")
  const [snapshot, setSnapshot] = useState<Snapshot>({
    room: "office",
    phase: "waiting",
    participants: [{ id: "player-1", name: "Lupin", score: 0 }],
  })
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let stopped = false
    let socket: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let detach = () => {}
    let generation = 0

    const connect = () => {
      const current = ++generation
      const next = new WebSocket("wss://example.invalid/rooms/office")
      socket = next
      setConnection("connecting")

      const isCurrent = () => !stopped && current === generation && socket === next
      const onOpen = () => {
        if (isCurrent()) setConnection("connected")
      }
      const onMessage = (event: MessageEvent<string>) => {
        if (isCurrent()) setSnapshot(JSON.parse(event.data))
      }
      const onClose = () => {
        detach()
        if (isCurrent()) {
          setConnection("reconnecting")
          reconnectTimer = setTimeout(connect, 50)
        }
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

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext("2d")
    if (!context) return
    let frame = 0
    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.fillText(String(snapshot.participants.length), 8, 16)
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [snapshot.participants])

  return <main>
    <h1>{snapshot.room}</h1>
    <p data-connection={connection}>{connection}: {snapshot.phase}</p>
    <button onClick={async () => {
      await fetch("/commands/ready", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ room: snapshot.room, ready: true }),
      })
      document.body.dataset.command = "sent"
    }}>Ready</button>
    <ul>
      {snapshot.participants.map(participant =>
        <li key={participant.id} data-participant={participant.id}>
          {participant.name}: {participant.score}
        </li>
      )}
    </ul>
    <canvas ref={canvasRef} width="320" height="80" role="img" aria-label="Connected participants" />
  </main>
}
