import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const categories = new Set(["ParseHTML", "EvaluateScript", "v8.evaluateModule", "v8.compileModule", "FunctionCall", "UpdateLayoutTree", "Layout", "PrePaint", "Paint", "Layerize", "MinorGC", "MajorGC"])

// Attribute overlaps to the innermost selected span, not to multiple CPU buckets.
export function partition(events, start, end) {
  assert.ok(Number.isFinite(start) && Number.isFinite(end) && end > start)
  const boundaries = new Map([[start, []], [end, []]])
  for (const event of events) {
    assert.ok(Number.isFinite(event.ts) && Number.isFinite(event.dur) && event.dur >= 0)
    const left = Math.max(start, event.ts), right = Math.min(end, event.ts + event.dur)
    if (right <= left) continue
    for (const [time, add] of [[left, true], [right, false]]) {
      if (!boundaries.has(time)) boundaries.set(time, [])
      boundaries.get(time).push({ event, add })
    }
  }
  const active = new Set(), segments = [], totals = {}
  let previous = start
  for (const [time, changes] of [...boundaries].sort(([a], [b]) => a - b)) {
    if (time > previous) {
      const selected = [...active].filter(event => categories.has(event.name)).sort((a, b) => a.dur - b.dur || b.ts - a.ts || a.name.localeCompare(b.name))[0]
      const category = selected?.name ?? (active.size ? "otherRecorded" : "uncovered")
      totals[category] = (totals[category] ?? 0) + time - previous
      const last = segments.at(-1)
      if (last?.category === category) last.endMicroseconds = time - start
      else segments.push({ startMicroseconds: previous - start, endMicroseconds: time - start, category })
    }
    for (const { event, add } of changes) {
      if (add) active.add(event)
      else active.delete(event)
    }
    previous = time
  }
  assert.equal(Object.values(totals).reduce((sum, value) => sum + value, 0), end - start)
  return { totalsMicroseconds: totals, segments }
}

export function analyze(traceEvents, readiness) {
  const starts = traceEvents.filter(event => event.name === "c2-initial-start")
  assert.equal(starts.length, 1)
  const start = starts[0]
  const marks = traceEvents.filter(event => event.name === "c2-initial-ready").sort((a, b) => a.ts - b.ts)
  assert.ok(marks.length)
  for (const mark of marks) {
    assert.equal(mark.pid, start.pid)
    assert.equal(mark.tid, start.tid)
    assert.ok(start.args.data.navigationId)
    assert.equal(mark.args.data.navigationId, start.args.data.navigationId)
  }
  const end = marks.at(-1)
  assert.ok(Math.abs(end.args.data.startTime - readiness) < 1, "final mark must match the stored harness result")
  assert.ok(Math.abs((end.ts - start.ts) / 1000 - (end.args.data.startTime - start.args.data.startTime)) < 1)
  const main = traceEvents.filter(event => event.pid === start.pid && event.tid === start.tid)
  const durations = main.filter(event => event.ph === "X")
  const accounting = partition(durations, start.ts, end.ts)
  const spans = durations.filter(event => event.ts < end.ts && event.ts + event.dur > start.ts)
  const describe = event => ({
    name: event.name,
    startMilliseconds: (Math.max(start.ts, event.ts) - start.ts) / 1000,
    endMilliseconds: (Math.min(end.ts, event.ts + event.dur) - start.ts) / 1000,
    url: event.args?.data?.url ?? event.args?.fileName ?? null,
    functionName: event.args?.data?.functionName ?? null
  })
  const readyCalls = spans.filter(event => event.name === "FunctionCall" && event.args?.data?.functionName === "ready" && event.args.data.url === "")
  const layoutsInReady = spans.filter(event => ["Layout", "UpdateLayoutTree"].includes(event.name) && readyCalls.some(call => event.ts >= call.ts && event.ts + event.dur <= call.ts + call.dur))
  return {
    rendererPid: start.pid, rendererTid: start.tid, navigationId: start.args.data.navigationId,
    beforeStartMarkMilliseconds: start.args.data.startTime,
    initialDomReadyMilliseconds: readiness,
    intervalMilliseconds: (end.ts - start.ts) / 1000,
    readyMarksMilliseconds: marks.map(mark => (mark.ts - start.ts) / 1000),
    ...accounting,
    milestones: main.filter(event => ["domInteractive", "domContentLoadedEventStart", "domContentLoadedEventEnd"].includes(event.name) && event.ts >= start.ts && event.ts <= end.ts).map(event => ({ name: event.name, milliseconds: (event.ts - start.ts) / 1000 })),
    modules: spans.filter(event => ["v8.evaluateModule", "v8.compileModule"].includes(event.name)).map(describe),
    readyCallbacks: readyCalls.map(describe),
    layoutsInsideReadyCallbacks: layoutsInReady.map(describe)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  assert.equal(process.argv.length, 4, "usage: node test/c2-readiness-attribution.mjs TRACE_DIRECTORY OUTPUT_JSON")
  const [directory, output] = process.argv.slice(2)
  const raw = await readFile(join(directory, "raw.json"))
  const report = JSON.parse(raw)
  const digest = bytes => createHash("sha256").update(bytes).digest("hex")
  const profiles = []
  for (const arm of ["baseline", "candidate"]) for (let profile = 0; profile < 3; profile++) {
    const file = `${arm}-${profile}.trace.json`
    const bytes = await readFile(join(directory, file))
    profiles.push({ arm, profile, file, sha256: digest(bytes), ...analyze(JSON.parse(bytes).traceEvents, report.targets[arm].browser.rawProfiles[profile].initialDomReadyMilliseconds) })
  }
  await writeFile(output, JSON.stringify({
    sourceReportSha256: digest(raw),
    method: "One renderer thread, start mark to final same-navigation readiness mark. Innermost selected duration span wins each overlap; remaining recorded spans and uncovered intervals are separate. Exact per-profile wall-clock conservation in microseconds.",
    limits: "Traced diagnostic profiles are not the 21-profile speed gate. Duration spans are wall time, not CPU time. Uncovered intervals are not proof of idle or network waits. Before-start time is outside the partition. Missing module URLs cannot be inferred from adjacent compile events. Category medians must not be added.",
    profiles
  }, null, 2) + "\n")
}
