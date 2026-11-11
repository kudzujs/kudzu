const ports = new Set()
const announce = () => {
  let leader = true
  for (const port of ports) {
    port.postMessage({ role: leader ? "LEADER" : "FOLLOWER" })
    leader = false
  }
}
onconnect = event => {
  const port = event.ports[0]
  port.onmessage = event => {
    if (event.data.type === "init") ports.add(port)
    if (event.data.type === "tab-closing") {
      ports.delete(port)
      port.close()
    }
    announce()
  }
}
