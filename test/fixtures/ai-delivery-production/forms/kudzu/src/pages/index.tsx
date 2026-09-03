import { useRef, useState } from "@kudzujs/core"
import "../styles.css"

export default function SignupPage() {
  const [status, setStatus] = useState("idle")
  const [emailError, setEmailError] = useState("")
  const [formError, setFormError] = useState("")
  const emailRef = useRef<HTMLInputElement>(null)

  async function submit(event: SubmitEvent & { currentTarget: HTMLFormElement }) {
    event.preventDefault()
    if (status === "pending") return

    setStatus("pending")
    setEmailError("")
    setFormError("")

    let response: Response
    try {
      response = await fetch("/api/accounts", {
        method: "POST",
        body: new FormData(event.currentTarget)
      })
    } catch {
      setFormError("We could not reach the account service. Try again.")
      setStatus("idle")
      return
    }

    const result = await response.json()
    if (response.status === 422) {
      setEmailError(result.errors.email)
      setStatus("idle")
      emailRef.current?.focus()
      return
    }
    if (!response.ok) {
      setFormError(result.error)
      setStatus("idle")
      return
    }
    setStatus("success")
  }

  return <>
    <header className="site-header shell">
      <a className="brand" href="/">Northstar</a>
      <nav aria-label="Account links"><a href="/privacy/">Privacy</a><a href="mailto:support@northstar.example">Support</a></nav>
    </header>
    <main className="signup-layout shell">
      <section className="intro" aria-labelledby="signup-title">
        <p className="eyebrow">Workspace access</p>
        <h1 id="signup-title">Create your Northstar account</h1>
        <p className="lede">Bring projects, decisions, and customer context into one calm workspace built for growing teams.</p>
        <ul className="benefits"><li>14-day team trial</li><li>No payment details required</li><li>Export your workspace at any time</li></ul>
      </section>

      <section className="card" aria-label="Signup form">
        <form onSubmit={submit}>
          <fieldset>
            <legend>Account</legend>
            <div className="field">
              <label htmlFor="email">Work email</label>
              <input ref={emailRef} id="email" name="email" type="email" autoComplete="email" required maxLength={254} aria-invalid={emailError ? "true" : "false"} aria-describedby={emailError ? "email-error" : undefined} />
              {emailError && <p className="message error" id="email-error" role="alert">{emailError}</p>}
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} pattern="(?=.*[A-Za-z])(?=.*[0-9]).{12,}" aria-describedby="password-hint" />
              <p className="hint" id="password-hint">12 or more characters with at least one letter and one number.</p>
            </div>
          </fieldset>

          <fieldset>
            <legend>Profile</legend>
            <div className="field"><label htmlFor="fullName">Full name</label><input id="fullName" name="fullName" autoComplete="name" required minLength={2} maxLength={80} /></div>
            <div className="field"><label htmlFor="organization">Organization <span className="hint">(optional)</span></label><input id="organization" name="organization" autoComplete="organization" maxLength={100} /></div>
            <div className="field">
              <label htmlFor="role">Your role</label>
              <select id="role" name="role" required defaultValue="">
                <option value="" disabled>Select a role</option>
                <option value="individual">Individual contributor</option>
                <option value="manager">Manager</option>
                <option value="founder">Founder</option>
                <option value="student">Student</option>
              </select>
            </div>
          </fieldset>

          <fieldset>
            <legend>Preferences</legend>
            <label className="check"><input name="productUpdates" type="checkbox" /> <span>Send occasional product and research updates.</span></label>
            <label className="check"><input name="terms" type="checkbox" required /> <span>I agree to the terms and have read the <a href="/privacy/">privacy notice</a>.</span></label>
          </fieldset>

          <button type="submit" disabled={status === "pending"}>{status === "pending" ? "Creating account" : "Create account"}</button>
          {formError && <p className="message error" role="alert">{formError}</p>}
          {status === "success" && <p className="message success" role="status">Account created. Check your email to verify your address.</p>}
        </form>
      </section>
    </main>
  </>
}
