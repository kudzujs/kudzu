import { useEffect, useRef, useState } from "@kudzujs/core"

export default function InvalidEditor() {
  const editor = useRef<any>(null)
  const [value] = useState("Alpha")

  useEffect(() => {
    editor.current = { value }
    return () => { editor.current = null }
  }, [])

  useEffect(() => {
    editor.current ||= { value }
  }, [value])

  return <main>Invalid editor</main>
}
