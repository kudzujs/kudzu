import { type ReactNode, useEffect } from "react"
import { useSession } from "./session"

export function Shell({ children }: { children?: ReactNode }) {
  const session = useSession(state => state.session)
  const replace = useSession(state => state.replace)
  const clear = useSession(state => state.clear)

  useEffect(() => {
    const token = localStorage.getItem("memos-token") || ""
    if (!token) {
      clear()
      return
    }
    void fetch("/api/v1/user/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(async response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      })
      .then(user => replace({ status: "authenticated", token, username: user.username }))
      .catch(() => {
        localStorage.removeItem("memos-token")
        clear()
      })
  }, [])

  return <><header>
    <a href="/feed">Memos</a>
    <output data-session-status>{session.status}</output>
    <strong data-session-user>{session.username}</strong>
    <button data-logout onClick={() => {
      localStorage.removeItem("memos-token")
      clear()
      location.replace("/")
    }}>Log out</button>
  </header>{children}</>
}
