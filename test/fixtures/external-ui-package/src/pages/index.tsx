import { useEffect, useRef, useState } from "@kudzujs/core"
import Typed from "typed.js"

function TypedMessage({ message }: { message: string }) {
  const host = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const instance = new Typed(host.current, { strings: [message], typeSpeed: 0, showCursor: false })
    document.body.dataset.externalUiMounts = String(Number(document.body.dataset.externalUiMounts || "0") + 1)
    return () => {
      instance.destroy()
      document.body.dataset.externalUiDisposals = String(Number(document.body.dataset.externalUiDisposals || "0") + 1)
    }
  }, [message])

  return <span data-typed-message ref={host}></span>
}

export default function Page() {
  const [message, setMessage] = useState("Alpha")
  const [visible, setVisible] = useState(true)

  return <main>
    <button data-update-message onClick={() => setMessage("Beta")}>Update</button>
    <button data-toggle-message onClick={() => setVisible(!visible)}>Toggle</button>
    {visible && <TypedMessage message={message} />}
  </main>
}
