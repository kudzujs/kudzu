import { useId } from "react"

export default function Page() {
  return <main id={useId()}>Invalid ID shape</main>
}
