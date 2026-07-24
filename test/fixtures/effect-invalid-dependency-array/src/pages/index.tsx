import { useEffect, useState } from "@kudzujs/core"

export default function Page() {
  const [value] = useState(1)
  const dependencies = [value] as const
  useEffect(() => {
    console.log(value)
  }, dependencies)
  return <p>Dynamic dependency array</p>
}
