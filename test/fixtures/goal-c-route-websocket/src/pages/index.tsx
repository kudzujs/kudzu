import { useEffect, useRef, useState } from "react"

export default function SocketPage() {
  const [room, setRoom] = useState("general")
  const [status, setStatus] = useState("connecting")
  const socketRef = useRef<WebSocket | null>(null)
  const generationRef = useRef(0)

  useEffect(() => {
    const generation = ++generationRef.current
    const socket = new WebSocket(`wss://example.invalid/rooms/${room}`)
    socketRef.current = socket
    setStatus("connecting")

    const isCurrent = () => generation === generationRef.current && socketRef.current === socket
    const onOpen = () => {
      if (isCurrent()) setStatus("connected")
    }
    const onError = () => {
      if (isCurrent()) setStatus("failed")
    }

    socket.addEventListener("open", onOpen)
    socket.addEventListener("error", onError)
    return () => {
      generationRef.current += 1
      socket.removeEventListener("open", onOpen)
      socket.removeEventListener("error", onError)
      if (socketRef.current === socket) socketRef.current = null
      socket.close()
    }
  }, [room])

  return <main>
    <h1>Room socket</h1>
    <p>{room}: {status}</p>
    <button onClick={() => setRoom(room === "general" ? "support" : "general")}>Change room</button>
  </main>
}
