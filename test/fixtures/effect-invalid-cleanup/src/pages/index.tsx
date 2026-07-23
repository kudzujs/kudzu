import { useEffect } from "@kudzujs/core"

export default function Page() {
  // @ts-expect-error async callbacks cannot resolve to cleanup functions
  useEffect(async () => {
    return () => console.log("cleanup")
  }, [])
  return <p>Cleanup</p>
}
