import { useEffect, useState } from "@kudzujs/core"
import "../../newsletter.css"
import "../../style.css"

type Props = { title: string; score: number; html: string }

export const metadata = { icon: "/icon.svg", manifest: "/manifest.webmanifest" }

export async function getStaticPaths() {
  return [
    { params: { slug: "oak" }, props: { title: "Oak", score: 7, html: "<article><strong>Oak body</strong></article>" } },
    { params: { slug: "pine" }, props: { title: "Pine", score: 9, html: "<article><strong>Pine body</strong></article>" } }
  ]
}

export default function Post({ title, score, html }: Props) {
  const [saved, setSaved] = useState(false)
  const [mounted, setMounted] = useState("pending")

  useEffect(() => {
    setMounted(title)
  }, [])

  function save() {
    document.body.dataset.saved = title
    setSaved(true)
  }

  return <main data-title={title}>
    <h1>{title}</h1>
    <p>Score: {score}</p>
    <p data-mounted>{mounted}</p>
    <section dangerouslySetInnerHTML={{ __html: html }} />
    <button onClick={save}>{saved ? "Saved" : "Save"}</button>
  </main>
}
