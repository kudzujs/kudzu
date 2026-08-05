export type Point = { id: string; x: number; y: number; label: string }

export function calculate(phase: number) {
  return {
    total: 10 + phase,
    points: phase === 0
      ? [{ id: "a", x: 10, y: 20, label: "Alpha" }, { id: "b", x: 30, y: 20, label: "Beta" }]
      : phase === 1
        ? [{ id: "a", x: 15, y: 25, label: "Alpha moved" }, { id: "c", x: 50, y: 25, label: "Gamma" }, { id: "b", x: 35, y: 25, label: "Beta moved" }]
        : phase === 2
          ? [{ id: "c", x: 55, y: 30, label: "Gamma moved" }, { id: "a", x: 20, y: 30, label: "Alpha reordered" }]
          : [{ id: "a", x: 25, y: 35, label: "Alpha final" }]
  }
}
