import { useEffect } from "react"

export function AliasView({ conversation }: { conversation: { label: string; messages: Array<{ id: string; content: string }> } }) {
  const label = conversation.label
  useEffect(() => {}, [conversation.messages])
  return <section><h2>{label}</h2><ul>{conversation.messages.map(message => <li key={message.id}>{message.content}</li>)}</ul></section>
}
