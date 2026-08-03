type ButtonRef = { readonly current: HTMLButtonElement | null }

export function ImportedButton({ onPress, buttonRef }: { onPress: () => void; buttonRef: ButtonRef }) {
  return <button id="imported-button" ref={buttonRef} onClick={onPress}>Imported</button>
}
