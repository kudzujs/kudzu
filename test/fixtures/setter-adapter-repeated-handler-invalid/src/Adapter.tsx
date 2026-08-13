export function Adapter({ onValueChange }: { onValueChange: (value: string) => void }) {
  return <button onClick={() => {
    onValueChange("first")
    onValueChange("second")
  }}>Update</button>
}
