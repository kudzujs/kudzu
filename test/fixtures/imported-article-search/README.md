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

## r5 Follow-Up

The first `apply_patch` at line 35 of r5 `content-kudzu-1/adapter.stdout`
retains `normalizedQuery` but consumes `filteredArticles.length` directly in JSX.
Unlike the three original variants, it throws `query.trim is not a function`
because no count declaration registers the normalized query for build-value
lowering. The fourth `direct alias count` variant reproduces that failure and
must now emit the same JavaScript and pass the same Chrome journey.

The static topic test reduces the unchanged starter's
`src/pages/topics/performance.tsx:13` imported-array `filter().map()` into the same
relative card/data fixture. Previously it emitted list state, scripts, and even
the excluded article in its serialized seed. It now emits only the matching
HTML, with no script, state marker, or JavaScript artifact. Only direct imported
pipelines with no selector-state dependency and no collection alias take this
build-time path; reactive selectors retain keyed ownership and its diagnostics.

The raw batch is
`test-results/ai-delivery-production/0.21.4-gpt-5.6-sol-r5-kudzu-0.16.24-20260907-01/`.
The neighboring `test/realtime-version-ref.test.mjs` separately reduces r5
realtime attempts 0/3 (correctly rejected missing cleanup) and 1 (render-written
null ref now rejected instead of accepted as a DOM ref). It does not authorize
cross-invocation mutable-ref support or change historical benchmark scores.
