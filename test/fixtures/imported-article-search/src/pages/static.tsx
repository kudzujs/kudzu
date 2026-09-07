import { articles } from "../data"

export default function StaticPage() {
  return <main><h1>Static articles</h1>{articles.map(article => <p key={article.slug}>{article.title}</p>)}</main>
}
