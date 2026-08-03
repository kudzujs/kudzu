import { useEffect, useState } from "@kudzujs/core"

export default function Page() {
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [seed] = useState("dependency-only")
  const countAlias = count
  const parity = count % 2 === 0 ? "even" : "odd"
  const namedCleanup = () => {
    document.body.dataset.effectLog += `|named cleanup ${count}`
  }
  const namedSetup = () => {
    document.body.dataset.effectLog += `|named setup ${count}`
    return namedCleanup
  }

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

  useEffect(() => {
    document.body.dataset.effectLog += `|parity setup ${parity}`
    return () => {
      document.body.dataset.effectLog += `|parity cleanup ${parity}`
    }
  }, [parity])

  useEffect(namedSetup, [count])

  return <main data-runtime-link="/assets/kudzu.js">
    <p>{count}:{page}</p>
    <button onClick={() => { setCount(count + 1); setPage(page + 1) }}>Next</button>
  </main>
}
