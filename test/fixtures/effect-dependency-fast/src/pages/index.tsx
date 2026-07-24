import { useEffect, useState } from "@kudzujs/core"

export default function Page() {
  const [event, setEvent] = useState("resize")
  useEffect(() => {
    document.body.dataset.fastLog = `${document.body.dataset.fastLog ?? ""}|setup ${event}`
    return async () => {
      await Promise.resolve()
      document.body.dataset.fastLog += `|cleanup ${event}`
    }
  }, [event])
  return <main><button onClick={() => setEvent("resize")}>Resize</button><button onClick={() => setEvent("scroll")}>Scroll</button></main>
}
