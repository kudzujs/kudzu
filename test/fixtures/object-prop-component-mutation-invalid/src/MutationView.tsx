export function MutationView({ conversation }: { conversation: { messages: Array<{ id: string; content: string }> } }) {
  return <section>
    <button onClick={() => conversation.messages.push({ id: "message-2", content: "Welcome" })}>Mutate</button>
    <ul>{conversation.messages.map(message => <li key={message.id}>{message.content}</li>)}</ul>
  </section>
}
