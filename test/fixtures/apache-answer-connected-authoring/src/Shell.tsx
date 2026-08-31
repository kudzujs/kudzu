import { type ReactNode, useEffect } from "react"
import { useSession } from "./session"

export function Shell({ children }: { children?: ReactNode }) {
  const session = useSession(state => state.session)
  const replace = useSession(state => state.replace)
  const clear = useSession(state => state.clear)

  useEffect(() => {
    const token = localStorage.getItem("answer-token") || ""
    if (!token) {
      clear()
      return
    }
    void fetch("/answer/api/v1/user/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(async response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      })
      .then(user => replace({ status: "authenticated", token, username: user.username, isAdmin: user.is_admin }))
      .catch(() => {
        localStorage.removeItem("answer-token")
        clear()
      })
  }, [])

  return <><header>
    <a href="/questions">Answer</a>
    <nav aria-label="Primary">
      <a href="/questions">Questions</a>
      <a href="/questions/add">Ask</a>
      <a href="/admin/questions">Admin</a>
    </nav>
    <output data-session-status>{session.status}</output>
    <strong data-session-user>{session.username}</strong>
    <button data-logout onClick={() => {
      localStorage.removeItem("answer-token")
      clear()
      location.replace("/")
    }}>Log out</button>
  </header>{children}</>
}
