import { useEffect } from "@kudzujs/core"

export default function Page() {
  // @ts-expect-error intentional unsupported cleanup fixture
  useEffect(() => () => console.log("cleanup"), [])
  return <p>Cleanup</p>
}
