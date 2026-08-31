import { LazyEditor } from "../LazyEditor"
import { Shell } from "../Shell"

export const layout = Shell

export default function Page() {
  return <main data-shared-lazy-page="first">
    <LazyEditor label="First editor" />
  </main>
}
