import { useStore } from "../store"

export default function Page() {
  const count = useStore(state => state.count)
  return <p>{count}</p>
}
