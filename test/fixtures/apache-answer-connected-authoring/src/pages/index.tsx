import { useState } from "react"
import { useSession } from "../session"
import { Shell } from "../Shell"

export const layout = Shell

export default function Login() {
  const replace = useSession(state => state.replace)
  const [error, setError] = useState("")

  return <main><h1>Log in</h1><form onSubmit={async event => {
    event.preventDefault()
    setError("")
    const response = await fetch("/answer/api/v1/user/login", { method: "POST", body: new FormData(event.currentTarget) })
    if (!response.ok) {
      setError(`HTTP ${response.status}`)
      return
    }
    const user = await response.json()
    localStorage.setItem("answer-token", user.access_token)
    replace({ status: "authenticated", token: user.access_token, username: user.username, isAdmin: user.is_admin })
  }}>
    <label>Email <input name="email" type="email" required /></label>
    <label>Password <input name="password" type="password" required /></label>
    <button>Log in</button>
    {error && <p role="alert">{error}</p>}
  </form><a data-continue href="/questions?page=2&amp;order=active">Continue</a></main>
}
