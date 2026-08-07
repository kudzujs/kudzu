import { useState } from "react"

const roomLink = "https://draw.example.test/#room=oak,cedar"

export default function RoomLinkShare() {
  const [status, setStatus] = useState("idle")
  const isShareSupported = "share" in navigator

  return <main>
    <h1>Live collaboration</h1>
    <label htmlFor="room-link">Room link</label>
    <input id="room-link" value={roomLink} readOnly />
    {isShareSupported && <button id="share-room" onClick={async () => {
      try {
        await navigator.share({ title: "Excalidraw room", text: "Join my room", url: roomLink })
        setStatus("shared")
      } catch {
        setStatus("share-failed")
      }
    }}>Share</button>}
    <button id="copy-room" onClick={async () => {
      try {
        await navigator.clipboard.writeText(roomLink)
        setStatus("copied")
      } catch {
        setStatus("copy-failed")
      }
    }}>Copy</button>
    {status !== "idle" && <p role="status">{status}</p>}
  </main>
}
