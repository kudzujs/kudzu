# Content search acceptance contract

## Scope

This contract applies identically to `starters/kudzu` and `starters/react-vite`. The only requested product change is the bounded `/articles/` title/topic search described in `prompt.md`. A solution may use framework-idiomatic implementation details, but may not change seeded data, routes, visible copy, navigation, or accessibility to obtain a smaller result.

## Install and build

- Run `npm ci` from the starter root with the committed `package-lock.json`; it must exit successfully without changing dependency resolution.
- Run `npm run build`; it must exit successfully with no TypeScript or production-build error.
- The build must emit these directly addressable documents: `/`, `/articles/`, `/articles/designing-for-failure/`, `/articles/shipping-less-javascript/`, `/articles/content-that-lasts/`, `/articles/accessible-by-default/`, `/articles/measuring-what-matters/`, `/articles/calm-release-notes/`, `/topics/performance/`, `/about/`, and `/static/`.
- No source file may import a package that is not present in that starter's lockfile.
- The feature must not add a dependency or make a network request.

## Existing application

- Every route loads without an uncaught browser exception or failed same-origin production asset request.
- Every route has exactly one visible `h1`, a `header`, a `nav` named `Primary`, and a `main` landmark.
- Header links named `Field Notes`, `Articles`, `Performance`, and `About` use native anchors and reach `/`, `/articles/`, `/topics/performance/`, and `/about/` respectively.
- `/` shows the heading `Engineering notes for durable products`, the `Latest notes` section, and all six seeded article titles.
- `/topics/performance/` shows exactly the three article links `Shipping less JavaScript`, `Measuring what matters`, and `Calm release notes`.
- `/about/` shows the heading `About Field Notes` and the text `Field Notes is an independent publication for teams building software that has to last.`
- `/static/` shows the heading `A quiet corner of the web` and remains readable through native navigation.
- `/articles/designing-for-failure/` shows the title, byline `Mara Bell · May 14, 2026 · 7 min read`, the heading `Make recovery a product path`, the code text `retry({ preserveInput: true })`, and a link named `Browse performance notes`.
- Each article card is an `article`, has a linked `h2`, and retains its authored date, excerpt, topic, and reading-time text.
- Decorative brand SVG output is hidden from assistive technology.

## Search behavior

- On direct entry to `/articles/`, a visible label is programmatically associated with one `input[type="search"]` whose accessible name is exactly `Search articles`.
- The initial list contains six article cards in the authored order and the live summary text is exactly `6 articles`.
- Typing `failure` leaves exactly `Designing for failure`; the summary is exactly `1 article`.
- Typing `PERFORMANCE` leaves exactly `Shipping less JavaScript`, `Measuring what matters`, and `Calm release notes`, in authored order; the summary is exactly `3 articles`.
- Typing `  accessibility  ` leaves exactly `Accessible by default`; matching is case-insensitive and trims outer whitespace.
- Typing `no such note` leaves zero article cards, keeps the summary `0 articles`, and shows `No articles match your search.`
- Clearing the input restores all six cards in authored order and the summary `6 articles` without navigation or reload.
- Search updates after ordinary keyboard input and does not require form submission.

## Accessibility

- The result summary has `aria-live="polite"`.
- The empty result message is visible text and is not the input placeholder.
- The search input is keyboard focusable and retains focus while results update.
- Heading order on `/articles/` is one `h1` followed by article-title `h2` elements; filtering must not introduce a second `h1` or skip to a deeper card heading.
- Search does not replace anchors with click-only controls and does not remove visible focus styles.

## Output assertions

- Kudzu's built `/articles/index.html` contains the complete initial heading, search label, live summary, and all six article titles before JavaScript executes.
- Kudzu's built `/static/index.html` contains no `script` element, no module preload, no Kudzu state marker, and references no `.js` asset; loading `/static/` requests zero JavaScript.
- Kudzu's search capability is owned by `/articles/`; `/`, article detail routes, `/topics/performance/`, `/about/`, and `/static/` remain complete static HTML and do not gain search JavaScript.
- React + Vite may ship and execute its normal React runtime. Its production build must not replace the seeded content with fetched data or add a second application/runtime dependency.
- Both builds retain the shared stylesheet and native route URLs. Generated source maps, analytics, service workers, hydration shims, and client routers are neither required nor accepted as substitutes for the feature.
