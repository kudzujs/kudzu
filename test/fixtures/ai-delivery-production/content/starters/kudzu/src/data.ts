export type Article = {
  slug: string
  title: string
  topic: "Resilience" | "Performance" | "Accessibility" | "Practice"
  date: string
  displayDate: string
  minutes: number
  excerpt: string
  standfirst: string
  sectionTitle: string
  body: string
  code: string
}

export const articles: Article[] = [
  {
    slug: "designing-for-failure",
    title: "Designing for failure",
    topic: "Resilience",
    date: "2026-05-14",
    displayDate: "May 14, 2026",
    minutes: 7,
    excerpt: "Treat retries, stale data, and interrupted work as first-class product states.",
    standfirst: "Reliable interfaces do not pretend failure is rare. They make the next safe action obvious.",
    sectionTitle: "Make recovery a product path",
    body: "Keep the visitor's work, explain what happened in plain language, and offer one focused recovery action.",
    code: "retry({ preserveInput: true })"
  },
  {
    slug: "shipping-less-javascript",
    title: "Shipping less JavaScript",
    topic: "Performance",
    date: "2026-04-28",
    displayDate: "April 28, 2026",
    minutes: 6,
    excerpt: "Start with complete documents, then pay only for interactions that need a browser runtime.",
    standfirst: "The fastest script is often the one a page never needs to request.",
    sectionTitle: "Budget by capability",
    body: "Separate content delivery from interaction so static routes stay useful on slow devices and unreliable networks.",
    code: "enhance(onlyWhenNeeded)"
  },
  {
    slug: "content-that-lasts",
    title: "Content that lasts",
    topic: "Practice",
    date: "2026-04-03",
    displayDate: "April 3, 2026",
    minutes: 5,
    excerpt: "Use durable URLs, explicit structure, and boring formats to keep knowledge available.",
    standfirst: "Publishing is an operational promise, not merely a render pass.",
    sectionTitle: "Prefer durable primitives",
    body: "Headings, paragraphs, links, and code blocks survive redesigns because their meaning is independent of presentation.",
    code: "publish({ format: \"html\" })"
  },
  {
    slug: "accessible-by-default",
    title: "Accessible by default",
    topic: "Accessibility",
    date: "2026-03-19",
    displayDate: "March 19, 2026",
    minutes: 8,
    excerpt: "Build names, landmarks, keyboard paths, and clear status messages into the first draft.",
    standfirst: "Accessibility is strongest when ordinary product structure carries the load.",
    sectionTitle: "Name the interaction",
    body: "A visible label and native control usually provide a better baseline than a custom widget repaired after launch.",
    code: "label.control === searchInput"
  },
  {
    slug: "measuring-what-matters",
    title: "Measuring what matters",
    topic: "Performance",
    date: "2026-02-26",
    displayDate: "February 26, 2026",
    minutes: 9,
    excerpt: "Put behavior and accessibility checks ahead of timings, then publish the raw samples.",
    standfirst: "A fast result is useful only when it describes the product people actually receive.",
    sectionTitle: "Verify before timing",
    body: "Reject runs with broken interactions or missing content instead of averaging correctness failures into a flattering score.",
    code: "acceptance.pass && measure()"
  },
  {
    slug: "calm-release-notes",
    title: "Calm release notes",
    topic: "Performance",
    date: "2026-02-05",
    displayDate: "February 5, 2026",
    minutes: 4,
    excerpt: "Write releases around user-visible outcomes, known limits, and a practical recovery path.",
    standfirst: "Good release notes lower the cost of understanding change.",
    sectionTitle: "State the boundary",
    body: "Name what changed, what stayed stable, and which signal would justify broader work later.",
    code: "release({ claims: verified })"
  }
]
