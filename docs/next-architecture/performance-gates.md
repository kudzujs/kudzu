# Performance And Output Gates

These gates apply to every Goal A patch and later optimization work.

## Output Parity

- Unaffected static routes emit complete HTML and zero JavaScript.
- Build-known route content remains in HTML rather than moving behind browser execution.
- Unused command, binding, list, effect, native, parameter, navigation, package-helper, and Worker capabilities remain absent.
- Route plans and `.kudzu/kudzu-plan.json` rewrites retain equivalent serializable meaning and deterministic ordering.
- Worker entries remain content-hashed, deterministic across unchanged builds, base-aware, and absent unless a rendered effect references them.
- Generated module paths, preload closure, CSS/assets, and navigation group assets change only deliberately.
- React and `react-router-dom` references never survive in build-executable or browser output.

## Behavioral Parity

- State setters remain logically synchronous with DOM commits batched at synchronous-turn boundaries.
- Bindings and conditions patch direct DOM without rerendering components.
- Keyed rows preserve retained identity and release state/effects/refs on removal.
- Dependency effects compare with `Object.is`, clean up before rerun, and reject stale writes.
- Document, layout, route, conditional, and keyed ownership dispose exactly once.
- Enhanced navigation preserves direct entry, reload, back/forward, base, query/hash, focus, scroll, head updates, native fallback, and stale-transition suppression.

## Measurement Protocol

For each planned patch:

1. Record source revision, OS/hardware, Node/npm, browser when applicable, fixture, and command.
2. Run one clean production warm-up followed by at least seven interleaved measured builds when comparing revisions.
3. Use rotating fresh browser profiles; increase samples when ranges overlap.
4. Record raw arrays, medians, raw/gzip bytes by artifact class, complete emitted file lists, and known limitations.
5. Compare representative static, command-only, binding/conditional, keyed-list, effect, Worker, runtime-parameter, and navigation routes.

## Review Thresholds

- Any unexpected deterministic byte or file-list change requires explanation.
- A repeatable browser median regression above 5% is material.
- Build-time changes above 5% are material when interleaved ranges establish the difference.
- Smaller changes still block when they violate zero-cost exclusion, determinism, identity, cleanup, or complete-HTML behavior.
- Cross-framework claims require matched content, behavior, accessibility, and explicit architecture caveats.

## Patch Gate

- [ ] Relevant focused tests pass.
- [ ] `npm run check` passes.
- [ ] `npm test` passes.
- [ ] Representative emitted file lists are compared.
- [ ] Raw/gzip deltas are recorded and explained.
- [ ] Browser ownership/navigation checks run when affected.
- [ ] No result is presented as a release until package version, release notes, and release process actually establish it.
