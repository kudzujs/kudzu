import { useCounter } from "../hooks/useCounter"

export default function Page() {
  const { count: value = 0, setCount } = useCounter()
  return <button onClick={() => setCount(value + 1)}>{value}</button>
}
