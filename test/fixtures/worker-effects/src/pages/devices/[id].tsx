import { useEffect, useParams, useState } from "@kudzujs/core"
import { Shell } from "../../Shell"

export const layout = Shell
export const runtimeParams = true

export default function Device() {
  const { id } = useParams<{ id: string }>()
  const [name, setName] = useState("Unknown device")
  const [connection, setConnection] = useState("loading")
  const [command, setCommand] = useState("")
  const [revision, setRevision] = useState(0)
  const [pending, setPending] = useState(false)
  const [commandStatus, setCommandStatus] = useState("idle")
  const [commandError, setCommandError] = useState("")
  const [appliedCommand, setAppliedCommand] = useState("none")

  useEffect(() => {
    const stats = ((globalThis as any).deviceWorkflowStats ??= {
      requests: 0,
      commandStarts: 0,
      commandCleanups: 0,
      commandAborts: 0,
      completions: 0,
      failures: 0,
      timeouts: 0,
      stale: 0,
      timers: 0,
    })
    const isCommand = command !== ""
    const controller = new globalThis.AbortController()
    let active = true
    let settled = false
    let timedOut = false
    stats.requests++
    if (isCommand) stats.commandStarts++
    stats.timers++
    const timeoutMs = command === "timeout" ? 100 : 10_000
    let timer = globalThis.setTimeout(() => {
      if (settled) return
      timedOut = true
      stats.timeouts++
      controller.abort()
    }, timeoutMs)
    const clearTimer = () => {
      if (!timer) return
      globalThis.clearTimeout(timer)
      timer = 0
      stats.timers--
    }
    const url = isCommand
      ? `/dash/api/devices/${globalThis.encodeURIComponent(id)}/commands`
      : `/dash/api/devices/${globalThis.encodeURIComponent(id)}`
    const options = isCommand
      ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ command }), signal: controller.signal }
      : { signal: controller.signal }

    fetch(url, options)
      .then(response => {
        if (!response.ok) throw new Error(`Request failed (${response.status})`)
        return response.json()
      })
      .then((result: { name?: string, connection?: string, command?: string }) => {
        if (!active) {
          stats.stale++
          return
        }
        stats.completions++
        if (isCommand) {
          setAppliedCommand(result.command ?? command)
          setCommandStatus("success")
          setCommandError("")
          setPending(false)
        } else {
          setName(result.name ?? "Unknown device")
          setConnection(result.connection ?? "unknown")
        }
      })
      .catch(error => {
        if (!active) {
          stats.stale++
          return
        }
        stats.failures++
        if (isCommand) {
          setCommandStatus("error")
          setCommandError(timedOut ? "Command timed out" : error instanceof Error ? error.message : "Command failed")
          setPending(false)
        } else {
          setConnection(timedOut ? "timeout" : "error")
        }
      })
      .finally(() => {
        settled = true
        clearTimer()
      })

    return () => {
      active = false
      clearTimer()
      if (isCommand) stats.commandCleanups++
      if (!settled) {
        if (isCommand) stats.commandAborts++
        controller.abort()
      }
    }
  }, [id, command, revision])

  return <main data-route="device" data-device-id={id} data-command-status={commandStatus} data-applied-command={appliedCommand}>
    <a href="/dash/devices">Back to devices</a>
    <h1>{name}</h1>
    <p>Device <strong data-device-id>{id}</strong></p>
    <p>Connection: <span data-connection>{connection}</span></p>
    <div aria-label="Device commands">
      <button data-command="reboot" onClick={() => {
        setCommand("reboot")
        setRevision(value => value + 1)
        setPending(true)
        setCommandStatus("sending")
        setCommandError("")
      }}>Reboot</button>
      <button data-command="refresh" onClick={() => {
        setCommand("refresh")
        setRevision(value => value + 1)
        setPending(true)
        setCommandStatus("sending")
        setCommandError("")
      }}>Refresh</button>
      <button data-command="reject" onClick={() => {
        setCommand("reject")
        setRevision(value => value + 1)
        setPending(true)
        setCommandStatus("sending")
        setCommandError("")
      }}>Reject</button>
      <button data-command="timeout" onClick={() => {
        setCommand("timeout")
        setRevision(value => value + 1)
        setPending(true)
        setCommandStatus("sending")
        setCommandError("")
      }}>Timeout</button>
    </div>
    <p data-command-pending aria-live="polite">{pending ? "Command pending" : "Command idle"}</p>
    <p data-command-result>Applied: {appliedCommand}</p>
    {commandError ? <p data-command-error role="alert">{commandError}</p> : null}
  </main>
}
