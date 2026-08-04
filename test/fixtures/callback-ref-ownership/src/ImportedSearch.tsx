export function ImportedSearch({ onValueChange }: { onValueChange: (value: string) => void }) {
  return <input id="imported-search" onInput={event => onValueChange(event.currentTarget.value)} />
}
