import { useRef } from "react"
import { DialogContent } from "../DialogContent"

export default function Page() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  return <main>
    <button id="dialog-trigger" ref={triggerRef} onClick={() => dialogRef.current?.showModal()}>Open settings</button>
    <DialogContent ref={dialogRef} aria-labelledby="dialog-title" aria-describedby="dialog-description" onCancel={event => {
      event.preventDefault()
      dialogRef.current?.close()
      triggerRef.current?.focus()
    }}>
      <h1 id="dialog-title">Edit profile</h1>
      <p id="dialog-description">Update your public profile.</p>
      <button id="dialog-confirm" onClick={() => {
        document.body.dataset.dialogAction = "confirmed"
        dialogRef.current?.close("confirmed")
        triggerRef.current?.focus()
      }}>Save changes</button>
      <button id="dialog-close" onClick={() => {
        dialogRef.current?.close()
        triggerRef.current?.focus()
      }}>Cancel</button>
    </DialogContent>
  </main>
}
