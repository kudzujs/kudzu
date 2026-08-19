import { useState } from "react"
import { ConversationView } from "../ConversationView"

export default function ConversationPage() {
  const [conversation, setConversation] = useState({
    id: "conversation-1",
    label: "Inbox",
    messages: [{ id: "message-1", content: "Hello" }],
    updatedAt: 1,
  })
  const [showConditional, setShowConditional] = useState(true)

  return <main>
    <button id="rename" onClick={() => setConversation(current => ({ ...current, label: "Support", updatedAt: 2 }))}>Rename</button>
    <button id="add-message" onClick={() => setConversation(current => ({ ...current, messages: [...current.messages, { id: "message-2", content: "Welcome" }], updatedAt: 3 }))}>Add message</button>
    <button id="toggle" onClick={() => setShowConditional(!showConditional)}>Toggle</button>
    <ConversationView conversation={conversation} instance="first" />
    <ConversationView conversation={conversation} instance="second" />
    {showConditional && <ConversationView conversation={conversation} instance="conditional" />}
  </main>
}
