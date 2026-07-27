import { useParams } from "@kudzujs/core"
import { Shell } from "../../Shell"

export const layout = Shell
export const runtimeParams = true

export default function GenericItem() {
  const { section, id } = useParams<{ section: string, id: string }>()
  return <main data-route="generic-item"><h1>{section}: {id}</h1></main>
}
