export function Adapter({ onValueChange }: { onValueChange: (value: string) => void }) {
  return <div>
    <button id="first" onClick={() => onValueChange("first")}>First</button>
    <button id="second" onClick={() => onValueChange("second")}>Second</button>
  </div>
}
