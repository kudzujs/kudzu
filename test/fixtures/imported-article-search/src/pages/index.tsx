import { useState } from "@kudzujs/core"
import { ArticleCard } from "../ArticleCard"
import { articles } from "../data"

export default function ArticlesPage() {
  const [query, setQuery] = useState("")
  const normalizedQuery = query.trim().toLowerCase()
  const filteredArticles = articles.filter(article => article.title.toLowerCase().includes(normalizedQuery) || article.topic.toLowerCase().includes(normalizedQuery))
  const resultCount = filteredArticles.length

  return <main>
    <h1>Articles</h1>
    <label htmlFor="article-search">Search articles</label>
    <input id="article-search" type="search" value={query} onInput={event => setQuery(event.currentTarget.value)} />
    <p aria-live="polite">{resultCount} {resultCount === 1 ? "article" : "articles"}</p>
    <div>{filteredArticles.map(article => <ArticleCard key={article.slug} article={article} />)}</div>
    {resultCount === 0 && <p data-empty>No articles match your search.</p>}
  </main>
}
