# Add article search

Add an accessible client-side search to the `/articles/` route.

The page must keep its existing heading, introduction, navigation, article data, cards, links, metadata, and styling. Add one visibly labeled search input with the accessible name `Search articles`. As the visitor types, filter the existing seeded articles case-insensitively when the query occurs in either the article title or topic. Ignore leading and trailing whitespace.

Show a live result summary with exact text `6 articles` initially and after clearing the input. Use the singular form `1 article` and otherwise use `<count> articles`. The summary must be in an `aria-live="polite"` region. When no articles match, also show the visible text `No articles match your search.` The count and empty message may share that region or use separate elements. Do not add a submit button, debounce, URL state, persistence, dependency, or server request.

Use ordinary framework-idiomatic TSX and preserve native links. Do not weaken the existing static routes or Kudzu's zero-JavaScript `/static/` sibling. In Kudzu, `/`, every article detail route, `/topics/performance/`, `/about/`, and `/static/` must remain complete static HTML with no scripts, module preloads, state markers, or JavaScript asset references; only `/articles/` owns the search capability. React + Vite may retain its normal runtime on these routes. Run `npm run build` before finishing.
