import { Shell } from "../Shell"

export const layout = Shell
export const metadata = { title: "Broken fallback" }

export default function Broken() {
  return <main data-route="broken"><h1>Broken fallback</h1></main>
}
