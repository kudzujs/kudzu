import { forwardRef } from "react"

type DialogContentProps = {
  "aria-describedby": string
  "aria-labelledby": string
  children?: unknown
  onCancel: (event: Event) => void
}

export const DialogContent = forwardRef<HTMLDialogElement, DialogContentProps>(({ children, ...dialogProps }, dialogRef) =>
  <dialog {...dialogProps} ref={dialogRef}>
    <div className="dialog-content">{children}</div>
  </dialog>
)
