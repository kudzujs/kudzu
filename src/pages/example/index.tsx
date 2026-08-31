import {
  BlogDemo,
  BlogExample,
  blogExamples,
} from "../../components/examples/BlogExamples";
import {
  inlineStyles,
  loadCatalogStyles,
} from "../../components/examples/ExampleSource";

export const metadata = {
  title: "Kudzu Examples — Site patterns built with TSX",
  description:
    "Browse static site examples compiled with Kudzu 0.16.12, starting with sixteen distinct blog formats.",
  lang: "en",
  locale: "en_US",
  siteName: "Kudzu",
  url: "https://kudzujs.cloud/example/",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu site example catalog",
  themeColor: "#8d52ff",
  icon: "/favicon.ico",
  appleTouchIcon: "/apple-touch-icon.png",
  manifest: "/site.webmanifest",
};

export default async function ExamplePage() {
  const css = await loadCatalogStyles(true);
  const cards = blogExamples.map((blog, index) => blogCard(blog, index));

  const page = (
    <div className="example-catalog">
      <header className="site-header example-header">
        <a className="brand" href="/">
          <img src="/icon-128.png" alt="Kudzu" />
        </a>
        <nav aria-label="Example navigation">
          <a href="/">Home</a>
          <a href="/docs">Docs</a>
          <a href="/releases/0.16.12">Release 0.16.12</a>
          <a className="example-active" href="/example" aria-current="page">
            Examples
          </a>
        </nav>
      </header>

      <main className="example-main">
        <section className="example-intro">
          <p className="eyebrow"><span>v0.16.12</span> KUDZU EXAMPLE CATALOG</p>
          <h1>
            Sites worth
            <br />
            <em>taking apart.</em>
          </h1>
          <p>
            Complete site patterns compiled by Kudzu 0.16.12, their project
            structure, and the code behind them. The catalog starts with blogs.
          </p>
        </section>

        <section
          className="example-category"
          aria-labelledby="blog-examples-title"
        >
          <div className="example-category-heading">
            <div>
              <p>01 / CATEGORY</p>
              <h2 id="blog-examples-title">Blog</h2>
            </div>
            <p>
              Sixteen publishing structures, from personal notes to multi-author
              media. Drag, swipe, or scroll to explore.
            </p>
          </div>

          <div
            className="example-rail"
            aria-label="Blog example types"
            tabIndex={0}
          >
            {cards}
          </div>
        </section>
      </main>
    </div>
  );
  return [inlineStyles(css), page];
}

function blogCard(blog: BlogExample, index: number) {
  const preview = BlogDemo({ blog });
  return (
    <article className="example-card">
      <div className="example-card-number">
        {String(index + 1).padStart(2, "0")}
      </div>
      <div className="example-card-preview actual-preview" aria-hidden="true">
        <div className="actual-preview-stage">{preview}</div>
      </div>
      <p>{blog.label}</p>
      <h3>{blog.name}</h3>
      <span>{blog.description}</span>
      <a className="example-card-action" href={`/example/blog/${blog.slug}`}>
        VIEW EXAMPLE →
      </a>
    </article>
  );
}
