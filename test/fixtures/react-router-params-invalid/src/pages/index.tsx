import { useParams } from "react-router-dom"

export const runtimeParams = true

export default function Page() {
  const readParams = useParams
  return <main>{String(readParams)}</main>
}
