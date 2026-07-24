import { useEffect, useState } from "@kudzujs/core"

export default function Page() {
  const [value] = useState({ count: 1 })
  useEffect(() => {
    console.log(value.count)
  }, [
    // @ts-expect-error effect dependencies must be primitive
    value
  ])
  return <p>Object dependency</p>
}
