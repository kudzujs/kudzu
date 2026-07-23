import { useEffect, useState } from "@kudzujs/core"

export default function EffectPage() {
  const [value, setValue] = useState("before")
  useEffect(() => {
    setValue("after")
  }, [])
  return <p>{value}</p>
}
