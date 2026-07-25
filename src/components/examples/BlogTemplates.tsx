import type { BlogExample } from "./BlogExamples";

export function renderBlogTemplate(blog: BlogExample) {
  switch (blog.layout) {
    case "developer":
      return Developer({ blog });
    case "editorial":
      return Editorial({ blog });
    case "news":
      return News({ blog });
    case "travel":
      return Travel({ blog });
    case "recipe":
      return Recipe({ blog });
    case "lifestyle":
      return Lifestyle({ blog });
    case "photography":
      return Photography({ blog });
    case "reviews":
      return Reviews({ blog });
    case "company":
      return Company({ blog });
    case "changelog":
      return Changelog({ blog });
    case "tutorial":
      return Tutorial({ blog });
    case "portfolio":
      return Portfolio({ blog });
    case "minimal":
      return Minimal({ blog });
    case "newsletter":
      return Newsletter({ blog });
    case "community":
      return Community({ blog });
    default:
      return Personal({ blog });
  }
}

function Personal({ blog }: { blog: BlogExample }) {
  return (
    <div className="tpl tpl-personal">
      <header>
        <a href="/example">← Examples</a>
        <span>FIELD NOTES · EST. 2019</span>
      </header>
      <main>
        <aside>
          <div>AM</div>
          <h2>Alex Morgan</h2>
          <p>
            Writer and observer in Edinburgh. Notes on work, place, and
            attention.
          </p>
          <a href="#about">About this journal</a>
        </aside>
        <section>
          <small>LATEST ENTRY · JULY 25</small>
          <h1>
            <a href={`/example/blog/${blog.slug}/demo/${blog.posts[0].slug}`}>
              What I learned
              <br />
              from a quiet year
            </a>
          </h1>
          <p className="personal-deck">
            A year without ambitious plans became an education in noticing what
            was already there.
          </p>
          <div className="personal-list">
            {blog.posts.slice(1).map((post) => (
              <article>
                <time>{post.meta}</time>
                <h2>
                  <a href={`/example/blog/${blog.slug}/demo/${post.slug}`}>
                    {post.title}
                  </a>
                </h2>
                <p>
                  Small observations collected slowly, without an algorithm
                  deciding what comes next.
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <footer>
        <span>Field Notes No. 84</span>
        <a href="#subscribe">Receive new entries by email →</a>
      </footer>
    </div>
  );
}

function Developer({ blog }: { blog: BlogExample }) {
  return (
    <div className="tpl tpl-developer">
      <header>
        <a href="/example">
          undefined<span>.blog</span>
        </a>
        <nav>
          <a href="#articles">/articles</a>
          <a href="#snippets">/snippets</a>
          <a href="#about">/about</a>
        </nav>
      </header>
      <main>
        <section className="dev-lead">
          <div>
            <span>FEATURED_POST</span>
            <h1>
              <a href={`/example/blog/${blog.slug}/demo/${blog.posts[0].slug}`}>
                Compilers are just
                <br />
                careful readers<span>_</span>
              </a>
            </h1>
            <p>
              A practical tour through ASTs, transforms, and why boring compiler
              passes usually win.
            </p>
            <a href={`/example/blog/${blog.slug}/demo/${blog.posts[0].slug}`}>
              readArticle() →
            </a>
          </div>
          <pre>
            <code>{`const result = source
  |> parse()
  |> transform()
  |> print()

// no magic required`}</code>
          </pre>
        </section>
        <section className="dev-feed" id="articles">
          <header>
            <span>RECENT_WRITING</span>
            <small>2 entries</small>
          </header>
          {blog.posts.slice(1).map((post, index) => (
            <article>
              <span>0{index + 1}</span>
              <div>
                <small>{index ? "DOM" : "JAVASCRIPT"}</small>
                <h2>
                  <a href={`/example/blog/${blog.slug}/demo/${post.slug}`}>
                    {post.title}
                  </a>
                </h2>
              </div>
              <code>{post.meta}</code>
            </article>
          ))}
        </section>
        <section className="dev-snippet" id="snippets">
          <span>SNIPPET_014</span>
          <code>const lessCode = bugs.filter(Boolean).length</code>
          <button>Copy</button>
        </section>
      </main>
    </div>
  );
}

function Editorial({ blog }: { blog: BlogExample }) {
  return (
    <div className="tpl tpl-editorial">
      <div className="edit-utility">
        <span>VOL. 08 · SUNDAY, JULY 25</span>
        <a href="/example">KUDZU EXAMPLES ↗</a>
      </div>
      <header>
        <button>MENU</button>
        <a href="#home">THE SUNDAY EDIT</a>
        <button>SEARCH</button>
      </header>
      <nav>
        <a href="#culture">Culture</a>
        <a href="#design">Design</a>
        <a href="#film">Film</a>
        <a href="#ideas">Ideas</a>
        <a href="#places">Places</a>
      </nav>
      <main>
        <section className="edit-lead">
          <a
            className="edit-lead-image"
            href={`/example/blog/${blog.slug}/demo/${blog.posts[0].slug}`}
            aria-label={blog.posts[0].title}
          />
          <article>
            <span>THE WEEKEND FEATURE</span>
            <h1>
              <a href={`/example/blog/${blog.slug}/demo/${blog.posts[0].slug}`}>
                {blog.posts[0].title}
              </a>
            </h1>
            <p>
              How small cinemas became the center of a new cultural movement,
              one restored screen at a time.
            </p>
            <footer>By Mara Bell · 12 min read</footer>
          </article>
        </section>
        <section className="edit-grid">
          {blog.posts.slice(1).map((post, index) => (
            <article>
              <div className={`edit-image edit-image-${index + 1}`} />
              <span>{index ? "SOUND" : "DESIGN"}</span>
              <h2>
                <a href={`/example/blog/${blog.slug}/demo/${post.slug}`}>
                  {post.title}
                </a>
              </h2>
              <p>A dispatch from the people shaping how we live now.</p>
            </article>
          ))}
          <aside>
            <strong>IN THIS ISSUE</strong>
            <ol>
              <li>New rituals for old cities</li>
              <li>The makers keeping repair alive</li>
              <li>A guide to listening well</li>
            </ol>
          </aside>
        </section>
      </main>
    </div>
  );
}

function News({ blog }: { blog: BlogExample }) {
  return (
    <div className="tpl tpl-news">
      <div className="news-utility">
        <span>Saturday, July 25, 2026</span>
        <strong>LIVE · 24°C SEOUL</strong>
        <a href="/example">Examples</a>
      </div>
      <header>
        <button>☰</button>
        <a href="#home">THE DAILY LEDGER</a>
        <button>Subscribe</button>
      </header>
      <nav>
        <a href="#world">World</a>
        <a href="#city">City</a>
        <a href="#business">Business</a>
        <a href="#science">Science</a>
        <a href="#arts">Arts</a>
      </nav>
      <div className="news-wire">
        <strong>BREAKING</strong>
        <span>Transit workers approve new agreement</span>
        <span>Wind advisory extended through Sunday</span>
      </div>
      <main>
        <section className="news-main">
          <article>
            <span>CITY HALL</span>
            <h1>
              <a href={`/example/blog/${blog.slug}/demo/${blog.posts[0].slug}`}>
                {blog.posts[0].title}
              </a>
            </h1>
            <p>The council voted 9–2 after months of public consultation.</p>
            <small>By Lena Ortiz · Updated 18 minutes ago</small>
          </article>
          <a
            className="news-photo"
            href={`/example/blog/${blog.slug}/demo/${blog.posts[0].slug}`}
            aria-label={blog.posts[0].title}
          />
          <aside>
            <strong>LATEST</strong>
            {blog.posts.slice(1).map((post) => (
              <article>
                <time>{post.meta}</time>
                <h2>
                  <a href={`/example/blog/${blog.slug}/demo/${post.slug}`}>
                    {post.title}
                  </a>
                </h2>
              </article>
            ))}
          </aside>
        </section>
        <section className="news-brief">
          <strong>MORNING BRIEFING</strong>
          <p>Five things to know before the day begins.</p>
          <a href={`/example/blog/${blog.slug}/demo/${blog.posts[1].slug}`}>
            Read the briefing →
          </a>
        </section>
      </main>
    </div>
  );
}

function Travel({ blog }: { blog: BlogExample }) {
  return (
    <div className="tpl tpl-travel">
      <header>
        <a href="#home">ELSEWHERE</a>
        <nav>
          <a href="#destinations">Destinations</a>
          <a href="#guides">Field guides</a>
          <a href="/example">Examples</a>
        </nav>
      </header>
      <main>
        <section className="travel-cover">
          <div>
            <span>FIELD GUIDE 014 · PORTUGAL</span>
            <h1>
              <a href={`/example/blog/${blog.slug}/demo/${blog.posts[0].slug}`}>
                {blog.posts[0].title}
              </a>
            </h1>
            <p>
              Volcanic paths, ocean weather, and taking the long way around.
            </p>
            <a href={`/example/blog/${blog.slug}/demo/${blog.posts[0].slug}`}>
              Explore Madeira →
            </a>
          </div>
          <aside>
            <strong>7 DAYS</strong>
            <span>12 PLACES</span>
            <span>1 SMALL CAR</span>
          </aside>
        </section>
        <section className="travel-recent" id="destinations">
          <header>
            <div>
              <span>RECENT JOURNEYS</span>
              <h2>Go somewhere slowly.</h2>
            </div>
            <a href={`/example/blog/${blog.slug}/demo/${blog.posts[1].slug}`}>
              View latest guide →
            </a>
          </header>
          <div>
            {blog.posts.slice(1).map((post, index) => (
              <article>
                <a
                  className={`travel-image travel-image-${index + 1}`}
                  href={`/example/blog/${blog.slug}/demo/${post.slug}`}
                >
                  <span>{index ? "JAPAN" : "MOROCCO"}</span>
                </a>
                <h3>
                  <a href={`/example/blog/${blog.slug}/demo/${post.slug}`}>
                    {post.title}
                  </a>
                </h3>
                <p>{index ? "3 days · City guide" : "6 days · Road trip"}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="travel-plan">
          <span>THE POCKET ITINERARY</span>
          <h2>48 hours with no reservations.</h2>
          <ol>
            <li>
              <time>08:00</time> Walk the old harbor
            </li>
            <li>
              <time>13:30</time> Lunch above the market
            </li>
            <li>
              <time>18:45</time> Follow the light west
            </li>
          </ol>
        </section>
      </main>
    </div>
  );
}

function Recipe({ blog }: { blog: BlogExample }) {
  return (
    <div className="tpl tpl-recipe">
      <header>
        <a href="#home">
          SALT <i>&</i> STEM
        </a>
        <nav>
          <a href="#recipes">Recipes</a>
          <a href="#seasonal">In season</a>
          <a href="#notes">Kitchen notes</a>
        </nav>
        <button>Find a recipe</button>
      </header>
      <main>
        <section className="recipe-cover">
          <a
            className="recipe-photo"
            href={`/example/blog/${blog.slug}/demo/${blog.posts[0].slug}`}
            aria-label={blog.posts[0].title}
          />
          <article>
            <span>WEEKNIGHT DINNER · 45 MIN</span>
            <h1>
              <a href={`/example/blog/${blog.slug}/demo/${blog.posts[0].slug}`}>
                {blog.posts[0].title}
              </a>
            </h1>
            <p>Deeply savory, pantry-friendly, and made in one wide pan.</p>
            <div>
              <span>
                <strong>4</strong> servings
              </span>
              <span>
                <strong>12</strong> ingredients
              </span>
              <span>
                <strong>Easy</strong> difficulty
              </span>
            </div>
            <a href={`/example/blog/${blog.slug}/demo/${blog.posts[0].slug}`}>
              Cook this recipe →
            </a>
          </article>
        </section>
        <section className="recipe-week">
          <header>
            <span>COOK THIS WEEK</span>
            <h2>Late summer, on the table.</h2>
          </header>
          <div>
            {blog.posts.slice(1).map((post, index) => (
              <article>
                <a
                  className={`recipe-image recipe-image-${index + 1}`}
                  href={`/example/blog/${blog.slug}/demo/${post.slug}`}
                  aria-label={post.title}
                />
                <small>
                  {index ? "BAKING · 1 HOUR" : "ESSENTIALS · 20 MIN"}
                </small>
                <h3>
                  <a href={`/example/blog/${blog.slug}/demo/${post.slug}`}>
                    {post.title}
                  </a>
                </h3>
              </article>
            ))}
          </div>
        </section>
        <aside className="recipe-pantry">
          <strong>FROM THE PANTRY</strong>
          <span>Tomatoes</span>
          <span>Lemons</span>
          <span>Tahini</span>
          <span>Chickpeas</span>
          <a href={`/example/blog/${blog.slug}/demo/${blog.posts[1].slug}`}>
            Browse recipes →
          </a>
        </aside>
      </main>
    </div>
  );
}

function Lifestyle({ blog }: { blog: BlogExample }) {
  return (
    <div className="tpl tpl-lifestyle">
      <header>
        <button>Menu</button>
        <a href="#home">SOFT HOURS</a>
        <button>Search</button>
      </header>
      <p className="life-tagline">A considered guide to everyday life</p>
      <main>
        <section className="life-cover">
          <a
            className="life-cover-image"
            href={`/example/blog/${blog.slug}/demo/${blog.posts[0].slug}`}
            aria-label={blog.posts[0].title}
          />
          <article>
            <span>THE SUNDAY ROUTINE</span>
            <h1>
              <a href={`/example/blog/${blog.slug}/demo/${blog.posts[0].slug}`}>
                {blog.posts[0].title}
              </a>
            </h1>
            <p>Small rituals that make home feel calm, useful, and your own.</p>
            <a href={`/example/blog/${blog.slug}/demo/${blog.posts[0].slug}`}>
              Read the story
            </a>
          </article>
        </section>
        <section className="life-grid">
          <article>
            <div className="life-image life-image-1" />
            <small>WARDROBE</small>
            <h2>
              <a href={`/example/blog/${blog.slug}/demo/${blog.posts[1].slug}`}>
                {blog.posts[1].title}
              </a>
            </h2>
          </article>
          <blockquote>
            “Keep fewer things, but let every one earn its place.”
          </blockquote>
          <article>
            <div className="life-image life-image-2" />
            <small>AT HOME</small>
            <h2>
              <a href={`/example/blog/${blog.slug}/demo/${blog.posts[2].slug}`}>
                {blog.posts[2].title}
              </a>
            </h2>
          </article>
        </section>
        <section className="life-edit">
          <span>THE EDIT</span>
          <h2>
            <a href={`/example/blog/${blog.slug}/demo/${blog.posts[1].slug}`}>
              Five objects for a slower morning
            </a>
          </h2>
          <div>
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </section>
      </main>
    </div>
  );
}

function Photography({ blog }: { blog: BlogExample }) {
  return (
    <div className="tpl tpl-photography">
      <header>
        <a href="#home">
          SILVER
          <br />
          GRAIN
        </a>
        <span>PHOTOGRAPHS BY NOAH KIM</span>
        <nav>
          <a href="#series">Series</a>
          <a href="#archive">Archive</a>
          <a href="/example">Index ↗</a>
        </nav>
      </header>
      <main>
        <section className="photo-cover">
          <a href={`/example/blog/${blog.slug}/demo/${blog.posts[0].slug}`}>
            <figure>
              <span>01 / 07</span>
            </figure>
          </a>
          <aside>
            <small>PHOTO ESSAY · SEOUL</small>
            <h1>
              <a href={`/example/blog/${blog.slug}/demo/${blog.posts[0].slug}`}>
                {blog.posts[0].title}
              </a>
            </h1>
            <p>
              Neon reflected in wet pavement, the hour after everyone has gone
              home.
            </p>
          </aside>
        </section>
        <section className="photo-story">
          <a href={`/example/blog/${blog.slug}/demo/${blog.posts[1].slug}`}>
            <figure className="photo-story-1" />
          </a>
          <a href={`/example/blog/${blog.slug}/demo/${blog.posts[2].slug}`}>
            <figure className="photo-story-2" />
          </a>
          <blockquote>“Rain makes a second city beneath the first.”</blockquote>
          <figure className="photo-story-3" />
        </section>
        <footer>
          <span>Next series</span>
          <a href={`/example/blog/${blog.slug}/demo/${blog.posts[1].slug}`}>
            Atlantic light →
          </a>
        </footer>
      </main>
    </div>
  );
}

function Reviews({ blog }: { blog: BlogExample }) {
  return (
    <div className="tpl tpl-reviews">
      <header>
        <a href="#home">MARGIN</a>
        <nav>
          <a href="#books">Books</a>
          <a href="#film">Film</a>
          <a href="#music">Music</a>
        </nav>
        <button>Newsletter</button>
      </header>
      <main>
        <section className="review-cover">
          <div>
            <span>FILM OF THE WEEK</span>
            <strong>9.2</strong>
          </div>
          <article>
            <h1>
              <a href={`/example/blog/${blog.slug}/demo/${blog.posts[0].slug}`}>
                {blog.posts[0].title}
              </a>
            </h1>
            <p>
              An exacting story about memory, repetition, and what a city asks
              us to forget.
            </p>
            <footer>
              <span>Directed by Mina Park</span>
              <span>124 min</span>
              <span>Drama</span>
            </footer>
          </article>
        </section>
        <section className="review-latest">
          <header>
            <h2>Latest criticism</h2>
            <div>
              <button>All</button>
              <button>Books</button>
              <button>Film</button>
            </div>
          </header>
          {blog.posts.slice(1).map((post, index) => (
            <article>
              <span>{index ? "BOOK" : "FILM"}</span>
              <div>
                <small>{index ? "8.7" : "★★★★☆"}</small>
                <h3>
                  <a href={`/example/blog/${blog.slug}/demo/${post.slug}`}>
                    {post.title}
                  </a>
                </h3>
                <p>Sharp, patient criticism without the plot summary.</p>
              </div>
            </article>
          ))}
        </section>
        <aside className="review-ranked">
          <strong>MOST DISCUSSED</strong>
          <ol>
            <li>The year in small films</li>
            <li>What translation leaves behind</li>
            <li>Against the ending explained</li>
          </ol>
        </aside>
      </main>
    </div>
  );
}

function Company({ blog }: { blog: BlogExample }) {
  return (
    <div className="tpl tpl-company">
      <header>
        <a href="#home">
          <i />
          NORTHSTAR
        </a>
        <nav>
          <a href="#product">Product</a>
          <a href="#customers">Customers</a>
          <a href="#resources">Resources</a>
          <a href="#company">Company</a>
        </nav>
        <button>Start free</button>
      </header>
      <main>
        <section className="company-hero">
          <div>
            <span>NORTHSTAR INSIGHTS</span>
            <h1>Useful thinking for growing teams.</h1>
            <p>Research, customer stories, and practical operating systems.</p>
          </div>
          <aside>
            <strong>12k+</strong>
            <span>teams learning together</span>
          </aside>
        </section>
        <section className="company-feature">
          <div>
            <span>FIELD GUIDE 06</span>
          </div>
          <article>
            <small>OPERATIONS · 11 MIN</small>
            <h2>
              <a href={`/example/blog/${blog.slug}/demo/${blog.posts[0].slug}`}>
                {blog.posts[0].title}
              </a>
            </h2>
            <p>
              A framework for replacing status meetings with decisions people
              can trust.
            </p>
            <a href={`/example/blog/${blog.slug}/demo/${blog.posts[0].slug}`}>
              Read the field guide →
            </a>
          </article>
        </section>
        <section className="company-grid">
          {blog.posts.slice(1).map((post, index) => (
            <article>
              <span>{index ? "COMPANY" : "CUSTOMER STORY"}</span>
              <h3>
                <a href={`/example/blog/${blog.slug}/demo/${post.slug}`}>
                  {post.title}
                </a>
              </h3>
              <p>Specific lessons from teams doing the work.</p>
              <a href={`/example/blog/${blog.slug}/demo/${post.slug}`}>
                Read more →
              </a>
            </article>
          ))}
        </section>
        <section className="company-letter">
          <div>
            <span>THE NORTHSTAR BRIEF</span>
            <h2>One useful operating idea, every other Thursday.</h2>
          </div>
          <button>Join 18,000 readers</button>
        </section>
      </main>
    </div>
  );
}

function Changelog({ blog }: { blog: BlogExample }) {
  return (
    <div className="tpl tpl-changelog">
      <aside>
        <a href="#home">
          <i />
          SHIPLOG
        </a>
        <nav>
          <a className="active" href="#updates">
            Product updates
          </a>
          <a href="#roadmap">Roadmap</a>
          <a href="#api">API status</a>
          <a href="/example">Examples ↗</a>
        </nav>
        <footer>
          <span /> All systems operational
        </footer>
      </aside>
      <main>
        <header>
          <div>
            <span>PRODUCT CHANGELOG</span>
            <h1>What we shipped.</h1>
          </div>
          <button>Follow updates</button>
        </header>
        <div className="change-filter">
          <button>All updates</button>
          <button>New</button>
          <button>Improved</button>
          <button>Fixed</button>
        </div>
        <section className="change-list">
          {blog.posts.map((post, index) => (
            <article>
              <time>
                <strong>2026</strong>JUL{" "}
                {String(25 - index * 7).padStart(2, "0")}
              </time>
              <div>
                <span className={index ? "improved" : "new"}>
                  {index ? "IMPROVED" : "NEW"}
                </span>
                <small>VERSION 2.{8 - index}</small>
                <h2>
                  <a href={`/example/blog/${blog.slug}/demo/${post.slug}`}>
                    {post.title}
                  </a>
                </h2>
                <p>
                  Smaller details, faster workflows, and fewer reasons to leave
                  the keyboard.
                </p>
                <ul>
                  <li>Keyboard navigation across every saved view</li>
                  <li>Faster results for large workspaces</li>
                </ul>
                <a
                  className="story-link"
                  href={`/example/blog/${blog.slug}/demo/${post.slug}`}
                >
                  Release notes →
                </a>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

function Tutorial({ blog }: { blog: BlogExample }) {
  return (
    <div className="tpl tpl-tutorial">
      <header>
        <a href="#home">OPEN LESSON</a>
        <nav>
          <a href="#courses">Courses</a>
          <a href="#notes">Notes</a>
          <a href="#about">About</a>
        </nav>
        <a href="/example">Examples ↗</a>
      </header>
      <main>
        <section className="lesson-cover">
          <div>
            <span>FREE COURSE · BEGINNER · 48 MIN</span>
            <h1>
              Build a website
              <br />
              that lasts.
            </h1>
            <p>
              A practical introduction to semantic HTML, resilient CSS, and
              necessary behavior.
            </p>
            <a
              className="story-link"
              href={`/example/blog/${blog.slug}/demo/${blog.posts[0].slug}`}
            >
              Start lesson one →
            </a>
          </div>
          <aside>
            <strong>3</strong>
            <span>lessons</span>
            <strong>1</strong>
            <span>small project</span>
          </aside>
        </section>
        <section className="lesson-progress">
          <div>
            <span>YOUR PROGRESS</span>
            <strong>0%</strong>
          </div>
          <i />
        </section>
        <ol className="lesson-list">
          {blog.posts.map((post, index) => (
            <li>
              <span>0{index + 1}</span>
              <div>
                <small>
                  {index ? "15 MIN · READING" : "18 MIN · PRACTICAL"}
                </small>
                <h2>
                  <a href={`/example/blog/${blog.slug}/demo/${post.slug}`}>
                    {post.title}
                  </a>
                </h2>
                <p>
                  {index
                    ? "Build on the previous lesson with one focused technique."
                    : "Start with the document before thinking about components."}
                </p>
              </div>
              <a
                className="story-link"
                href={`/example/blog/${blog.slug}/demo/${post.slug}`}
              >
                {index ? "Preview" : "Begin →"}
              </a>
            </li>
          ))}
        </ol>
        <aside className="lesson-teacher">
          <div>SK</div>
          <p>
            <strong>Taught by Sun Kim</strong>Designer and educator focused on
            the durable web.
          </p>
        </aside>
      </main>
    </div>
  );
}

function Portfolio({ blog }: { blog: BlogExample }) {
  return (
    <div className="tpl tpl-portfolio">
      <header>
        <a href="#home">WORK / IN / PROCESS</a>
        <span>INDEPENDENT DESIGN PRACTICE</span>
        <button>LET'S TALK ↗</button>
      </header>
      <main>
        <section className="work-hero">
          <span>CASE NOTES · 2024–26</span>
          <h1>
            Work, with the
            <br />
            thinking left in.
          </h1>
          <div>
            <p>
              Identity, editorial, and digital projects documented from first
              question to final outcome.
            </p>
            <i>SCROLL TO EXPLORE ↓</i>
          </div>
        </section>
        <section className="work-list">
          {blog.posts.map((post, index) => (
            <article>
              <header>
                <span>0{index + 1}</span>
                <small>
                  {index === 0
                    ? "IDENTITY · 2026"
                    : index === 1
                      ? "DIGITAL ARCHIVE · 2025"
                      : "PACKAGING · 2024"}
                </small>
              </header>
              <a
                className={`work-visual work-visual-${index + 1}`}
                href={`/example/blog/${blog.slug}/demo/${post.slug}`}
              >
                <b>{index === 0 ? "PR" : index === 1 ? "ARCHIVE" : "OLIVA"}</b>
              </a>
              <footer>
                <h2>
                  <a href={`/example/blog/${blog.slug}/demo/${post.slug}`}>
                    {post.title}
                  </a>
                </h2>
                <a href={`/example/blog/${blog.slug}/demo/${post.slug}`}>
                  View case study ↗
                </a>
              </footer>
            </article>
          ))}
        </section>
        <section className="work-process">
          <strong>PROCESS, NOT POLISH</strong>
          <p>
            Each case note includes rejected directions, constraints, and what
            changed after launch.
          </p>
        </section>
      </main>
    </div>
  );
}

function Minimal({ blog }: { blog: BlogExample }) {
  return (
    <div className="tpl tpl-minimal">
      <main>
        <header>
          <h1>Plain Text</h1>
          <p>A small collection of dated thoughts by Eli Ward.</p>
          <nav>
            <a href="#writing">Writing</a>
            <a href="#about">About</a>
            <a href="/example">Examples</a>
          </nav>
        </header>
        <section className="minimal-feature">
          <time>25 July 2026</time>
          <h2>
            <a href={`/example/blog/${blog.slug}/demo/${blog.posts[0].slug}`}>
              On keeping a small website
            </a>
          </h2>
          <p>
            A website can be a room instead of a feed. It can have a front door,
            a few useful shelves, and no reason to measure who stayed.
          </p>
          <a href={`/example/blog/${blog.slug}/demo/${blog.posts[0].slug}`}>
            Continue reading
          </a>
        </section>
        <section className="minimal-list">
          <h3>Earlier</h3>
          {blog.posts.slice(1).map((post) => (
            <article>
              <time>{post.meta.split(" · ")[0]}</time>
              <a href={`/example/blog/${blog.slug}/demo/${post.slug}`}>
                {post.title}
              </a>
            </article>
          ))}
        </section>
        <footer>
          <span>RSS</span>
          <span>Colophon</span>
          <span>Last updated 25.07.26</span>
        </footer>
      </main>
    </div>
  );
}

function Newsletter({ blog }: { blog: BlogExample }) {
  return (
    <div className="tpl tpl-newsletter">
      <header>
        <a href="#home">GOOD MONDAY</a>
        <span>ONE THOUGHTFUL EMAIL, EVERY MONDAY</span>
        <a href="/example">ARCHIVE ↗</a>
      </header>
      <main>
        <section className="letter-signup">
          <span>JOIN 12,840 CURIOUS PEOPLE</span>
          <h1>
            Start the week with
            <br />a better question.
          </h1>
          <p>
            A short letter about creative work, useful habits, and ideas worth
            carrying into Monday.
          </p>
          <form>
            <input
              type="email"
              placeholder="you@example.com"
              aria-label="Email address"
            />
            <button type="submit">Subscribe free</button>
          </form>
          <small>No growth hacks. Leave whenever you like.</small>
        </section>
        <section className="letter-current">
          <header>
            <span>ISSUE 048 · JULY 20, 2026</span>
            <strong>6 MIN READ</strong>
          </header>
          <h2>
            <a href={`/example/blog/${blog.slug}/demo/${blog.posts[0].slug}`}>
              The useful kind of quiet
            </a>
          </h2>
          <p>
            Silence is not the absence of work. Sometimes it lets the right work
            become visible.
          </p>
          <blockquote>
            Make enough room for the thought you did not schedule.
          </blockquote>
          <a href={`/example/blog/${blog.slug}/demo/${blog.posts[0].slug}`}>
            Read issue 048 →
          </a>
        </section>
        <section className="letter-archive">
          <h2>Previous issues</h2>
          {blog.posts.slice(1).map((post, index) => (
            <article>
              <span>ISSUE 0{47 - index}</span>
              <h3>
                <a href={`/example/blog/${blog.slug}/demo/${post.slug}`}>
                  {post.title}
                </a>
              </h3>
              <a href={`/example/blog/${blog.slug}/demo/${post.slug}`}>
                Read →
              </a>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

function Community({ blog }: { blog: BlogExample }) {
  return (
    <div className="tpl tpl-community">
      <header>
        <a href="#home">
          <i />
          COMMON THREAD
        </a>
        <nav>
          <a href="#feed">Feed</a>
          <a href="#topics">Topics</a>
          <a href="#members">Members</a>
        </nav>
        <div>
          <button>Search</button>
          <button>Join community</button>
        </div>
      </header>
      <main>
        <section className="community-hero">
          <div className="community-faces">
            <span>AL</span>
            <span>MK</span>
            <span>JR</span>
            <span>SK</span>
            <span>+42</span>
          </div>
          <h1>
            Good ideas grow
            <br />
            in public.
          </h1>
          <p>
            Questions, projects, and field notes from an independent creative
            community.
          </p>
          <div>
            <strong>2,481</strong> members <strong>184</strong> online today
          </div>
        </section>
        <div className="community-columns">
          <section className="community-feed" id="feed">
            <header>
              <h2>Today in the community</h2>
              <button>Latest⌄</button>
            </header>
            {blog.posts.map((post, index) => (
              <article>
                <span>{["AL", "MK", "JR"][index]}</span>
                <div>
                  <small>
                    {["Alex Lee", "Mika Khan", "June Rivera"][index]} ·{" "}
                    {post.meta}
                  </small>
                  <h3>
                    <a href={`/example/blog/${blog.slug}/demo/${post.slug}`}>
                      {post.title}
                    </a>
                  </h3>
                  <p>
                    {index
                      ? "A field note with references, rough edges, and room for a better answer."
                      : "Share the thing on your desk, in your garden, or in your editor right now."}
                  </p>
                  <footer>
                    <span>♡ {18 + index * 7}</span>
                    <a href={`/example/blog/${blog.slug}/demo/${post.slug}`}>
                      ▢ {6 + index * 3} replies
                    </a>
                  </footer>
                </div>
              </article>
            ))}
          </section>
          <aside className="community-topics" id="topics">
            <h2>Popular topics</h2>
            <a href="#topic">
              # work-in-progress <span>84</span>
            </a>
            <a href="#topic">
              # small-tools <span>61</span>
            </a>
            <a href="#topic">
              # local-groups <span>43</span>
            </a>
            <a href="#topic">
              # feedback <span>38</span>
            </a>
            <div>
              <strong>WEEKLY PROMPT</strong>
              <p>What did you remove this week?</p>
              <button>Join the prompt</button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
