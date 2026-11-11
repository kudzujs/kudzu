import { useEffect, useState } from "@kudzujs/core"

function Connection() {
  const [role, setRole] = useState("connecting")
  useEffect(() => {
    if (typeof SharedWorker === "undefined") {
      setRole("unsupported")
      return
    }
    const worker = new SharedWorker("/coordinator.js", { name: "kudzu-coordination-test" })
    const port = worker.port
    const receive = (event: MessageEvent) => { setRole(event.data.role) }
    port.addEventListener("message", receive)
    port.start()
    port.postMessage({ type: "init" })
    return () => {
      port.postMessage({ type: "tab-closing" })
      port.removeEventListener("message", receive)
      port.close()
    }
  }, [])
  return <output data-role>{role}</output>
}

export default function Page() {
  const [visible, setVisible] = useState(true)
  return <main>
    <button data-toggle onClick={() => setVisible(!visible)}>Toggle connection</button>
    {visible && <Connection />}
  </main>
}
