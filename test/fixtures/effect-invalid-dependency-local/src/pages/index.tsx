import { useEffect } from "@kudzujs/core"

export default function Page() {
  const label = "static"
  useEffect(() => {
    console.log(label)
  }, [label])
  return <p>Static dependency</p>
}
