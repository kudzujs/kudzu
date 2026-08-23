import { useState } from "@kudzujs/core"

export default function LoginPage() {
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  return <main>
    <h1>Sign in</h1>
    <form onSubmit={async event => {
      event.preventDefault()
      setSubmitting(true)
      setError("")
      const response = await fetch("/api/login", { method: "POST", body: new FormData(event.currentTarget) })
      if (!response.ok) {
        setError(`HTTP ${response.status}`)
        setSubmitting(false)
        return
      }
      const session = await response.json()
      localStorage.setItem("kudzu-project-token", session.token)
      location.assign("/app/projects")
    }}>
      <label>Email <input name="email" type="email" required /></label>
      <label>Password <input name="password" type="password" required /></label>
      <button disabled={submitting}>Log in</button>
      {error && <p role="alert">{error}</p>}
    </form>
  </main>
}
