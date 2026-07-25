// @ts-expect-error Node types are intentionally not a project dependency; this module runs only during the build.
import { readFile } from "node:fs/promises";
import type { BlogExample } from "./BlogExamples";

const functionNames: Record<string, string> = {
  personal: "Personal",
  developer: "Developer",
  editorial: "Editorial",
  news: "News",
  travel: "Travel",
  recipe: "Recipe",
  lifestyle: "Lifestyle",
  photography: "Photography",
  reviews: "Reviews",
  company: "Company",
  changelog: "Changelog",
  tutorial: "Tutorial",
  portfolio: "Portfolio",
  minimal: "Minimal",
  newsletter: "Newsletter",
  community: "Community",
};

export async function loadBlogSource(blog: BlogExample) {
  const [
    templates,
    articles,
    data,
    demoRoute,
    articleRoute,
    baseCss,
    layoutCss,
  ] = await Promise.all([
    source("components/examples/BlogTemplates.tsx"),
    source("components/examples/BlogArticles.tsx"),
    source("components/examples/BlogExamples.tsx"),
    source("pages/example/blog/[slug]/demo.tsx"),
    source("pages/example/blog/[slug]/demo/[post].tsx"),
    project("examples/styles/base.css"),
    project(`examples/styles/${blog.layout}.css`),
  ]);
  const name = functionNames[blog.layout];
  const articleComponent = section(
    articles,
    "export function BlogArticle",
    "function articleFeature",
  );
  const feature = articles
    .split("\n")
    .find((line) => line.includes(`case "${blog.layout}"`));

  return [
    {
      path: `src/components/examples/BlogTemplates.tsx · ${name}`,
      language: "tsx" as const,
      code: section(templates, `function ${name}`, "\nfunction "),
    },
    {
      path: "src/components/examples/BlogArticles.tsx · shared article",
      language: "tsx" as const,
      code: `${articleComponent}\n\n// Layout-specific feature\n${feature?.trim() ?? ""}`,
    },
    {
      path: `src/components/examples/BlogExamples.tsx · ${blog.slug}`,
      language: "tsx" as const,
      code:
        data
          .split("\n")
          .find((line) => line.includes(`slug: "${blog.slug}"`))
          ?.trim() ?? "",
    },
    {
      path: "src/pages/example/blog/[slug]/demo.tsx",
      language: "tsx" as const,
      code: demoRoute,
    },
    {
      path: "src/pages/example/blog/[slug]/demo/[post].tsx",
      language: "tsx" as const,
      code: articleRoute,
    },
    {
      path: "examples/styles/base.css",
      language: "text" as const,
      code: baseCss,
    },
    {
      path: `examples/styles/${blog.layout}.css`,
      language: "text" as const,
      code: layoutCss,
    },
  ];
}

export async function loadBlogStyles(blog: BlogExample) {
  return (
    await Promise.all([
      project("examples/styles/base.css"),
      project(`examples/styles/${blog.layout}.css`),
    ])
  ).join("\n");
}

export async function loadCatalogStyles(includeTemplates = false) {
  const paths = ["catalog.css"];
  if (includeTemplates)
    paths.push(
      "base.css",
      ...Object.keys(functionNames).map((name) => `${name}.css`),
    );
  return (
    await Promise.all(paths.map((path) => project(`examples/styles/${path}`)))
  ).join("\n");
}

export function inlineStyles(css: string) {
  return { type: "style", props: { dangerouslySetInnerHTML: { __html: css } } };
}

function source(path: string): Promise<string> {
  return project(`src/${path}`);
}

function project(path: string): Promise<string> {
  return readFile(new URL(`../../../${path}`, import.meta.url), "utf8");
}

function section(source: string, startText: string, nextText: string) {
  const start = source.indexOf(startText);
  const end = source.indexOf(nextText, start + startText.length);
  if (start < 0)
    throw new Error(`Example source section not found: ${startText}`);
  return source.slice(start, end < 0 ? undefined : end).trim();
}
