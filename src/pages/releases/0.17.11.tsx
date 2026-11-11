import { ReleaseNotes } from "../../components/ReleaseNotes"

export const metadata = {
  title: "Kudzu 0.17.11 - Shared Context Hook Aliases",
  description: "Rename Context hook state, setters and actions while preserving shared Provider identity.",
  url: "https://kudzujs.cloud/releases/0.17.11"
}

export default function ReleasePage() {
  return <ReleaseNotes version="0.17.11" title="Shared Context hook aliases">
    <h2>Local names, shared state</h2>
    <p>Supported relative Context hooks now accept identifier aliases for state, setters and actions. Repeated consumers retain the same Provider state even when each consumer chooses different names.</p>
    <h2>Collision-free action bindings</h2>
    <p>Action-only selections receive private state and setter bindings. Selected aliases, consumer locals and callback-local names keep their meaning, including names that resemble generated bindings.</p>
    <h2>Existing capabilities</h2>
    <p>Five compiler lines change without a new pass, semantic primitive or browser runtime. Chrome verifies CRUD, direct setters and shared consumers; static siblings remain JavaScript-free. Defaults, rest, computed keys, duplicate selections, setters selected without their state, and private-timer aliases remain unsupported. Generator 0.1.172 targets core ^0.17.11. No speed improvement is claimed.</p>
  </ReleaseNotes>
}
