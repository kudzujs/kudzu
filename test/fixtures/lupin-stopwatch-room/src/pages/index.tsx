import { useEffect, useState } from "react"

type StopwatchSnapshot = {
  type: "stopwatch"
  roomName: string
  users: Array<{
    name: string
    records: string[]
    running: boolean
    score: number | null
  }>
  done: boolean
  losers: string[]
}

export default function StopwatchRoomPage() {
  const [snapshot, setSnapshot] = useState<StopwatchSnapshot>({
    type: "stopwatch",
    roomName: "점심 내기",
    users: [{ name: "루팡", records: [], running: false, score: null }],
    done: false,
    losers: [],
  })
  const [running, setRunning] = useState(false)
  const [startedAt, setStartedAt] = useState(0)
  const [elapsed, setElapsed] = useState("0.00")

  useEffect(() => {
    let stopped = false
    let socket: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let detach = () => {}
    let generation = 0
    const connect = () => {
      const current = ++generation
      const next = new WebSocket("wss://example.invalid/events?room=office&name=Lupin&role=player")
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
  }, [])

  useEffect(() => {
    if (!running) return
    let frame = 0
    const tick = () => {
      setElapsed(((performance.now() - startedAt) / 1000).toFixed(2))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [running, startedAt])

  return <main>
    <h1>{snapshot.roomName}</h1>
    <output aria-live="off">{elapsed}</output>
    <button onClick={async () => {
      if (!running) {
        setStartedAt(performance.now())
        setRunning(true)
        await fetch("/running", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ roomId: "office", name: "Lupin", running: true }),
        })
        return
      }
      const time = ((performance.now() - startedAt) / 1000).toFixed(2)
      setRunning(false)
      setElapsed(time)
      await fetch("/record", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roomId: "office", name: "Lupin", time }),
      })
    }}>{running ? "스탑" : "시작"}</button>
    <button onClick={async () => {
      await fetch("/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roomId: "office" }),
      })
    }}>초기화</button>

    <table>
      <thead><tr><th>이름</th><th>1차</th><th>2차</th><th>점수</th><th>상태</th></tr></thead>
      <tbody>{snapshot.users.map(user => <tr key={user.name} data-user={user.name}>
        <th>{user.name}</th>
        <td>{user.records[0] || "-"}</td>
        <td>{user.records[1] || "-"}</td>
        <td>{user.score === null ? "-" : user.score}</td>
        <td>{user.running ? "측정 중" : user.records.length === 2 ? "완료" : "대기"}</td>
      </tr>)}</tbody>
    </table>

    {snapshot.done && <section role="status">
      <h2>게임 종료</h2>
      <p>패배</p>
      <ul>{snapshot.losers.map((name, index) => <li key={index}>{name}</li>)}</ul>
    </section>}
  </main>
}
