import { ImportedButton } from "./ImportedButton"

type ButtonRef = { readonly current: HTMLButtonElement | null }

export function ImportedControls({ onPress, buttonRef }: { onPress: () => void; buttonRef: ButtonRef }) {
  return <ImportedButton onPress={onPress} buttonRef={buttonRef} />
}
