import { downsample } from "./telemetry/downsample"
import { RingBuffer } from "./telemetry/ring"

const batchSize = 10
const ring = new RingBuffer(128)
let generated = 0
let lastFrame = 0
const started = performance.now()

function ingestBatch() {
  for (let index = 0; index < batchSize; index++) ring.push(generated++)
}

function postFrame() {
  ;(globalThis as any).postMessage({
    batchSize,
    buffered: ring.size,
    generated,
    elapsed: performance.now() - started,
    points: downsample(ring.snapshot(), 24)
  })
}

for (let batch = 0; batch < 13; batch++) ingestBatch()
postFrame()

setInterval(() => {
  const now = performance.now()
  const target = 130 + Math.floor(now - started)
  while (generated + batchSize <= target) ingestBatch()
  if (now - lastFrame < 50) return
  lastFrame = now
  postFrame()
}, 10)
