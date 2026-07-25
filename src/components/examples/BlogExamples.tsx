import { renderBlogTemplate } from "./BlogTemplates";

export type BlogExample = {
  slug: string;
  name: string;
  publication: string;
  description: string;
  label: string;
  accent: string;
  background: string;
  layout: string;
  posts: Array<{ slug: string; title: string; meta: string }>;
};

export const blogExamples: BlogExample[] = [
  {
    slug: "personal",
    name: "Personal",
    publication: "Field Notes",
    description: "Essays, notes, and a chronological archive.",
    label: "WRITING / ARCHIVE",
    accent: "#c65f3c",
    background: "#f3ede3",
    layout: "personal",
    posts: posts(
      "What I learned from a quiet year",
      "A room made for reading",
      "Notes from the last train",
    ),
  },
  {
    slug: "developer",
    name: "Developer",
    publication: "Undefined",
    description: "Technical articles, code samples, tags, and series.",
    label: "CODE / TUTORIALS",
    accent: "#79f2b5",
    background: "#08110d",
    layout: "developer",
    posts: posts(
      "Compilers are just careful readers",
      "A practical guide to ESM",
      "Direct DOM updates without a VDOM",
    ),
  },
  {
    slug: "editorial",
    name: "Editorial",
    publication: "The Sunday Edit",
    description: "Featured stories shaped by magazine-like hierarchy.",
    label: "FEATURES / CULTURE",
    accent: "#d34b2f",
    background: "#f4f0e8",
    layout: "editorial",
    posts: posts(
      "The return of the neighborhood cinema",
      "Objects designed to age",
      "Inside the new listening rooms",
    ),
  },
  {
    slug: "news",
    name: "News",
    publication: "The Daily Ledger",
    description: "Headlines, sections, and a dense stream of recent coverage.",
    label: "HEADLINES / TOPICS",
    accent: "#b51621",
    background: "#f7f5ef",
    layout: "news",
    posts: posts(
      "City approves a car-free river district",
      "Markets open higher after energy report",
      "Late summer storms move north",
    ),
  },
  {
    slug: "travel",
    name: "Travel",
    publication: "Elsewhere",
    description: "Destination journals led by photography and itineraries.",
    label: "PLACES / GUIDES",
    accent: "#ffcf70",
    background: "#17312f",
    layout: "travel",
    posts: posts(
      "Seven mornings in Madeira",
      "The coastal road to Essaouira",
      "A slow weekend in Kyoto",
    ),
  },
  {
    slug: "recipe",
    name: "Recipe",
    publication: "Salt & Stem",
    description: "Ingredients, clear steps, timing, and cooking notes.",
    label: "FOOD / HOW-TO",
    accent: "#dc5b35",
    background: "#f5e8d1",
    layout: "recipe",
    posts: posts(
      "Burnt tomato and saffron rice",
      "Lemon cake for an ordinary Tuesday",
      "Three sauces worth memorizing",
    ),
  },
  {
    slug: "lifestyle",
    name: "Lifestyle",
    publication: "Soft Hours",
    description: "Visual stories about products, routines, and trends.",
    label: "STYLE / LIVING",
    accent: "#bb6d75",
    background: "#eee4df",
    layout: "lifestyle",
    posts: posts(
      "The ten-minute evening reset",
      "A softer approach to getting dressed",
      "Ceramics for everyday tables",
    ),
  },
  {
    slug: "photography",
    name: "Photography",
    publication: "Silver Grain",
    description: "Image-led albums, field notes, and photo essays.",
    label: "ALBUMS / STORIES",
    accent: "#ef552f",
    background: "#111111",
    layout: "photography",
    posts: posts(
      "After the rain, Seoul",
      "Atlantic light",
      "Contact sheet 042",
    ),
  },
  {
    slug: "reviews",
    name: "Reviews",
    publication: "Margin",
    description: "Books, films, ratings, and long-form commentary.",
    label: "CRITICISM / RATINGS",
    accent: "#7357ff",
    background: "#f0ecdf",
    layout: "reviews",
    posts: posts(
      "The architecture of a perfect thriller",
      "Five novels about starting over",
      "A film that rewards the second look",
    ),
  },
  {
    slug: "company",
    name: "Company",
    publication: "Northstar",
    description:
      "Expertise, announcements, customer stories, and calls to action.",
    label: "BUSINESS / INSIGHTS",
    accent: "#5a66ff",
    background: "#f4f6fb",
    layout: "company",
    posts: posts(
      "Designing a calmer planning process",
      "How Common Ground scaled to 12 markets",
      "Our 2026 product principles",
    ),
  },
  {
    slug: "changelog",
    name: "Product Updates",
    publication: "Shiplog",
    description: "Versioned releases and a readable change history.",
    label: "RELEASES / CHANGELOG",
    accent: "#56d29a",
    background: "#0d1117",
    layout: "changelog",
    posts: posts(
      "v2.8 — Faster search and saved views",
      "v2.7 — Team permissions",
      "v2.6 — Import from anywhere",
    ),
  },
  {
    slug: "tutorial",
    name: "Education",
    publication: "Open Lesson",
    description: "Lessons organized into progressive, practical series.",
    label: "COURSES / GUIDES",
    accent: "#ffb42d",
    background: "#fff9e8",
    layout: "tutorial",
    posts: posts(
      "01. Start with semantic HTML",
      "02. Build a resilient layout",
      "03. Add only the behavior you need",
    ),
  },
  {
    slug: "portfolio-journal",
    name: "Portfolio Journal",
    publication: "Work in Process",
    description: "Project process, outcomes, and honest retrospectives.",
    label: "WORK / PROCESS",
    accent: "#ff4c36",
    background: "#e7e5df",
    layout: "portfolio",
    posts: posts(
      "A new identity for Public Radio",
      "Rebuilding the civic archive",
      "Packaging a small olive harvest",
    ),
  },
  {
    slug: "minimal",
    name: "Minimal Journal",
    publication: "Plain Text",
    description: "Short writing with restrained typography and navigation.",
    label: "NOTES / MINIMAL",
    accent: "#222222",
    background: "#fafafa",
    layout: "minimal",
    posts: posts(
      "On keeping a small website",
      "Monday, 6:14 am",
      "Things noticed in July",
    ),
  },
  {
    slug: "newsletter",
    name: "Newsletter",
    publication: "Good Monday",
    description: "Issue-based publishing with an email-first rhythm.",
    label: "ISSUES / SUBSCRIBE",
    accent: "#f0583e",
    background: "#f9eddb",
    layout: "newsletter",
    posts: posts(
      "Issue 48 — The useful kind of quiet",
      "Issue 47 — Make room for unfinished things",
      "Issue 46 — A better default",
    ),
  },
  {
    slug: "community",
    name: "Community",
    publication: "Common Thread",
    description: "Multiple authors, shared topics, and popular discussions.",
    label: "AUTHORS / TOPICS",
    accent: "#9d67ff",
    background: "#12101b",
    layout: "community",
    posts: posts(
      "What are you making this weekend?",
      "Show us your smallest useful tool",
      "How our local meetup found a home",
    ),
  },
];

function posts(first: string, second: string, third: string) {
  return [
    { slug: postSlug(first), title: first, meta: "FEATURED · 8 MIN" },
    { slug: postSlug(second), title: second, meta: "JUL 18 · 5 MIN" },
    { slug: postSlug(third), title: third, meta: "JUL 09 · 4 MIN" },
  ];
}

function postSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getBlogExample(slug: string) {
  const blog = blogExamples.find((entry) => entry.slug === slug);
  if (!blog) throw new Error(`Unknown blog example: ${slug}`);
  return blog;
}

export function BlogDemo({ blog }: { blog: BlogExample }) {
  return renderBlogTemplate(blog);
}
