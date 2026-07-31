import { useCallback } from "react"

export default function Page() {
  const callback = useCallback(() => {}, [Date.now()])
  return <button onClick={callback}>Invalid</button>
}
