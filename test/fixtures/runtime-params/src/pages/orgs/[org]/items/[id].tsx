import { useEffect, useParams, useState } from "@kudzujs/core"

export const runtimeParams = true

function ParamValue({ value }: { value: string }) {
  return <strong data-child>{value}</strong>
}

export default function RuntimeItemPage() {
  const { org, id } = useParams<{ org: string; id: string }>()
  const [status, setStatus] = useState("pending")

  useEffect(() => {
    setStatus(`${org}/${id}`)
    document.body.dataset.effectParams = `${org}:${id}`
  }, [org, id])

  function mark() {
    document.body.dataset.eventParams = `${org}:${id}`
  }

  return <main data-org={org} data-id={id}>
    <h1>{org}</h1>
    <ParamValue value={id} />
    <p data-derived>{`Item ${id} in ${org}`}</p>
    <p data-status>{status}</p>
    <a data-edit href={`/포털/orgs/${org}/items/${id}/edit`}>Edit</a>
    <button onClick={mark}>Mark</button>
  </main>
}
