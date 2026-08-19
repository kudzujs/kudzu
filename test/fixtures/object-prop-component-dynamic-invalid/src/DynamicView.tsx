import { useEffect } from "react"

export function DynamicView({ conversation, field }: { conversation: { messages: Array<{ id: string; content: string }> }; field: "messages" }) {
  useEffect(() => {}, [conversation[field]])
  return <ul>{conversation.messages.map(message => <li key={message.id}>{message.content}</li>)}</ul>
}
