import { useCounter } from "../hooks/useCounter"

export default function Page() {
  const { count: value, setCount } = useCounter()
  return <button onClick={() => setCount(value + 1)}>{value}</button>
}
