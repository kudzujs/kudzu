import { useFlash } from "../hooks/useFlash"

export default function Page() {
  const { active, setActive, flash } = useFlash()
  return <button onClick={flash} onBlur={() => setActive(false)}>{active ? "Active" : "Ready"}</button>
}
