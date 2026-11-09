import { useEffect, useState } from "@kudzujs/core"

export default function ArrayEffectDependency() {
  const [items] = useState([{ id: 1, label: "First" }])
  useEffect(() => { console.log(items.length) }, [items])
  return <p>Array dependency</p>
}
