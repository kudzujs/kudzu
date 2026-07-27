import { useEffect, useState } from "@kudzujs/core"

function LayoutResource({ version }: { version: number }) {
  useEffect(() => {
    document.body.dataset.layoutLog = `${document.body.dataset.layoutLog ?? ""}|setup ${version}`
    return () => {
      document.body.dataset.layoutLog += `|cleanup ${version}`
      document.body.dataset.disposeOrder = `${document.body.dataset.disposeOrder ?? ""}|layout`
    }
  }, [version])

  return <span data-layout-resource>Layout resource {version}</span>
}

export function Shell({ children }: { children?: unknown }) {
  const [open, setOpen] = useState(true)
  const [version, setVersion] = useState(0)

  return <div data-layout>
    <button data-layout-toggle onClick={() => setOpen(!open)}>Toggle layout</button>
    <button data-layout-version onClick={() => setVersion(version + 1)}>Layout version</button>
    {open && <LayoutResource version={version} />}
    <a href="/">Home</a>
    <a href="/other">Other</a>
    {children}
  </div>
}
