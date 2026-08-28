import { useEffect, useRef, useState } from "@kudzujs/core"

export default function InvalidAttachedEditor() {
  const editor = useRef<any>(null)
  const [value] = useState("Alpha")

  useEffect(() => {
    editor.current = { value }
    return () => { editor.current = null }
  }, [])

  useEffect(() => {
    console.log(editor.current, value)
  }, [value])

  return <main ref={editor}>Invalid attached editor</main>
}
