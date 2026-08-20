import { useState } from "react"
import { MutationView } from "../MutationView"

export default function Page() {
  const [conversation, setConversation] = useState({ messages: [{ id: "message-1", content: "Hello" }] })
  return <MutationView conversation={conversation} />
}
