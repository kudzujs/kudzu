import { useParams, useState } from "@kudzujs/core"

export const runtimeParams = true

export default function Page() {
  const { org, id } = useParams<{ org: string; id: string }>()
  const [status] = useState("pending")
  return <main data-org={org} data-id={id}><strong>{org}</strong><p>{status}</p></main>
}
