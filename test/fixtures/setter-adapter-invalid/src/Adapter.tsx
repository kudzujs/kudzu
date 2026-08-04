export function Adapter({ onValueChange }: { onValueChange: (value: string) => void }) {
  return <div>
    <button onClick={() => onValueChange("first")}>First</button>
    <button onClick={() => onValueChange("second")}>Second</button>
  </div>
}
