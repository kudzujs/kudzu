# Apache Answer search-page reduction

This fixture reduces the repeated `const curPage =
Number(urlSearchParams.get("page")) || 1` pagination source from Apache Answer at
`3b9f1370612e690a0b7f230f05e688930db4c6d3` (Apache-2.0). The nullable query
signal remains route-owned while primitive number conversion and the finite
fallback reuse Kudzu's existing reactive-expression evaluator.
