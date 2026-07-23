import { useEffect } from "@kudzujs/core"

export default function Page() {
  // @ts-expect-error generator effects are unsupported
  useEffect(function* () {
    yield "mount"
  }, [])
  return <p>Generator</p>
}
