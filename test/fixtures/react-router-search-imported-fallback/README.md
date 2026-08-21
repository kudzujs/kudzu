# Apache Answer imported search fallback reduction

This fixture reduces Apache Answer's `const curOrder =
(urlSearchParams.get("order") || QUESTION_ORDER_KEYS[0]) as
Type.QuestionOrderBy` source at
`3b9f1370612e690a0b7f230f05e688930db4c6d3` (Apache-2.0). The fallback is a
static element of a named relative JSON-safe immutable array.
