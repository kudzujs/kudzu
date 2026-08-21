import { useState } from "react"
import { useSession } from "../session"
import { Shell } from "../Shell"

export const layout = Shell

export default function Login() {
  const replace = useSession(state => state.replace)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  return <main><h1>Log in</h1><form onSubmit={async event => {
    event.preventDefault()
    setSubmitting(true)
    setError("")
    const fields = new FormData(event.currentTarget)
    const response = await fetch("/answer/api/v1/user/login", { method: "POST", body: fields })
    if (!response.ok) {
      setError(`HTTP ${response.status}`)
      setSubmitting(false)
      return
    }
    const user = await response.json()
    localStorage.setItem("answer-token", user.access_token)
    replace({ status: "authenticated", token: user.access_token, username: user.username, isAdmin: user.is_admin })
    setSubmitting(false)
  }}>
    <label>Email <input name="email" type="email" required /></label>
    <label>Password <input name="password" type="password" required /></label>
    <button disabled={submitting}>Log in</button>
    {error && <p role="alert">{error}</p>}
  </form></main>
}
