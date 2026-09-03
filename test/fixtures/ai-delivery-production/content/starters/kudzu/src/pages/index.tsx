import { ArticleCard } from "../components/ArticleCard"
import { Shell } from "../components/Shell"
import { articles } from "../data"

export default function HomePage() {
  return <Shell>
    <section className="hero">
      <p className="eyebrow">Systems, interfaces, and the work between</p>
      <h1>Engineering notes for durable products</h1>
      <p className="lede">Field reports for teams who care about recovery, accessibility, and shipping only what a page needs.</p>
      <a className="text-link" href="/articles/">Read every article</a>
    </section>
    <section aria-labelledby="latest-heading">
      <div className="section-heading">
        <h2 id="latest-heading">Latest notes</h2>
        <p>Six practical essays, seeded and published.</p>
      </div>
      <div className="article-grid">
        {articles.map(article => <ArticleCard key={article.slug} article={article} />)}
      </div>
    </section>
  </Shell>
}
