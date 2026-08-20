import { useEffect, useRef, useState } from "react"

type Player = { id: string; name: string; x: number; y: number; score: number }
type Snapshot = { phase: string; players: Player[] }
type DrawMessage = { e: "draw"; seg: { x: number; y: number; color: string } }

export default function GameCapabilityPage() {
  const [snapshot, setSnapshot] = useState<Snapshot>({ phase: "waiting", players: [] })
  const [privateWord, setPrivateWord] = useState("")
  const [answer, setAnswer] = useState("")
  const [composing, setComposing] = useState(false)
  const [panic, setPanic] = useState(false)
  const [copyStatus, setCopyStatus] = useState("")
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext("2d")
    if (!context) return

    let stopped = false
    let socket: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let frame = 0
    let generation = 0
    let players: Player[] = []
    let detach = () => {}
    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === "`") setPanic(true)
    }
    const onDocumentTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 3) setPanic(true)
    }

    const drawFrame = () => {
      for (const player of players) context.fillRect(player.x, player.y, 4, 4)
      frame = requestAnimationFrame(drawFrame)
    }

    const connect = () => {
      const current = ++generation
      const next = new WebSocket("wss://example.invalid/events?room=office&name=Lupin&role=player")
      socket = next
      const isCurrent = () => !stopped && current === generation && socket === next
      const onMessage = (event: MessageEvent<string>) => {
        if (!isCurrent()) return
        const message = JSON.parse(event.data) as Snapshot | DrawMessage
        if ("e" in message) {
          context.fillStyle = message.seg.color
          context.fillRect(message.seg.x, message.seg.y, 2, 2)
          return
        }
        players = message.players
        setSnapshot(message)
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

    void fetch("/drawInfo", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ roomId: "office", name: "Lupin" }),
    }).then(response => response.json()).then(info => {
      if (!stopped) setPrivateWord(info.word)
    })
    frame = requestAnimationFrame(drawFrame)
    connect()
    document.addEventListener("keydown", onDocumentKeyDown)
    document.addEventListener("touchstart", onDocumentTouchStart)

    return () => {
      stopped = true
      generation += 1
      if (reconnectTimer !== null) clearTimeout(reconnectTimer)
      cancelAnimationFrame(frame)
      detach()
      socket?.close()
      document.removeEventListener("keydown", onDocumentKeyDown)
      document.removeEventListener("touchstart", onDocumentTouchStart)
    }
  }, [])

  useEffect(() => {
    const previousTitle = document.title
    if (panic) document.title = "회의록"
    return () => {
      document.title = previousTitle
    }
  }, [panic])

  return <main>
    <h1>게임 capability matrix</h1>
    <p data-phase={snapshot.phase}>{snapshot.phase}</p>
    {privateWord && <p role="status">내 제시어: {privateWord}</p>}
    <form onSubmit={async event => {
      event.preventDefault()
      if (composing || !answer.trim()) return
      await fetch("/answer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roomId: "office", answer }),
      })
      setAnswer("")
    }}>
      <label htmlFor="game-answer">정답</label>
      <input
        id="game-answer"
        value={answer}
        onInput={event => setAnswer(event.currentTarget.value)}
        onCompositionStart={() => setComposing(true)}
        onCompositionEnd={(event: CompositionEvent & { currentTarget: HTMLInputElement }) => {
          setComposing(false)
          setAnswer(event.currentTarget.value)
        }}
        onPaste={(event: ClipboardEvent) => event.preventDefault()}
        onDrop={(event: DragEvent) => event.preventDefault()}
      />
      <button type="submit">제출</button>
    </form>
    <button onClick={async () => {
      try {
        await navigator.clipboard.writeText(location.href)
        setCopyStatus("링크 복사됨")
      } catch {
        window.prompt("링크 복사", location.href)
        setCopyStatus("직접 복사")
      }
    }}>초대 링크 복사</button>
    {copyStatus && <p role="status">{copyStatus}</p>}
    {panic && <section role="dialog" aria-label="화면 숨기기">
      <h2>회의 안건</h2>
      <button onClick={() => setPanic(false)}>게임으로 돌아가기</button>
    </section>}
    <canvas
      ref={canvasRef}
      width="640"
      height="360"
      tabIndex={0}
      aria-label="실시간 게임 보드"
      onPointerDown={(event: PointerEvent & { currentTarget: HTMLCanvasElement }) => event.currentTarget.setPointerCapture(event.pointerId)}
      onPointerMove={(event: PointerEvent & { currentTarget: HTMLCanvasElement }) => {
        if (event.buttons !== 1) return
        const rect = event.currentTarget.getBoundingClientRect()
        const x = Math.round(event.clientX - rect.left)
        const y = Math.round(event.clientY - rect.top)
        event.currentTarget.getContext("2d")?.fillRect(x, y, 2, 2)
        void fetch("/draw", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ roomId: "office", name: "Lupin", seg: { x, y } }),
        })
      }}
      onKeyDown={(event: KeyboardEvent & { currentTarget: HTMLCanvasElement }) => {
        if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) return
        event.preventDefault()
        void fetch("/input", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ roomId: "office", name: "Lupin", key: event.key }),
        })
      }}
      onPointerUp={(event: PointerEvent & { currentTarget: HTMLCanvasElement }) => event.currentTarget.releasePointerCapture(event.pointerId)}
    />
    <ul>{snapshot.players.map(player => <li key={player.id} data-player={player.id}>
      {player.name}: {player.score}
    </li>)}</ul>
  </main>
}
