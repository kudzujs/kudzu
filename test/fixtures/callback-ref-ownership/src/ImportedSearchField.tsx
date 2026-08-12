import { ImportedSearch } from "./ImportedSearch"

export function ImportedSearchField({ onValueChange }: { onValueChange: (value: string) => void }) {
  return <ImportedSearch onValueChange={onValueChange} />
}
