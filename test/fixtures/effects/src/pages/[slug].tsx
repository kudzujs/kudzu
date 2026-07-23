import { useEffect, useState } from "@kudzujs/core"

export function getStaticPaths() {
  return [{ params: { slug: "oak" }, props: { label: "dynamic" } }]
}

export default function DynamicEffectPage({ label }: { label: string }) {
  const [value, setValue] = useState("before")
  useEffect(() => {
    setValue(label)
  }, [])
  return <p data-dynamic>{value}</p>
}
