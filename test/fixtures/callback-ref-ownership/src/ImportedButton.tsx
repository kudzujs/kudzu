import { useEffect, useId, useRef, useState } from "@kudzujs/core"

type ButtonRef = { readonly current: HTMLButtonElement | null }

export function ImportedButton({ onPress, buttonRef }: { onPress: () => void; buttonRef: ButtonRef }) {
  const [pressed, setPressed] = useState(false)
  const generatedId = useId()
  const innerRef = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    document.body.dataset.importedEffects = (document.body.dataset.importedEffects ?? "") + `|setup:${pressed}:${innerRef.current?.id}`
    return () => { document.body.dataset.importedEffects += `|cleanup:${pressed}:${innerRef.current?.id}` }
  }, [pressed])
  return <button id="imported-button" ref={buttonRef} data-generated-id={generatedId} onClick={() => {
    setPressed(!pressed)
    onPress()
  }}>Imported {pressed ? "on" : "off"}<span id="imported-inner" ref={innerRef} /></button>
}
