import { useEffect } from "@kudzujs/core"

export default function Page() {
  useEffect(() => {
    return (event?: Event) => console.log(event)
  }, [])
  return <p>Cleanup parameter</p>
}
