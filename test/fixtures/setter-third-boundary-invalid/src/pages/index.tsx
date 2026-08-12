import { useState } from "@kudzujs/core"

function Leaf({ onChange }: { onChange: (value: string) => void }) {
  return <input onInput={event => onChange(event.currentTarget.value)} />
}

function Middle({ onChange }: { onChange: (value: string) => void }) {
  return <Leaf onChange={onChange} />
}

function Outer({ onChange }: { onChange: (value: string) => void }) {
  return <Middle onChange={onChange} />
}

export default function Page() {
  const [value, setValue] = useState("")
  return <main><p>{value}</p><Outer onChange={setValue} /></main>
}
