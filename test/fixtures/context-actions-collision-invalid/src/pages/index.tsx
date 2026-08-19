import { CounterProvider, useCounter } from "../context"

function Counter() {
  const { increment, toggle, ping } = useCounter()
  const setCount = "consumer binding"
  function Shadow() {
    const toggle = () => console.log("shadow")
    return <button onClick={toggle}>Shadow</button>
  }
  return <><button aria-label={setCount} onClick={increment}>Increment</button><button onClick={toggle}>Toggle</button><button onClick={() => ping()}>Ping</button><Shadow /></>
}

export default function Page() {
  return <CounterProvider><Counter /></CounterProvider>
}
