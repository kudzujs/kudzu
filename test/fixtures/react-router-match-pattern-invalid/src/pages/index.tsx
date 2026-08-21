import { useMatch } from "react-router-dom"

export default function Page() {
  const match = useMatch("/questions/:id")
  return <main>{match ? "Matched" : "Not matched"}</main>
}
