import { ArticleCard } from "../../components/ArticleCard"
import { Shell } from "../../components/Shell"
import { articles } from "../../data"

export default function PerformancePage() {
  return <Shell>
    <header className="page-heading">
      <p className="eyebrow">Topic</p>
      <h1>Performance</h1>
      <p className="lede">Measure complete experiences and remove work before tuning it.</p>
    </header>
    <div className="article-grid">
      {articles.filter(article => article.topic === "Performance").map(article => <ArticleCard key={article.slug} article={article} />)}
    </div>
  </Shell>
}
