export default function Page() {
  return <button onClick={async () => { await import("../helper") }}>Invalid graph</button>
}
