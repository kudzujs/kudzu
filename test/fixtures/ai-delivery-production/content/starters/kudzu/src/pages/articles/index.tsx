import { ArticleCard } from "../../components/ArticleCard"
import { Shell } from "../../components/Shell"
import { articles } from "../../data"

export default function ArticlesPage() {
  return <Shell>
    <header className="page-heading">
      <p className="eyebrow">The archive</p>
      <h1>Articles</h1>
      <p className="lede">Notes from the practical edge of resilient product engineering.</p>
    </header>
    <div className="article-grid">
      {articles.map(article => <ArticleCard key={article.slug} article={article} />)}
    </div>
  </Shell>
}
