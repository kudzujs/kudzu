import { useNavigate } from "react-router-dom"

export default function Page() {
  const navigate = useNavigate()
  const destination = "/items/oak"
  return <button onClick={() => navigate(destination)}>Open</button>
}
