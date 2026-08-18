import { createRef, useState } from "react"
import useOutsideClickAlerter from "../useOutsideClickAlerter"

export default function Page() {
  const ref = createRef<HTMLDivElement>()
  const [open, setOpen] = useState(true)
  useOutsideClickAlerter(ref, () => setOpen(false))
  return <div ref={ref}>{open ? "Open" : "Closed"}</div>
}
