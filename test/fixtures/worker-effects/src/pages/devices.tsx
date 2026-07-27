import { useState } from "@kudzujs/core"
import { Shell } from "../Shell"

export const layout = Shell

export default function Devices() {
  const devices = [
    { id: "oak", name: "Oak sensor", status: "online" },
    { id: "pine", name: "Pine meter", status: "offline" },
    { id: "elm", name: "Elm gateway", status: "online" },
  ]
  const [visibleDevices, setVisibleDevices] = useState(devices)

  return <main data-route="devices">
    <h1>Devices</h1>
    <div aria-label="Filter devices">
      <button data-filter="all" onClick={() => setVisibleDevices(devices)}>All</button>
      <button data-filter="online" onClick={() => setVisibleDevices(devices.filter(device => device.status === "online"))}>Online</button>
      <button data-filter="offline" onClick={() => setVisibleDevices(devices.filter(device => device.status === "offline"))}>Offline</button>
      <button data-filter="missing" onClick={() => setVisibleDevices([])}>No matches</button>
    </div>
    <ul data-device-list>
      {visibleDevices.map(device => <li key={device.id} data-device={device.id} data-status={device.status}>
        <a href={`/dash/devices/${device.id}`}>{device.name}</a>
        <span>{device.status}</span>
      </li>)}
    </ul>
    {visibleDevices.length === 0 ? <p data-device-empty role="status">No devices match.</p> : null}
  </main>
}
