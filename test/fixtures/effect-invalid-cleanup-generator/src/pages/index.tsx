import { useEffect } from "@kudzujs/core"

export default function Page() {
  // @ts-expect-error generator cleanups are unsupported
  useEffect(() => {
    return function* () {
      yield "cleanup"
    }
  }, [])
  return <p>Cleanup generator</p>
}
