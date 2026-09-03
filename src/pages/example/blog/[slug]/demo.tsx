import {
  BlogDemo,
  BlogExample,
  blogExamples,
} from "../../../../components/examples/BlogExamples";
import {
  inlineStyles,
  loadBlogStyles,
} from "../../../../components/examples/ExampleSource";

export const metadata = {
  title: "Kudzu Blog Demo",
    description: "A static blog design compiled with Kudzu 0.16.18 TSX.",
  lang: "en",
  locale: "en_US",
  siteName: "Kudzu Examples",
  styles: true,
};

export function getStaticPaths() {
  return blogExamples.map((blog) => ({
    params: { slug: blog.slug },
    props: { blog },
  }));
}

export default async function BlogDemoPage({ blog }: { blog: BlogExample }) {
  const css = await loadBlogStyles(blog);
  return [inlineStyles(css), BlogDemo({ blog })];
}
