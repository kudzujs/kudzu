import { CodeBlock } from "../../../components/CodeBlock";
import {
  BlogDemo,
  BlogExample,
  blogExamples,
} from "../../../components/examples/BlogExamples";
import {
  inlineStyles,
  loadBlogSource,
  loadBlogStyles,
  loadCatalogStyles,
} from "../../../components/examples/ExampleSource";

export const metadata = {
  title: "Kudzu Blog Example — Live preview and source",
  description:
    "Explore a complete static blog example, its project structure, and the Kudzu 0.16.20 TSX source behind it.",
  lang: "en",
  locale: "en_US",
  siteName: "Kudzu",
  themeColor: "#8d52ff",
  icon: "/favicon.ico",
};

export function getStaticPaths() {
  return blogExamples.map((blog) => ({
    params: { slug: blog.slug },
    props: { blog },
  }));
}

export default async function BlogShowcase({ blog }: { blog: BlogExample }) {
  const [files, catalogCss, blogCss] = await Promise.all([
    loadBlogSource(blog),
    loadCatalogStyles(),
    loadBlogStyles(blog),
  ]);
  const templateSource = CodeBlock({
    code: files[0].code,
    language: files[0].language,
  });
  const articleSource = CodeBlock({
    code: files[1].code,
    language: files[1].language,
  });
  const dataSource = CodeBlock({
    code: files[2].code,
    language: files[2].language,
  });
  const demoRouteSource = CodeBlock({
    code: files[3].code,
    language: files[3].language,
  });
  const articleRouteSource = CodeBlock({
    code: files[4].code,
    language: files[4].language,
  });
  const baseStyleSource = CodeBlock({
    code: files[5].code,
    language: files[5].language,
  });
  const templateStyleSource = CodeBlock({
    code: files[6].code,
    language: files[6].language,
  });
  const preview = BlogDemo({ blog });

  const page = (
    <div className="example-showcase">
      <header className="site-header example-header">
        <a className="brand" href="/">
          <img src="/icon-128.png" alt="Kudzu" />
        </a>
        <nav aria-label="Example navigation">
          <a href="/example">All examples</a>
          <a href="/releases/0.16.20">Kudzu 0.16.20</a>
          <a href={`/example/blog/${blog.slug}/demo`}>Open demo ↗</a>
        </nav>
      </header>

      <main className="showcase-main">
        <section className="showcase-intro">
          <p className="eyebrow"><span>v0.16.20</span> BLOG EXAMPLE / {blog.label}</p>
          <h1>
            {blog.name}
            <br />
            <em>blog.</em>
          </h1>
          <p>
            {blog.description} Preview the finished page, then inspect the exact
            source compiled by the current Kudzu release.
          </p>
        </section>

        <section className="showcase-preview" aria-labelledby="preview-title">
          <div className="showcase-section-heading">
            <span>01</span>
            <div>
              <p>LIVE OUTPUT</p>
              <h2 id="preview-title">Preview</h2>
            </div>
            <a href={`/example/blog/${blog.slug}/demo`}>Open full page ↗</a>
          </div>
          <div className="showcase-browser">
            <div className="showcase-browser-toolbar">
              <i />
              <i />
              <i />
              <span>kudzu.local/example/blog/{blog.slug}/demo</span>
            </div>
            <div className="showcase-live-preview" aria-hidden="true">
              <div className="showcase-live-preview-stage">{preview}</div>
            </div>
            <a
              className="showcase-preview-link"
              href={`/example/blog/${blog.slug}/demo`}
              aria-label={`Open ${blog.name} full page`}
            />
          </div>
        </section>

        <section className="showcase-source" aria-labelledby="source-title">
          <div className="showcase-section-heading">
            <span>02</span>
            <div>
              <p>PROJECT SOURCE</p>
              <h2 id="source-title">Build it yourself</h2>
            </div>
          </div>
          <div className="showcase-source-layout">
            <aside className="showcase-tree">
              <strong>PROJECT FILES</strong>
              <span>src</span>
              <span className="tree-depth-1">components/examples</span>
              <a className="tree-depth-2" href="#file-template">
                BlogTemplates.tsx
              </a>
              <a className="tree-depth-2" href="#file-article">
                BlogArticles.tsx
              </a>
              <a className="tree-depth-2" href="#file-data">
                BlogExamples.tsx
              </a>
              <span className="tree-depth-1">pages</span>
              <a className="tree-depth-2" href="#file-demo-route">
                [slug]/demo.tsx
              </a>
              <a className="tree-depth-2" href="#file-article-route">
                [slug]/demo/[post].tsx
              </a>
              <span className="tree-depth-1">styles</span>
              <a className="tree-depth-2" href="#file-base-style">
                base.css
              </a>
              <a className="tree-depth-2" href="#file-template-style">
                {blog.layout}.css
              </a>
            </aside>
            <div className="showcase-files">
              <section className="showcase-file" id="file-template">
                <header>
                  <span>{files[0].path}</span>
                  <small>TSX</small>
                </header>
                {templateSource}
              </section>
              <section className="showcase-file" id="file-article">
                <header>
                  <span>{files[1].path}</span>
                  <small>TSX</small>
                </header>
                {articleSource}
              </section>
              <section className="showcase-file" id="file-data">
                <header>
                  <span>{files[2].path}</span>
                  <small>TSX</small>
                </header>
                {dataSource}
              </section>
              <section className="showcase-file" id="file-demo-route">
                <header>
                  <span>{files[3].path}</span>
                  <small>TSX</small>
                </header>
                {demoRouteSource}
              </section>
              <section className="showcase-file" id="file-article-route">
                <header>
                  <span>{files[4].path}</span>
                  <small>TSX</small>
                </header>
                {articleRouteSource}
              </section>
              <section className="showcase-file" id="file-base-style">
                <header>
                  <span>{files[5].path}</span>
                  <small>CSS</small>
                </header>
                {baseStyleSource}
              </section>
              <section className="showcase-file" id="file-template-style">
                <header>
                  <span>{files[6].path}</span>
                  <small>CSS</small>
                </header>
                {templateStyleSource}
              </section>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
  return [inlineStyles(`${catalogCss}\n${blogCss}`), page];
}
