import { useRef, useState } from "@kudzujs/core"
import { ImportedButton } from "../ImportedButton"
import { ImportedSearch } from "../ImportedSearch"

type ButtonRef = { readonly current: HTMLButtonElement | null }

function LocalButton({ onPress, buttonRef }: { onPress: () => void; buttonRef: ButtonRef }) {
  return <button id="local-button" ref={buttonRef} onClick={onPress}>Local</button>
}

export default function Page() {
  const [count, setCount] = useState(0)
  const [query, setQuery] = useState("")
  const [shown, setShown] = useState(true)
  const localRef = useRef<HTMLButtonElement>(null)
  const importedRef = useRef<HTMLButtonElement>(null)
  const increment = () => setCount(count + 1)

  function recordRefs() {
    document.body.dataset.refs = `${localRef.current?.id ?? "none"},${importedRef.current?.id ?? "none"}`
  }

  return <main>
    <p id="count">{count}</p>
    <p id="query">{query}</p>
    <ImportedSearch onValueChange={setQuery} />
    <button id="toggle" onClick={() => setShown(!shown)}>Toggle</button>
    <button id="record-refs" onClick={recordRefs}>Record refs</button>
    {shown && <section id="controls">
      <LocalButton buttonRef={localRef} onPress={() => setCount(count + 1)} />
      <ImportedButton buttonRef={importedRef} onPress={increment} />
    </section>}
  </main>
}
