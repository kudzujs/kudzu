import { useEffect } from "react"

export function ImportedStatus({ label, value }: { label: string; value: number }) {
  useEffect(() => {
    document.body.dataset.propLog = (document.body.dataset.propLog ?? "") + `|mount ${label}:${value}`
    return () => { document.body.dataset.propLog += `|cleanup ${label}:${value}` }
  }, [value])
  return <p data-status={label}>{label}: {value}</p>
}
