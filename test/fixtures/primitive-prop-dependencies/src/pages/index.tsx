import { useEffect, useState } from "react"
import { ImportedStatus } from "../ImportedStatus"

function LocalStatus({ label, value }: { label: string; value: number }) {
  useEffect(() => {
    document.body.dataset.propLog = (document.body.dataset.propLog ?? "") + `|mount ${label}:${value}`
    return () => { document.body.dataset.propLog += `|cleanup ${label}:${value}` }
  }, [value])
  return <p data-status={label}>{label}: {value}</p>
}

export default function Page() {
  const [value, setValue] = useState(1)
  const [shown, setShown] = useState(false)
  return <main>
    <button data-action="increment" onClick={() => setValue(value + 1)}>Increment</button>
    <button data-action="show" onClick={() => setShown(true)}>Show</button>
    <button data-action="hide" onClick={() => setShown(false)}>Hide</button>
    <LocalStatus label="Local" value={value} />
    <ImportedStatus label="Imported" value={value} />
    {shown && <ImportedStatus label="Conditional" value={value} />}
  </main>
}
