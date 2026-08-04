import { useId, useState } from "react"

export default function ImportedTooltip({ content }: { content: string }) {
  const [visible, setVisible] = useState(false)
  const id = useId()
  return <span>
    <button id="tooltip-trigger" aria-describedby={id} onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>Help</button>
    <span id={id} role="tooltip" data-visible={visible}>{content}</span>
  </span>
}
