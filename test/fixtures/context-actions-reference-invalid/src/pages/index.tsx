import { CounterProvider, useCounter } from "../context"

function Counter() {
  const { increment } = useCounter()
  return <button onClick={() => {
    const run = increment
    run()
  }}>Increment</button>
}

export default function Page() {
  return <CounterProvider><Counter /></CounterProvider>
}
