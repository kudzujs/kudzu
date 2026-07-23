import { useEffect, useState } from "@kudzujs/core"

export default function EffectOnlyPage() {
  const [value, setValue] = useState("before")
  useEffect(() => {
    setValue("after")
  }, [])
  return <p data-only>{value}</p>
}
