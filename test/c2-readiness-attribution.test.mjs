import assert from "node:assert/strict"
import test from "node:test"
import { analyze, partition } from "./c2-readiness-attribution.mjs"

test("readiness attribution clips and partitions nested and crossing spans without double counting", () => {
  const result = partition([
    { name: "v8.evaluateModule", ts: -5, dur: 20 },
    { name: "FunctionCall", ts: 2, dur: 6 },
    { name: "Layout", ts: 4, dur: 2 },
    { name: "ParseHTML", ts: 12, dur: 5 },
    { name: "unclassified", ts: 18, dur: 5 }
  ], 0, 20)
  assert.deepEqual(result.totalsMicroseconds, { "v8.evaluateModule": 6, FunctionCall: 4, Layout: 2, ParseHTML: 5, uncovered: 1, otherRecorded: 2 })
  assert.equal(result.segments[0].startMicroseconds, 0)
  assert.equal(result.segments.at(-1).endMicroseconds, 20)
  assert.throws(() => partition([{ ts: 1, dur: -1 }], 0, 20))
})

test("readiness attribution keeps duplicate marks and rejects a different navigation or mismatched result", () => {
  const mark = (name, ts) => ({ name, ts, pid: 1, tid: 2, args: { data: { navigationId: "page", startTime: ts / 1000 } } })
  const events = [mark("c2-initial-start", 1000), mark("c2-initial-ready", 5000), mark("c2-initial-ready", 6000),
    { name: "Layout", ph: "X", ts: 1000, dur: 5000, pid: 9, tid: 9 }]
  const result = analyze(events, 6)
  assert.deepEqual(result.readyMarksMilliseconds, [4, 5])
  assert.deepEqual(result.totalsMicroseconds, { uncovered: 5000 })
  assert.throws(() => analyze(events, 4))
  events.at(-2).args.data.navigationId = "other"
  assert.throws(() => analyze(events, 6))
})
