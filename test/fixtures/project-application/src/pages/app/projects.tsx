import { useState } from "@kudzujs/core"

export default function ProjectsPage() {
  const [filter, setFilter] = useState("All projects")

  return <main>
    <h1>Projects</h1>
    <p>Workspace projects are the first greenfield application surface.</p>
    <button id="show-active" onClick={() => setFilter("Active projects")}>Show active</button>
    <output id="project-filter" aria-live="polite">{filter}</output>
  </main>
}
