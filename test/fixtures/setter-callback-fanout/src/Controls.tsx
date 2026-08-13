function FirstControl({ onValueChange }: { onValueChange: (value: string) => void }) {
  return <button id="first" onClick={() => onValueChange("first")}>First</button>
}

function SecondControl({ onValueChange }: { onValueChange: (value: string) => void }) {
  return <button id="second" onClick={() => onValueChange("second")}>Second</button>
}

export function Controls({ onValueChange }: { onValueChange: (value: string) => void }) {
  return <div>
    <FirstControl onValueChange={onValueChange} />
    <SecondControl onValueChange={onValueChange} />
  </div>
}
