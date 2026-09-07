# Imported Article Search Regression

Reduced from the first search patch in
`test-results/ai-delivery-production/0.21.4-gpt-5.6-sol-r3-kudzu-0.16.23-continuation-20260907/content/attempts/content-kudzu-0/adapter.stdout`
(the `apply_patch` event on line 50). This is generated application evidence,
not an independent upstream application or a fresh AI benchmark.

The fixture preserves the relative immutable article import, ordinary relative
`ArticleCard`, primitive query state, normalized query local, filtered collection
local, `.length` count, pluralized live status, empty conditional, and keyed map.
The dataset and presentation are reduced; no imperative DOM workaround is used.

Before the fix, the aliased source fails at `src/pages/index.tsx:8:28` with
`Reactive JSX local expressions cannot call arbitrary functions`. The direct
`const resultCount = articles.filter(...query.trim()...).length` variant reaches
build execution and throws `TypeError: query.trim is not a function`.

Run `KUDZU_REQUIRE_CHROME=1 node --test test/imported-article-search.test.mjs`.
The test builds isolated copies of the original aliased shape, the direct-count
shape, and the previously supported fully inlined control. All three must emit
byte-identical JavaScript paths/content and complete initial HTML. Chrome checks
title/topic search, case/whitespace normalization, pluralized counts, empty-state
mount/removal, retained row identity, and fresh rows after removal. The static
sibling must contain neither scripts nor Kudzu ownership markers.

The reduction reuses imported collection discovery, pure selector `DerivedIR`,
existing binding descriptors, and keyed/conditional ownership. Build scratch
evaluates count dependencies from signal build values; the browser does not
retain components or a new evaluator. Mutable query aliases, arbitrary calls,
local cycles, escaped collections, mutating sort, and aliases capturing state
shadowed by predicate parameters remain source-located errors. This packet does
not authorize general callback/local graphs, computed collection fields, or a
runtime/API extension. No effect or resource cleanup behavior is added here.
