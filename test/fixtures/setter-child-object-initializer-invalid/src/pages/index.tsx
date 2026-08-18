import { useState } from "@kudzujs/core"
import { ObjectInput } from "../ObjectInput"

export default function Page() {
  const [value, setValue] = useState({ text: "initial" })
  return <main>
    <span id="parent">{value.text}</span>
    <ObjectInput value={value} onValueChange={setValue} />
  </main>
}
