import { useEffect } from "react"

export type Conversation = {
  id: string
  label: string
  messages: Array<{ id: string; content: string }>
  updatedAt: number
}

export function ConversationView({ conversation, instance }: { conversation: Conversation; instance: string }) {
  useEffect(() => {
    document.body.dataset.messageRuns = String(Number(document.body.dataset.messageRuns ?? "0") + 1)
    return () => {
      document.body.dataset.messageCleanups = String(Number(document.body.dataset.messageCleanups ?? "0") + 1)
    }
  }, [conversation.messages])

  return <section data-instance={instance} data-label={conversation.label}>
    <h2>{conversation.label}</h2>
    <ul>
      {conversation.messages.map(message => <li key={message.id} data-message={message.id}>{message.content}</li>)}
    </ul>
  </section>
}
