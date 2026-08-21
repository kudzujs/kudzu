import { useEffect, useState } from "react"
import { useSession } from "../session"
import { Shell } from "../Shell"

export const layout = Shell

export default function Settings() {
  const session = useSession(state => state.session)
  const clear = useSession(state => state.clear)
  const [check, setCheck] = useState(0)

  useEffect(() => {
    if (!session.token) return
    void fetch(`/answer/api/v1/user/me?check=${check}`, { headers: { Authorization: `Bearer ${session.token}` } })
      .then(response => {
        if (response.status !== 401) return
        localStorage.removeItem("answer-token")
        clear()
        location.replace("/")
      })
  }, [session.token, check])

  return <main><h1>Settings</h1><p data-protected-user>{session.username}</p><button data-check onClick={() => setCheck(check + 1)}>Check session</button></main>
}
