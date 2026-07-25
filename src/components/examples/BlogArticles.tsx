import type { BlogExample } from "./BlogExamples";

type Post = BlogExample["posts"][number];

export function BlogArticle({ blog, post }: { blog: BlogExample; post: Post }) {
  const index = blog.posts.findIndex((entry) => entry.slug === post.slug);
  const previous =
    blog.posts[(index + blog.posts.length - 1) % blog.posts.length];
  const next = blog.posts[(index + 1) % blog.posts.length];
  const feature = articleFeature(blog.layout);
  const copy = articleCopy(blog.layout);
  const section = articleSection(blog.layout);
  const deck = articleDeck(blog.layout);
  const author = articleAuthor(blog.layout);
  const heading = articleHeading(blog.layout);
  const quote = articleQuote(blog.layout);

  return (
    <div className={`article-template article-${blog.layout}`}>
      <header>
        <a href={`/example/blog/${blog.slug}/demo`}>{blog.publication}</a>
        <nav>
          <a href={`/example/blog/${blog.slug}/demo`}>All stories</a>
          <a href="/example">Kudzu examples ↗</a>
        </nav>
      </header>
      <main>
        <div className="article-breadcrumb">
          <a href={`/example/blog/${blog.slug}/demo`}>{blog.name}</a>
          <span>/</span>
          <span>{post.meta}</span>
        </div>
        <article>
          <header>
            <span>{section}</span>
            <h1>{post.title}</h1>
            <p>{deck}</p>
            <div>
              <span>By {author}</span>
              <time>July 25, 2026 · 8 min read</time>
            </div>
          </header>
          <figure
            className="article-hero"
            role="img"
            aria-label={`${post.title} cover`}
          />
          <div className="article-content">
            {feature}
            <div className="article-copy">
              <p className="article-opening">{copy[0]}</p>
              <h2>{heading}</h2>
              <p>{copy[1]}</p>
              <blockquote>{quote}</blockquote>
              <p>{copy[2]}</p>
            </div>
          </div>
        </article>
        <footer className="article-pagination">
          <a href={`/example/blog/${blog.slug}/demo/${previous.slug}`}>
            <span>← Previous</span>
            <strong>{previous.title}</strong>
          </a>
          <a href={`/example/blog/${blog.slug}/demo/${next.slug}`}>
            <span>Next →</span>
            <strong>{next.title}</strong>
          </a>
        </footer>
      </main>
    </div>
  );
}

function articleFeature(layout: string) {
  switch (layout) {
    case "developer":
      return (
        <aside className="article-code">
          <span>IN THIS ARTICLE</span>
          <code>parse → transform → print</code>
          <a href="#example">Jump to code</a>
        </aside>
      );
    case "editorial":
      return (
        <aside className="article-issue">
          <strong>THE SUNDAY EDIT</strong>
          <span>Volume 08</span>
          <span>Culture / Feature</span>
          <span>Photography by Ana Vale</span>
        </aside>
      );
    case "news":
      return (
        <aside className="article-facts">
          <strong>AT A GLANCE</strong>
          <span>Vote: 9–2</span>
          <span>Work begins: Spring</span>
          <span>Estimated cost: $18m</span>
        </aside>
      );
    case "travel":
      return (
        <aside className="article-trip">
          <strong>FIELD NOTES</strong>
          <span>7 days</span>
          <span>412 km</span>
          <span>Best season: May–Oct</span>
          <a href="#map">Open route map</a>
        </aside>
      );
    case "recipe":
      return (
        <aside className="article-ingredients">
          <strong>INGREDIENTS</strong>
          <ul>
            <li>2 cups short-grain rice</li>
            <li>6 ripe tomatoes</li>
            <li>1 pinch saffron</li>
            <li>Olive oil and sea salt</li>
          </ul>
        </aside>
      );
    case "lifestyle":
      return (
        <aside className="article-edit">
          <strong>THE EDIT</strong>
          <span>Linen table cloth</span>
          <span>Stoneware cup</span>
          <span>Hinoki tray</span>
          <a href="#objects">View objects</a>
        </aside>
      );
    case "photography":
      return (
        <aside className="article-camera">
          <strong>FRAME 01 / 07</strong>
          <span>Leica M6</span>
          <span>35mm · Portra 800</span>
          <span>Seoul, 23:48</span>
        </aside>
      );
    case "reviews":
      return (
        <aside className="article-rating">
          <strong>9.2</strong>
          <span>ESSENTIAL</span>
          <dl>
            <dt>Direction</dt>
            <dd>9.4</dd>
            <dt>Writing</dt>
            <dd>9.0</dd>
            <dt>Image</dt>
            <dd>9.1</dd>
          </dl>
        </aside>
      );
    case "company":
      return (
        <aside className="article-takeaways">
          <strong>KEY TAKEAWAYS</strong>
          <ol>
            <li>Replace status with decisions</li>
            <li>Write ownership down</li>
            <li>Review the system monthly</li>
          </ol>
        </aside>
      );
    case "changelog":
      return (
        <aside className="article-release">
          <strong>VERSION 2.8</strong>
          <span className="release-badge">NEW</span>
          <span>Released July 25</span>
          <a href="#upgrade">Upgrade notes</a>
        </aside>
      );
    case "tutorial":
      return (
        <aside className="article-progress">
          <strong>LESSON PROGRESS</strong>
          <span>01 / 03</span>
          <i />
          <a href="#exercise">Skip to exercise</a>
        </aside>
      );
    case "portfolio":
      return (
        <aside className="article-brief">
          <strong>PROJECT BRIEF</strong>
          <span>Client: Public Radio</span>
          <span>Year: 2026</span>
          <span>Scope: Identity, digital</span>
        </aside>
      );
    case "minimal":
      return (
        <aside className="article-note">
          <span>Filed under</span>
          <strong>Websites, ownership, small things</strong>
        </aside>
      );
    case "newsletter":
      return (
        <aside className="article-issue">
          <strong>ISSUE 048</strong>
          <span>Sent to 12,840 readers</span>
          <a href="#subscribe">Subscribe free</a>
        </aside>
      );
    case "community":
      return (
        <aside className="article-author">
          <span>AL</span>
          <strong>Alex Lee</strong>
          <small>Member since 2022 · 184 posts</small>
          <button>Follow</button>
        </aside>
      );
    default:
      return (
        <aside className="article-note">
          <span>A NOTE FROM</span>
          <strong>Alex Morgan</strong>
          <small>Edinburgh, July 2026</small>
        </aside>
      );
  }
}

function articleSection(layout: string) {
  return (
    (
      {
        developer: "ENGINEERING",
        editorial: "THE WEEKEND FEATURE",
        news: "CITY HALL",
        travel: "FIELD GUIDE 014",
        recipe: "WEEKNIGHT DINNER",
        lifestyle: "THE SUNDAY ROUTINE",
        photography: "PHOTO ESSAY",
        reviews: "CRITICISM",
        company: "NORTHSTAR INSIGHTS",
        changelog: "PRODUCT UPDATE",
        tutorial: "LESSON 01",
        portfolio: "CASE NOTE",
        minimal: "NOTE",
        newsletter: "ISSUE 048",
        community: "MEMBER POST",
      } as Record<string, string>
    )[layout] ?? "LATEST ENTRY"
  );
}

function articleAuthor(layout: string) {
  return (
    (
      {
        developer: "Mina Cho",
        editorial: "Mara Bell",
        news: "Lena Ortiz",
        travel: "Jon Bell",
        recipe: "Inez Park",
        lifestyle: "Clara Moon",
        photography: "Noah Kim",
        reviews: "Evan Holt",
        company: "Northstar Research",
        changelog: "Shiplog Team",
        tutorial: "Sun Kim",
        portfolio: "Work in Process",
        minimal: "Eli Ward",
        newsletter: "Mara Good",
        community: "Alex Lee",
      } as Record<string, string>
    )[layout] ?? "Alex Morgan"
  );
}

function articleDeck(layout: string) {
  return (
    (
      {
        developer:
          "A practical explanation with working code and fewer abstractions.",
        editorial:
          "A long-form dispatch about the people changing how culture is made and shared.",
        news: "What happened, why it matters, and what comes next.",
        travel:
          "A field guide for taking the slower road and noticing more along the way.",
        recipe: "A deeply savory, pantry-friendly recipe made in one wide pan.",
        lifestyle:
          "Small rituals and useful objects for a calmer everyday life.",
        photography:
          "Seven frames made after the rain, when the city doubled beneath itself.",
        reviews:
          "An exacting work about memory, repetition, and what cities ask us to forget.",
        company:
          "A practical operating system for teams that have outgrown status meetings.",
        changelog:
          "Faster search, saved views, and dozens of small workflow improvements.",
        tutorial:
          "Start with the document and build outward, one durable layer at a time.",
        portfolio:
          "The constraints, rejected directions, and decisions behind the final work.",
        minimal: "A website can be a room instead of a feed.",
        newsletter:
          "A short letter about creative work and the useful kind of quiet.",
        community:
          "A field note shared in public, with room for a better answer.",
      } as Record<string, string>
    )[layout] ?? "An essay about work, place, and paying closer attention."
  );
}

function articleHeading(layout: string) {
  return (
    (
      {
        developer: "Start with the smallest compiler pass",
        editorial: "A room that belongs to its neighborhood",
        news: "What the vote changes",
        travel: "Leave space in the itinerary",
        recipe: "Build flavor before adding the rice",
        lifestyle: "Make the routine easy to return to",
        photography: "Working with reflected light",
        reviews: "A story built through repetition",
        company: "Replace reporting with a decision log",
        changelog: "Designed for keyboard-first work",
        tutorial: "The document comes before the component",
        portfolio: "The first direction was wrong",
        minimal: "A room, not a feed",
        newsletter: "Quiet is a working condition",
        community: "Share the unfinished version",
      } as Record<string, string>
    )[layout] ?? "What remained after the plans changed"
  );
}

function articleQuote(layout: string) {
  return (
    (
      {
        developer:
          "The useful abstraction is usually the one you can still explain at 3am.",
        editorial:
          "A cinema survives when the room matters as much as the screen.",
        news: "This is not a ban on movement. It is an invitation to move differently.",
        travel: "The best part of the road was the hour we had not planned.",
        recipe:
          "A good weeknight recipe leaves you with one pan and an idea worth repeating.",
        lifestyle: "Keep fewer things, but let every one earn its place.",
        photography: "Rain makes a second city beneath the first.",
        reviews:
          "The film remembers each gesture, even when its characters cannot.",
        company:
          "A status update describes the past. A decision changes the future.",
        changelog:
          "Speed is a feature when it gives attention back to the user.",
        tutorial: "Resilience begins with HTML that already means something.",
        portfolio:
          "Showing the rejected work made the final system easier to trust.",
        minimal: "Small is not a temporary condition.",
        newsletter: "Make enough room for the thought you did not schedule.",
        community: "Finished work gets applause. Unfinished work gets help.",
      } as Record<string, string>
    )[layout] ??
    "Attention is what turns an ordinary day into a remembered one."
  );
}

function articleCopy(layout: string) {
  const subject = articleSection(layout).toLowerCase();
  return [
    `Every story in ${subject} begins with a detail that looks too small to carry the whole piece. This one began there too, with a question that became more useful the longer we left it unanswered.`,
    "The obvious approach was faster, but it flattened the parts that made the subject specific. We kept the rough edges, followed the evidence, and let the structure emerge from what the material actually needed.",
    "The result is not a universal method. It is a record of one careful attempt, useful because the constraints remain visible and the reader can decide what belongs in their own work.",
  ];
}
