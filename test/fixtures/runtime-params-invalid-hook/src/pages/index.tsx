import { useParams } from "@kudzujs/core"

export default function Page() {
  const params = useParams()
  return <p>{params.id}</p>
}
