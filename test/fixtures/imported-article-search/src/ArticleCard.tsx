export function ArticleCard({ article }: { article: { slug: string; title: string; topic: string } }) {
  return <article data-article={article.slug}><h2>{article.title}</h2><p>{article.topic}</p></article>
}
