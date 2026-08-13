import { CounterProvider, useCounter } from "../context"

function Counter() {
  const { increment } = useCounter()
  return <button onClick={() => increment()}>Increment</button>
}

export default function Page() {
  return <CounterProvider><Counter /></CounterProvider>
}
