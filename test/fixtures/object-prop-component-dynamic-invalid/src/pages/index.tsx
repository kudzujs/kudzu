import { useState } from "react"
import { DynamicView } from "../DynamicView"

export default function Page() {
  const [conversation, setConversation] = useState({ messages: [{ id: "message-1", content: "Hello" }] })
  return <DynamicView conversation={conversation} field="messages" />
}
