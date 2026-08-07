import { useState } from "react"
import { SignupField } from "../SignupField"

export default function SignupPage() {
  const [status, setStatus] = useState("idle")

  async function submit(event: SubmitEvent & { currentTarget: HTMLFormElement }) {
    event.preventDefault()
    const email = String(new FormData(event.currentTarget).get("email") ?? "")

    setStatus("submitting")
    await new Promise(resolve => setTimeout(resolve, 25))
    setStatus(email === "taken@example.com" ? "error" : "success")
  }

  return <main>
    <h1>Create account</h1>
    <form id="signup-form" onSubmit={submit}>
      <SignupField id="email" label="Email" name="email" type="email" status={status} />
      <SignupField id="password" label="Password" name="password" type="password" minLength={8} status="idle" />
      <button id="signup-submit" type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Creating account" : "Create account"}
      </button>
      {status === "error" && <p id="signup-error" role="alert">That email is already registered.</p>}
      {status === "success" && <p id="signup-success" role="status">Account created.</p>}
    </form>
  </main>
}
