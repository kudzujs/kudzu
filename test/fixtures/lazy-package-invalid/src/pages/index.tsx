import { useEffect } from "@kudzujs/core"

export default function Page() {
  useEffect(() => {
    import("@codemirror/view").then(() => {})
  }, [])
  return <main>Invalid eager effect</main>
}
