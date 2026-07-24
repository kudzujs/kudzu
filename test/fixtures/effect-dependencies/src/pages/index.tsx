import { useEffect, useState } from "@kudzujs/core"

export default function Page() {
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [seed] = useState("dependency-only")
  const countAlias = count

  useEffect(() => {
    const value = `${count}:${page}`
    document.body.dataset.effectLog = `${document.body.dataset.effectLog ?? ""}|setup ${value}`
    return () => {
      document.body.dataset.effectLog += `|cleanup ${value}`
    }
  }, [count, page])

  useEffect(() => {
    document.body.dataset.effectLog += `|second setup ${countAlias}`
    return async () => {
      await Promise.resolve()
      document.body.dataset.effectLog += `|second cleanup ${countAlias}`
    }
  }, [countAlias])

  return <main data-runtime-link="/assets/kudzu.js">
    <p>{count}:{page}</p>
    <button onClick={() => { setCount(count + 1); setPage(page + 1) }}>Next</button>
  </main>
}
