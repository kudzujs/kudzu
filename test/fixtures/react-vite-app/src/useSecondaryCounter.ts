import { useCallback, useState } from "react"

export function useSecondaryCounter() {
  const [secondary, setSecondary] = useState(10)
  const increment = useCallback(() => setSecondary(secondary + 2), [secondary])
  return { secondary, setSecondary, increment }
}
