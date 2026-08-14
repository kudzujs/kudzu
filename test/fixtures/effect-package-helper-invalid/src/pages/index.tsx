import { useEffect } from "@kudzujs/core"
import ts from "typescript"

const version = () => ts.version

export default function Page() {
  useEffect(() => {
    document.body.dataset.effectPackage = version()
  }, [])
  return <main>Indirect package effect</main>
}
