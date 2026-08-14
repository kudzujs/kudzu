import { useEffect } from "@kudzujs/core"
import ts from "typescript"

export default function Page() {
  useEffect(() => {
    document.body.dataset.effectPackage = `setup:${ts.version}`
    return () => { document.body.dataset.effectPackage = `cleanup:${ts.version}` }
  }, [])
  return <main>Effect package</main>
}
