import { EditorView } from "@codemirror/view"
import { useEffect, useRef, useState } from "@kudzujs/core"
import { Shell } from "../Shell"

export const layout = Shell

function Editor() {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const parent = host.current
    if (!parent) return
    const view = new EditorView({ doc: "Endurance", parent })
    document.body.dataset.editorMounts = String(Number(document.body.dataset.editorMounts || "0") + 1)
    return () => {
      view.destroy()
      document.body.dataset.editorDisposals = String(Number(document.body.dataset.editorDisposals || "0") + 1)
    }
  }, [])

  return <section data-editor><div data-editor-host ref={host}></div></section>
}

function Row({ row }: { row: { id: string; label: string } }) {
  const [draft, setDraft] = useState(row)
  return <li data-row={row.id}><input data-row-draft={row.id} value={draft.label} onInput={event => setDraft({ id: draft.id, label: event.currentTarget.value })} /></li>
}

export default function Page() {
  const [visible, setVisible] = useState(true)
  const [rows, setRows] = useState([{ id: "alpha", label: "alpha" }, { id: "beta", label: "beta" }])
  const dialog = useRef<HTMLDialogElement>(null)

  return <main data-route="harness">
    <button data-toggle-editor onClick={() => setVisible(!visible)}>Toggle editor</button>
    {visible && <Editor />}
    <button data-add-row onClick={() => setRows([...rows, { id: "temporary", label: "temporary" }])}>Add row</button>
    <button data-remove-row onClick={() => setRows(rows.filter(row => row.id !== "temporary"))}>Remove row</button>
    <ul data-rows>{rows.map(row => <Row key={row.id} row={row} />)}</ul>
    <button data-open-dialog onClick={() => dialog.current?.showModal()}>Open dialog</button>
    <dialog data-dialog ref={dialog}>
      <h2>Endurance dialog</h2>
      <button data-close-dialog onClick={() => dialog.current?.close()}>Close dialog</button>
    </dialog>
  </main>
}
