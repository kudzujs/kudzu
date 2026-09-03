# Add article search

Add an accessible client-side search to the `/articles/` route.

The page must keep its existing heading, introduction, navigation, article data, cards, links, metadata, and styling. Add one visibly labeled search input with the accessible name `Search articles`. As the visitor types, filter the existing seeded articles case-insensitively when the query occurs in either the article title or topic. Ignore leading and trailing whitespace.

Show a live result summary with exact text `6 articles` initially and after clearing the input. Use the singular form `1 article` and otherwise use `<count> articles`. When no articles match, also show the visible text `No articles match your search.` Do not add a submit button, debounce, URL state, persistence, dependency, or server request.

Use ordinary framework-idiomatic TSX and preserve native links. Do not weaken the existing static routes or Kudzu's zero-JavaScript `/static/` sibling. Run `npm run build` before finishing.
