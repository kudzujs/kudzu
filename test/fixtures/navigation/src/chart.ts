export function startTelemetry() {
  const stream = new EventTarget()
  ;(globalThis as any).navigationTelemetry = stream
  document.body.dataset.streamSetups = String(Number(document.body.dataset.streamSetups ?? 0) + 1)
  let sample = 0
  const timer = setInterval(() => {
    document.body.dataset.streamSamples = String(++sample)
    stream.dispatchEvent(new CustomEvent("sample", { detail: sample }))
  }, 10)
  return () => clearInterval(timer)
}

export function mountChart(container: HTMLElement) {
  const stream = (globalThis as any).navigationTelemetry as EventTarget
  document.body.dataset.chartMounts = String(Number(document.body.dataset.chartMounts ?? 0) + 1)
  const update = (event: Event) => {
    const sample = String((event as CustomEvent<number>).detail)
    container.dataset.sample = sample
    document.body.dataset.chartUpdates = String(Number(document.body.dataset.chartUpdates ?? 0) + 1)
  }
  stream.addEventListener("sample", update)
  return {
    dispose() {
      stream.removeEventListener("sample", update)
      document.body.dataset.chartDisposals = String(Number(document.body.dataset.chartDisposals ?? 0) + 1)
      document.body.dataset.probeDisposal = `${document.body.dataset.probeDisposal ?? ""}|route`
    }
  }
}
