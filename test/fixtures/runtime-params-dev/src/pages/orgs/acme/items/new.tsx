import { useState } from "@kudzujs/core"

export default function Page() {
  const [label] = useState("New item")
  return <h1 data-static-new>{label}</h1>
}
