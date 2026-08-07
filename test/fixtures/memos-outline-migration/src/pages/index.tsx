import { useEffect, useRef, useState } from "react"

const headings = [
  { text: "Overview", level: 1, slug: "overview" },
  { text: "Decisions", level: 2, slug: "decisions" },
  { text: "Follow-up", level: 2, slug: "follow-up" }
]

const READING_LINE_OFFSET = 100

export default function MemoOutlinePage() {
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const rafRef = useRef(0)

  useEffect(() => {
    const update = () => {
      rafRef.current = 0
      let current: string | null = null
      for (const heading of headings) {
        const element = document.getElementById(heading.slug)
        if (!element) continue
        if (element.getBoundingClientRect().top > READING_LINE_OFFSET) break
        current = heading.slug
      }
      setActiveSlug(current ?? headings[0]?.slug ?? null)
    }
    const requestUpdate = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", requestUpdate, true)
    window.addEventListener("resize", requestUpdate)
    return () => {
      window.removeEventListener("scroll", requestUpdate, true)
      window.removeEventListener("resize", requestUpdate)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return <main>
    <article>
      <h1 id="overview">Overview</h1>
      <p>Project summary</p>
      <h2 id="decisions">Decisions</h2>
      <p>Architecture decisions</p>
      <h2 id="follow-up">Follow-up</h2>
      <p>Next actions</p>
    </article>
    <nav aria-label="Memo outline">
      {headings.map(heading => <a
        key={heading.slug}
        href={`#${heading.slug}`}
        aria-current={heading.slug === activeSlug ? "location" : undefined}
        className={heading.slug === activeSlug ? "active" : ""}
        onClick={event => {
          event.preventDefault()
          const element = document.getElementById(heading.slug)
          if (element) {
            setActiveSlug(heading.slug)
            element.scrollIntoView({ behavior: "smooth", block: "start" })
            window.history.replaceState(null, "", `#${heading.slug}`)
          }
        }}
      >{heading.text}</a>)}
    </nav>
  </main>
}
