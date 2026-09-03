import { Shell } from "../components/Shell"

export default function StaticPage() {
  return <Shell>
    <article className="article-page">
      <p className="eyebrow">Static edition</p>
      <h1>A quiet corner of the web</h1>
      <p className="standfirst">This complete page needs no client JavaScript.</p>
      <p>Its links, landmarks, typography, and content remain useful on their own.</p>
    </article>
  </Shell>
}
