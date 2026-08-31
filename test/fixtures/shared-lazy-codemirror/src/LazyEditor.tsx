import { useEffect, useRef, useState } from "@kudzujs/core"

export function LazyEditor({ label }: { label: string }) {
  const [active, setActive] = useState(false)
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active) return
    let disposed = false
    let view: { destroy(): void } | undefined
    import("@codemirror/view").then(({ EditorView }) => {
      if (disposed) return
      view = new EditorView({ doc: label, parent: host.current! })
      document.body.dataset.sharedLazyMounts = String(Number(document.body.dataset.sharedLazyMounts || "0") + 1)
    })
    return () => {
      disposed = true
      if (view) view.destroy()
      document.body.dataset.sharedLazyDisposals = String(Number(document.body.dataset.sharedLazyDisposals || "0") + 1)
    }
  }, [active])

  return <section>
    <button data-toggle-shared-editor onClick={() => setActive(!active)}>{active ? "Close editor" : "Open editor"}</button>
    <div data-shared-editor-host ref={host}></div>
  </section>
}
