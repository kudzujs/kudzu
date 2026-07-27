export class RingBuffer {
  readonly capacity: number
  private readonly values: number[]
  private cursor = 0
  private length = 0

  constructor(capacity: number) {
    this.capacity = capacity
    this.values = new Array(capacity)
  }

  push(value: number) {
    this.values[this.cursor] = value
    this.cursor = (this.cursor + 1) % this.capacity
    this.length = Math.min(this.length + 1, this.capacity)
  }

  snapshot() {
    const start = (this.cursor - this.length + this.capacity) % this.capacity
    return Array.from({ length: this.length }, (_, index) => this.values[(start + index) % this.capacity])
  }

  get size() {
    return this.length
  }
}
