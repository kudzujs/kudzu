# Apache Answer useMatch reduction

This fixture reduces `ui/src/pages/Questions/index.tsx` from Apache Answer at
`3b9f1370612e690a0b7f230f05e688930db4c6d3` (Apache-2.0). The original component
directly initializes `const isIndexPage = useMatch("/")` and uses its truthiness
to select the index title and slogan. Two Kudzu pages reuse one relative
component so matching remains route-specific without an SPA router.
