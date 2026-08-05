import ts from "typescript"

export default function Page() {
  return <button onClick={() => { document.body.dataset.exported = ts.version }}>Export</button>
}
