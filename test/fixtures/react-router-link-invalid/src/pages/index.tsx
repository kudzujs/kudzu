import { Link } from "react-router-dom"

export default function Page() {
  const destination = "/about"
  return <Link to={destination}>About</Link>
}
