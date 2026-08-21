import { useMatch } from "react-router-dom"

export default function Page() {
  const pattern = "/"
  const match = useMatch(pattern)
  return <main>{match ? "Matched" : "Not matched"}</main>
}
