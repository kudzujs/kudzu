import { useEffect, useState } from "@kudzujs/core"

export default function Page() {
  const [value] = useState(1)
  // @ts-expect-error intentional unsupported dependency fixture
  useEffect(() => console.log(value), [value])
  return <p>{value}</p>
}
