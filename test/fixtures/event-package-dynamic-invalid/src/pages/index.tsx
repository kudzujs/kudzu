export default function Page() {
  return <button onClick={async () => { await import(`typescript`) }}>Invalid</button>
}
