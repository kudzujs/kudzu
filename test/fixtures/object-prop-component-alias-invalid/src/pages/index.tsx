import { useState } from "react"
import { AliasView } from "../AliasView"

export default function Page() {
  const [conversation, setConversation] = useState({ label: "Inbox", messages: [{ id: "message-1", content: "Hello" }] })
  return <AliasView conversation={conversation} />
}
