import { useState } from "@kudzujs/core"

export default function InvalidConditionalPage() {
  const [open, setOpen] = useState(false)
  if (open) {
    console.log("opening")
    return <strong>Open</strong>
  }
  return <em>Closed</em>
}
