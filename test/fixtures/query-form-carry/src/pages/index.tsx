import { useSearchParam } from "@kudzujs/core"

export default function Page() {
  const name = useSearchParam("name")
  const email = useSearchParam("email")
  return <form method="get" action="/done">
    <input type="hidden" name="name" value={name ?? ""} disabled={name === null} />
    <input type="hidden" name="email" value={email ?? ""} disabled={email === null} />
    <button>Continue</button>
  </form>
}
