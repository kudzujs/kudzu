import { useEffect, useId, useRef, useState } from "@kudzujs/core"
import { ImportedControls } from "../ImportedControls"
import { ImportedAgeInput } from "../ImportedAgeInput"
import { ImportedProfileInput } from "../ImportedProfileInput"
import { ImportedSearchField } from "../ImportedSearchField"

type ButtonRef = { readonly current: HTMLButtonElement | null }

function LocalButton({ onPress, buttonRef }: { onPress: () => void; buttonRef: ButtonRef }) {
  const [pressed, setPressed] = useState(false)
  const generatedId = useId()
  const innerRef = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    document.body.dataset.localEffects = (document.body.dataset.localEffects ?? "") + `|setup:${pressed}:${innerRef.current?.id}`
    return () => { document.body.dataset.localEffects += `|cleanup:${pressed}:${innerRef.current?.id}` }
  }, [pressed])
  return <button id="local-button" ref={buttonRef} data-generated-id={generatedId} onClick={() => {
    setPressed(!pressed)
    onPress()
  }}>Local {pressed ? "on" : "off"}<span id="local-inner" ref={innerRef} /></button>
}

export default function Page() {
  const [count, setCount] = useState(0)
  const [query, setQuery] = useState("")
  const [shown, setShown] = useState(true)
  const [age, setAge] = useState(30)
  const [profile, setProfile] = useState({ name: "Pine" })
  const localRef = useRef<HTMLButtonElement>(null)
  const importedRef = useRef<HTMLButtonElement>(null)
  const increment = () => setCount(count + 1)

  function recordRefs() {
    document.body.dataset.refs = `${localRef.current?.id ?? "none"},${importedRef.current?.id ?? "none"}`
  }

  return <main>
    <p id="count">{count}</p>
    <p id="query">{query}</p>
    <p id="age">{age}</p>
    <p id="profile">{profile.name}</p>
    <ImportedSearchField onValueChange={setQuery} />
    <ImportedProfileInput value={profile} onChange={setProfile} />
    <button id="toggle" onClick={() => setShown(!shown)}>Toggle</button>
    <button id="record-refs" onClick={recordRefs}>Record refs</button>
    <button id="set-age" onClick={() => setAge(42)}>Set age</button>
    {shown && <section id="controls">
      <ImportedAgeInput value={age} onChange={setAge} tooltip="Current age help" />
      <ImportedAgeInput id="age-input-plain" value={age} onChange={setAge} />
      <LocalButton buttonRef={localRef} onPress={() => setCount(count + 1)} />
      <ImportedControls buttonRef={importedRef} onPress={increment} />
    </section>}
  </main>
}
