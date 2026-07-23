import { useEffect, useState } from "@kudzujs/core"

export default function Page() {
  const [event, setEvent] = useState("resize")

  useEffect(() => {
    const resource = "local"
    const mountedEvent = () => String(event)
    const holder = { get event() { return String(event) } }
    const formatter = { format(event: string) { return event } }
    document.body.dataset.mountedResource = resource
    setEvent("scroll")
    return () => {
      const count = Number(document.body.dataset.cleanupCount ?? 0) + 1
      document.body.dataset.cleanup = `${resource}:${count}`
      document.body.dataset.cleanupCount = String(count)
      document.body.dataset.cleanupEvent = mountedEvent()
      document.body.dataset.cleanupAccessor = holder.event
      document.body.dataset.cleanupMethod = formatter.format("method")
    }
  }, [])

  useEffect(() => {
    return () => {
      throw new Error("isolated cleanup failure")
    }
  }, [])

  useEffect(() => {
    return async () => {
      document.body.dataset.laterCleanup = "ran"
      throw new Error("isolated async cleanup failure")
    }
  }, [])

  return <p>Cleanup</p>
}
