import { useState } from "react"

const rooms = [{ id: "secret", name: "비밀 회의", locked: true }]

export default function PrivateRoomPage() {
  const [name, setName] = useState("")
  const [selectedRoom, setSelectedRoom] = useState("")
  const [selectedRole, setSelectedRole] = useState("player")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  return <main>
    <h1>비밀방 입장</h1>
    <label htmlFor="private-name">이름</label>
    <input id="private-name" required value={name} onInput={event => setName(event.currentTarget.value)} />
    <ul>{rooms.map(room => <li key={room.id} data-room={room.id}>
      <strong>{room.name}</strong>
      <button onClick={() => {
        setSelectedRoom(room.id)
        setSelectedRole("player")
        setError("")
      }}>플레이</button>
      <button onClick={() => {
        setSelectedRoom(room.id)
        setSelectedRole("spectator")
        setError("")
      }}>관전</button>
    </li>)}</ul>

    {selectedRoom && <section role="dialog" aria-modal="true" aria-labelledby="password-title">
      <h2 id="password-title">비밀번호 입력</h2>
      <form onSubmit={async event => {
        event.preventDefault()
        const enteredResponse = await fetch("/enter", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ roomId: selectedRoom, password }),
        })
        const entered = await enteredResponse.json()
        if (!entered.ok) {
          setError(entered.error)
          return
        }
        if (selectedRole === "player") {
          const tokenKey = "sw-tok-" + selectedRoom
          const joinResponse = await fetch("/join", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              roomId: selectedRoom,
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
        }
        location.assign("/?room=" + selectedRoom + "&role=" + selectedRole)
      }}>
        <label htmlFor="room-password">비밀번호</label>
        <input
          id="room-password"
          type="password"
          required
          value={password}
          onInput={event => setPassword(event.currentTarget.value)}
        />
        <button type="submit">입장</button>
        <button type="button" onClick={() => {
          setSelectedRoom("")
          setPassword("")
          setError("")
        }}>취소</button>
      </form>
      {error && <p role="alert">{error}</p>}
    </section>}
  </main>
}
