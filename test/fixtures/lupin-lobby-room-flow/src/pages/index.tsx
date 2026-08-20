import { useEffect, useState } from "react"

type Room = {
  id: string
  name: string
  type: string
  locked: boolean
  players: number
  spectators: number
  playing: boolean
}

type LobbySnapshot = {
  rooms: Room[]
}

export default function LupinLobbyPage() {
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [snapshot, setSnapshot] = useState<LobbySnapshot>({ rooms: [] })

  useEffect(() => {
    const protocol = location.protocol === "https:" ? "wss://" : "ws://"
    const socket = new WebSocket(protocol + location.host + "/lobby")
    const onMessage = (event: MessageEvent<string>) => {
      setSnapshot(JSON.parse(event.data))
    }
    socket.addEventListener("message", onMessage)
    return () => {
      socket.removeEventListener("message", onMessage)
      socket.close()
    }
  }, [])

  return <main>
    <h1>월급루팡연구소</h1>
    <label htmlFor="player-name">이름</label>
    <input
      id="player-name"
      required
      maxLength={12}
      value={name}
      onInput={event => setName(event.currentTarget.value)}
    />

    <form onSubmit={async event => {
      event.preventDefault()
      const roomName = String(new FormData(event.currentTarget).get("roomName") ?? "").trim()
      const createResponse = await fetch("/createRoom", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roomName, password: "", type: "stopwatch" }),
      })
      const created = await createResponse.json()
      if (!created.ok) {
        setError(created.error)
        return
      }
      const tokenKey = "sw-tok-" + created.id
      const joinResponse = await fetch("/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          roomId: created.id,
          name,
          token: localStorage.getItem(tokenKey) ?? "",
        }),
      })
      const joined = await joinResponse.json()
      if (!joined.ok) {
        setError(joined.error)
        return
      }
      localStorage.setItem(tokenKey, joined.token)
      location.assign("/?room=" + created.id)
    }}>
      <label htmlFor="room-name">방 이름</label>
      <input id="room-name" name="roomName" required maxLength={20} />
      <button type="submit">방 만들기</button>
    </form>

    {error && <p role="alert">{error}</p>}
    {snapshot.rooms.length === 0 && <p>아직 열린 방이 없습니다.</p>}

    <ul>
      {snapshot.rooms.map(room => <li key={room.id} data-room={room.id}>
        <strong>{room.name}</strong>
        <span>{room.players}명 · {room.spectators}명 관전 · {room.playing ? "진행 중" : "대기 중"}</span>
        <button disabled={room.locked} onClick={async () => {
          const enterResponse = await fetch("/enter", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ roomId: room.id, password: "" }),
          })
          const entered = await enterResponse.json()
          if (!entered.ok) {
            setError(entered.error)
            return
          }
          const tokenKey = "sw-tok-" + room.id
          const joinResponse = await fetch("/join", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              roomId: room.id,
              name,
              token: localStorage.getItem(tokenKey) ?? "",
            }),
          })
          const joined = await joinResponse.json()
          if (!joined.ok) {
            setError(joined.error)
            return
          }
          localStorage.setItem(tokenKey, joined.token)
          location.assign("/?room=" + room.id)
        }}>플레이</button>
      </li>)}
    </ul>
  </main>
}
