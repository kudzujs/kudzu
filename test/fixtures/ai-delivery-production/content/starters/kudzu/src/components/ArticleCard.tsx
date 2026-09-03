import type { Article } from "../data"

export function ArticleCard({ article }: { article: Article }) {
  return <article className="article-card">
    <p className="eyebrow">{article.topic}</p>
    <h2><a href={`/articles/${article.slug}/`}>{article.title}</a></h2>
    <p>{article.excerpt}</p>
    <p className="meta"><time dateTime={article.date}>{article.displayDate}</time> · {article.minutes} min read</p>
  </article>
}
