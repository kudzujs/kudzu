import { useState } from "react"
import { Shell } from "../Shell"
import { useSession } from "../session"

export const layout = Shell

export default function Login() {
  const replace = useSession(state => state.replace)
  const [error, setError] = useState("")

  return <main><h1>Sign in to Memos</h1><form onSubmit={async event => {
    event.preventDefault()
    setError("")
    const response = await fetch("/api/v1/auth/signin", { method: "POST", body: new FormData(event.currentTarget) })
    if (!response.ok) {
      setError(`HTTP ${response.status}`)
      return
    }
    const user = await response.json()
    localStorage.setItem("memos-token", user.token)
    replace({ status: "authenticated", token: user.token, username: user.username })
  }}>
    <label>Email <input name="email" type="email" required /></label>
    <label>Password <input name="password" type="password" required /></label>
    <button>Sign in</button>
    {error && <p role="alert">{error}</p>}
  </form><a data-continue href="/feed">Open feed</a></main>
}
