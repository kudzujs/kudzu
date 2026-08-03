import { useEffect } from "@kudzujs/core"

export default function Page() {
  const setup = () => {
    console.log("setup")
  }
  const indirect = setup

  useEffect(indirect, [])
  return <p>Indirect effect</p>
}
