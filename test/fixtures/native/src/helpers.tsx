import { whole } from "./math"

export default function offset() {
  return 1
}

export function clamp(value: number, minimum: number) {
  return Math.max(whole(value), minimum)
}

export function bonus() {
  return 1
}
