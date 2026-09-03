import { Shell } from "../../components/Shell"
import { articles, type Article } from "../../data"

export function getStaticPaths() {
  return articles.map(article => ({ params: { slug: article.slug }, props: { article, title: article.title } }))
}

export default function ArticlePage({ article }: { article: Article, title: string }) {
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
