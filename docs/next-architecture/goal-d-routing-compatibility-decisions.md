# Goal D: Routing Compatibility Decisions

## Status

Preserve the current model. Goal D records decisions; it does not authorize a new router.

## Current Decision

Every emitted route is a complete HTML document. Native document navigation is the default. `kudzu.config` may explicitly group emitted routes sharing one layout identity for same-document enhancement; routes outside a group, cross-group links, unsupported matches, modified clicks, downloads, external links, failures, and redirects retain or fall back to native behavior.

Supported React Router-shaped migration remains narrow:

- static root-relative `Link` lowers to a base-prefixed native `<a>`;
- bracket runtime routes may lower direct `useParams()` to the pathname reader;
- top-level direct `useSearchParams()` reads/writes lower to URL signals and native history;
- direct nested `useNavigate()` calls lower to native `location.assign()` or `location.replace()`;
- no React Router package executes in build output or the browser.

## Enhanced Navigation Contract

[`framework/navigation-runtime.js`](../../framework/navigation-runtime.js) receives one generated record set per configured group. It:

- intercepts only eligible same-origin group anchors;
- prefetches complete HTML into a finite link-derived cache;
- validates application, layout, route markers, and same-origin capability assets;
- disposes route ownership before replacing the marked route range;
- retains layout ownership for the group session;
- initializes pathname/search state before route effects mount;
- updates history, managed head elements, focus, scroll, and live status;
- aborts/suppresses superseded transitions and falls back to native navigation on failure.

No fragment protocol, route component registry, browser route render, or application-wide router is implied.

## React Islands Decision

React islands remain blocked under current invariants. An island requires React execution, hydration or client rendering, a retained component tree, duplicated ownership semantics, and non-capability-specific runtime bytes. That conflicts with zero JavaScript for static routes, direct DOM ownership, compiler-specialized handlers/effects, and the prohibition on React/VDOM/hydration.

Do not add an `island`, `client:*`, hydration boundary, serialized props protocol, or React package exception. Reconsideration requires an explicit product-invariant change, not a routing compatibility patch.

## Revisit Evidence

Routing behavior may be reconsidered only when a real migration fixture proves that complete documents plus native anchors and current opt-in groups cannot meet required behavior. The proposal must cover direct entry, reload, back/forward, base paths, query/hash, accessibility, failure fallback, ownership cleanup, static-route output, and route-specific bytes.

## Continuation Checklist

- [ ] Preserve complete route HTML during Goal A.
- [ ] Keep navigation group configuration explicit and validated.
- [ ] Compare exact/runtime route matching and overlap diagnostics after generator changes.
- [ ] Verify ungrouped and cross-group links remain native.
- [ ] Verify route cleanup precedes replacement and layout cleanup occurs on non-persisted exit.
- [ ] Reject islands or SPA routing unless product invariants are explicitly changed first.
