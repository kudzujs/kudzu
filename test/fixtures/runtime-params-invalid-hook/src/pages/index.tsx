import { useParams } from "react-router-dom"

export default function Page() {
  const params = useParams()
  return <p>{params.id}</p>
}
