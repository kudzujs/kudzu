import { readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"

const origin = "https://kudzujs.cloud"
const blogs = {
  personal: ["Personal", "A personal journal example for essays, notes, and chronological archives."],
  developer: ["Developer", "A developer blog example for technical articles, code samples, tags, and series."],
  editorial: ["Editorial", "An editorial blog example with magazine hierarchy and featured stories."],
  news: ["News", "A news blog example with headlines, categories, breaking updates, and recent coverage."],
  travel: ["Travel", "A travel blog example for destination journals, photography, and itineraries."],
  recipe: ["Recipe", "A recipe blog example with ingredients, cooking steps, timing, and seasonal collections."],
  lifestyle: ["Lifestyle", "A lifestyle blog example for visual stories, products, routines, and trends."],
  photography: ["Photography", "A photography blog example with image-led albums and photo essays."],
  reviews: ["Reviews", "A review blog example for books, films, ratings, and long-form criticism."],
  company: ["Company", "A company blog example for expertise, announcements, and customer stories."],
  changelog: ["Product Updates", "A product update blog example with releases, versions, and change history."],
  tutorial: ["Education", "An educational blog example with progressive lessons and practical tutorials."],
  "portfolio-journal": ["Portfolio Journal", "A portfolio journal example documenting project process and outcomes."],
  minimal: ["Minimal Journal", "A minimal journal example focused on short writing and restrained navigation."],
  newsletter: ["Newsletter", "A newsletter blog example for issue-based publishing and subscriptions."],
  community: ["Community", "A community blog example with multiple authors, topics, and discussions."]
}

export default {
  async afterBuild({ outDir, routes }) {
    const indexed = []
    for (const route of routes) {
      const path = route === "/" ? "/" : route.replace(/\/$/, "")
      const file = join(outDir, path === "/" ? "index.html" : path.slice(1), path === "/" ? "" : "index.html")
      const seo = seoFor(path)
      if (!seo) continue
      const html = await readFile(file, "utf8")
      await writeFile(file, applySeo(html, seo))
      if (seo.index) indexed.push(path)
    }
    await writeFile(join(outDir, "sitemap.xml"), sitemap(indexed))
  }
}

function seoFor(path) {
  if (path === "/") return page("Kudzu — HTML-first TSX framework", "React-shaped TSX with synchronous state, static HTML, and no virtual DOM.", path, "WebSite")
  if (path === "/docs") return page("Kudzu Documentation — HTML-first TSX", "Learn Kudzu components, state semantics, application navigation, effects, performance, and static build output.", path, "TechArticle")
  if (path === "/example") return page("Kudzu Examples — Static sites and source code", "Explore complete static site examples, live previews, project structure, and exact Kudzu TSX source.", path, "CollectionPage")

  const match = path.match(/^\/example\/blog\/([^/]+)(?:\/demo(?:\/([^/]+))?)?$/)
  if (!match || !blogs[match[1]]) return undefined
  const [name, description] = blogs[match[1]]
  const showcase = `/example/blog/${match[1]}`
  if (path === showcase) return page(`${name} Blog Example and Source | Kudzu`, description, showcase, "WebPage")
  return {
    title: match[2] ? `${titleFromSlug(match[2])} | ${name} Blog Demo` : `${name} Blog Demo | Kudzu`,
    description,
    canonical: `${origin}${showcase}`,
    type: match[2] ? "BlogPosting" : "WebPage",
    index: false
  }
}

function page(title, description, path, type) {
  return { title, description, canonical: `${origin}${path === "/" ? "" : path}`, type, index: true }
}

function applySeo(html, seo) {
  const tags = [
    `<meta name="description" content="${escapeAttribute(seo.description)}">`,
    `<link rel="canonical" href="${escapeAttribute(seo.canonical)}">`,
    ...(!seo.index ? [`<meta name="robots" content="noindex,follow">`] : []),
    `<script type="application/ld+json" data-kudzu-seo>${JSON.stringify({ "@context": "https://schema.org", "@type": seo.type, name: seo.title, headline: seo.title, description: seo.description, url: seo.canonical }).replaceAll("<", "\\u003c")}</script>`
  ].join("")
  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(seo.title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, "")
    .replace(/<link rel="canonical"[^>]*>/, "")
    .replace(/<meta name="robots"[^>]*>/, "")
    .replace(/<script type="application\/ld\+json" data-kudzu-seo>[\s\S]*?<\/script>/, "")
    .replace("</head>", `${tags}</head>`)
}

function sitemap(paths) {
  const urls = [...new Set(paths)].sort((left, right) => left === "/" ? -1 : right === "/" ? 1 : left.localeCompare(right))
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(path => `  <url><loc>${origin}${path === "/" ? "/" : escapeHtml(path)}</loc></url>`).join("\n")}\n</urlset>\n`
}

function titleFromSlug(slug) {
  return slug.split("-").map(word => word ? word[0].toUpperCase() + word.slice(1) : word).join(" ")
}

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('"', "&quot;")
}
