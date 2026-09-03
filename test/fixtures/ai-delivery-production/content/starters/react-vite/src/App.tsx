import { articles, type Article } from "./data"

function Shell({ children }: { children: React.ReactNode }) {
  return <>
    <header className="site-header">
      <a className="brand" href="/">
        <svg viewBox="0 0 36 36" width="36" height="36" aria-hidden="true">
          <path d="M7 29V7h22L18 18l11 11H7Z" />
        </svg>
        <span>Field Notes</span>
      </a>
      <nav aria-label="Primary">
        <a href="/articles/">Articles</a>
        <a href="/topics/performance/">Performance</a>
        <a href="/about/">About</a>
      </nav>
    </header>
    <main>{children}</main>
    <footer><p>Field Notes · Independent engineering writing since 2021.</p></footer>
  </>
}

function ArticleCard({ article }: { article: Article }) {
  return <article className="article-card">
    <p className="eyebrow">{article.topic}</p>
    <h2><a href={`/articles/${article.slug}/`}>{article.title}</a></h2>
    <p>{article.excerpt}</p>
    <p className="meta"><time dateTime={article.date}>{article.displayDate}</time> · {article.minutes} min read</p>
  </article>
}

function HomePage() {
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
      <div className="article-grid">{articles.map(article => <ArticleCard key={article.slug} article={article} />)}</div>
    </section>
  </Shell>
}

function ArticlesPage() {
  return <Shell>
    <header className="page-heading">
      <p className="eyebrow">The archive</p>
      <h1>Articles</h1>
      <p className="lede">Notes from the practical edge of resilient product engineering.</p>
    </header>
    <div className="article-grid">{articles.map(article => <ArticleCard key={article.slug} article={article} />)}</div>
  </Shell>
}

function ArticlePage({ article }: { article: Article }) {
  return <Shell>
    <article className="article-page">
      <header>
        <p className="eyebrow">{article.topic}</p>
        <h1>{article.title}</h1>
        <p className="byline">Mara Bell · {article.displayDate} · {article.minutes} min read</p>
        <p className="standfirst">{article.standfirst}</p>
      </header>
      <h2>{article.sectionTitle}</h2>
      <p>{article.body}</p>
      <pre tabIndex={0}><code>{article.code}</code></pre>
      <p><a className="text-link" href="/topics/performance/">Browse performance notes</a></p>
    </article>
  </Shell>
}

function PerformancePage() {
  return <Shell>
    <header className="page-heading">
      <p className="eyebrow">Topic</p>
      <h1>Performance</h1>
      <p className="lede">Measure complete experiences and remove work before tuning it.</p>
    </header>
    <div className="article-grid">{articles.filter(article => article.topic === "Performance").map(article => <ArticleCard key={article.slug} article={article} />)}</div>
  </Shell>
}

function AboutPage() {
  return <Shell>
    <article className="article-page">
      <p className="eyebrow">About</p>
      <h1>About Field Notes</h1>
      <p className="standfirst">Field Notes is an independent publication for teams building software that has to last.</p>
      <h2>Editorial principles</h2>
      <p>Prefer evidence to novelty, native behavior to imitation, and honest limits to broad claims.</p>
    </article>
  </Shell>
}

function StaticPage() {
  return <Shell>
    <article className="article-page">
      <p className="eyebrow">Static edition</p>
      <h1>A quiet corner of the web</h1>
      <p className="standfirst">This complete page needs no client JavaScript.</p>
      <p>Its links, landmarks, typography, and content remain useful on their own.</p>
    </article>
  </Shell>
}

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/"
  if (path === "/articles") return <ArticlesPage />
  if (path === "/topics/performance") return <PerformancePage />
  if (path === "/about") return <AboutPage />
  if (path === "/static") return <StaticPage />
  if (path.startsWith("/articles/")) {
    const article = articles.find(candidate => `/articles/${candidate.slug}` === path)
    if (article) return <ArticlePage article={article} />
  }
  return <HomePage />
}
