import { useEffect } from "@kudzujs/core"

export default function Page() {
  useEffect(function retry() {
    retry()
  }, [])
  return <p>Named</p>
}
