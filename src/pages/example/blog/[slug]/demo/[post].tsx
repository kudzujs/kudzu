import { BlogArticle } from "../../../../../components/examples/BlogArticles";
import {
  BlogExample,
  blogExamples,
} from "../../../../../components/examples/BlogExamples";
import {
  inlineStyles,
  loadBlogStyles,
} from "../../../../../components/examples/ExampleSource";

type Post = BlogExample["posts"][number];

export const metadata = {
  title: "Kudzu Blog Article Demo",
    description: "A statically generated article page compiled with Kudzu 0.16.8 TSX.",
  lang: "en",
  locale: "en_US",
  siteName: "Kudzu Examples",
  styles: true,
};

export function getStaticPaths() {
  return blogExamples.flatMap((blog) =>
    blog.posts.map((post) => ({
      params: { slug: blog.slug, post: post.slug },
      props: { blog, post },
    })),
  );
}

export default async function BlogArticlePage({
  blog,
  post,
}: {
  blog: BlogExample;
  post: Post;
}) {
  const css = await loadBlogStyles(blog);
  return [inlineStyles(css), BlogArticle({ blog, post })];
}
