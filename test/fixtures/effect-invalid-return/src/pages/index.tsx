import { useEffect } from "@kudzujs/core"

export default function Page() {
  const cleanup = () => console.log("cleanup")
  // @ts-expect-error intentional unsupported return fixture
  useEffect(() => {
    return cleanup
  }, [])
  return <p>Return</p>
}
