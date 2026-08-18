# Kudzu Releases

## 0.8.61 - Parameterized debounce hooks

Kudzu 0.8.61 compiles the common relative `useDebounce(state, literalDelay)` custom-hook shape through existing state and effect ownership.

### Changed in 0.8.61

- A named or default relative synchronous hook may accept one direct primitive state value and one numeric literal delay.
- The hook may initialize one state from that value, own one timeout dependency effect with exact cleanup, and directly return the debounced state.
- The compiler preserves the source signal dependency, treats the literal delay as stable scope, and initializes the debounced signal from the source signal's build value.

### Boundaries

- The hook body must be the direct `useState(value)`, `useEffect()`, and returned-state shape proven by the ClimateCompatibleGrowth fixture.
- Dynamic delays, non-primitive source state, aliases, additional statements/effects, intervals, and missing timeout cleanup remain rejected.
- No debounce/timer runtime, component tree, hydration, or new effect capability is added.

### Validation

- A fixture reduced from ClimateCompatibleGrowth's MIT-licensed `useDebouce.ts` preserves its generic parameterized custom-hook source shape.
- Browser coverage proves rapid replacement, pending-timeout cleanup on conditional removal, fresh remount state, and latest-value commit.
- A static sibling remains zero JavaScript and dynamic delay input fails at its authored call site.
- `npm run check`, `npm test`, and `npm run test:package` pass with all 230 tests and 174 generated pages.

### Upgrade

```sh
npm install @kudzujs/core@^0.8.61
```

## 0.8.60 - Array draft effect sync

Kudzu 0.8.60 lets a specialized child synchronize direct prop-derived array draft state through the matching parent setter in an ordinary dependency effect.

### Changed in 0.8.60

- `useEffect(() => { setSelectedItems(items) }, [items, setSelectedItems])` compiles for the matching direct array prop-draft specialization.
- The compiler proves the parent state/setter pair, removes the stable setter dependency, and tracks the child array state through existing `Object.is` effect scheduling.
- Parent replacement still does not synchronize the independently owned child draft; the next authored child-state replacement reruns the effect.

### Boundaries

- The effect must be top-level, synchronous, inline, and contain exactly one direct setter call with exact `[state, setter]` dependencies.
- Setter aliases, composed values, mismatched parent state/setter pairs, cleanup, and additional callback uses remain rejected.
- Object and derived array dependencies remain unchanged; no runtime module, EffectIR kind, component tree, or automatic prop synchronization is added.

### Validation

- The ClimateCompatibleGrowth-derived dropdown now preserves its authored setter effect shape.
- Browser coverage proves initial setup, child replacement commit, independent parent reset, and effect rerun; a static sibling remains zero JavaScript.
- Existing effect ownership and object-dependency diagnostics remain covered.
- `npm run check`, `npm test`, and `npm run test:package` pass with all 228 tests and 174 generated pages.

### Upgrade

```sh
npm install @kudzujs/core@^0.8.60
```

## 0.8.59 - Array prop draft state

Kudzu 0.8.59 lets a specialized child initialize independent local array draft state directly from one parent array-state prop while preserving an authored direct `set*` setter prop.

### Changed in 0.8.59

- `const [draft, setDraft] = useState(selectedItems)` compiles when `selectedItems` is one direct prop backed by a parent `useState([...])` literal.
- A direct parent setter may enter that prop-draft specialization through an `on*` prop or an authored `set*` prop such as `setSelectedItems`.
- Parent and child retain distinct state IDs and independently serialized arrays.
- Mounted drafts remain local until the authored handler explicitly commits them to parent state.

### Boundaries

- `set*` support is limited to prop-derived state components; unrelated effect setter props retain their existing path.
- Additional forwarding remains `on*`-only.
- Aliases, property paths, array spreads, composed expressions, indirect callbacks, and automatic prop synchronization remain rejected.
- No runtime module, VDOM, hydration, or retained component tree is added.

### Validation

- A fixture reduced from ClimateCompatibleGrowth's MIT-licensed teaching-kit `Dropdown` preserves its direct `selectedItems` and `setSelectedItems` source shape.
- Browser coverage proves child draft independence, parent replacement without draft synchronization, explicit commit, and a static zero-JavaScript sibling.
- Existing conditional-effect `setResult` props remain outside setter-callback specialization.
- `npm run check`, `npm test`, and `npm run test:package` pass with all 225 tests and 174 generated pages.

### Upgrade

```sh
npm install @kudzujs/core@^0.8.59
```

## 0.8.58 - Keyed item draft state

Kudzu 0.8.58 lets a keyed row initialize independent local object draft state directly from its keyed item prop.

### Changed in 0.8.58

- `const [draft, setDraft] = useState(todo)` compiles when `todo` is the direct item prop of a keyed row.
- RouteIR marks the state with a narrow `list-item` initializer descriptor.
- New keys clone the current item into existing key-scoped row-state ownership without a component runtime.
- Retained keys preserve their draft state and DOM identity through item updates and reorder.

### Boundaries

- Removing a key releases its draft; re-adding that key creates a fresh draft from the current item.
- Aliases, property paths, composed expressions, and indirect item props remain rejected.
- This does not add prop-to-state synchronization, array prop drafts, a VDOM, hydration, or a retained component tree.
- Static sibling routes remain complete HTML with zero JavaScript.

### Validation

- The Todo reducer fixture proves independent row drafts, retained draft and DOM identity through reorder, exact removal, and fresh remount initialization.
- A dedicated alias fixture remains fail-closed with a source-located diagnostic.
- RouteIR records the `list-item` initializer and capability planning emits the existing complex row-state path only where required.
- `npm run check`, `npm test`, and `npm run test:package` pass with all 224 tests and 173 generated pages.

### Upgrade

```sh
npm install @kudzujs/core@^0.8.58
```

## 0.8.57 - Plain-object prop draft state

Kudzu 0.8.57 lets a specialized setter-callback child initialize independent local draft state directly from one parent state prop authored with a JSON-safe plain-object literal.

### Changed in 0.8.57

- `const [draft, setDraft] = useState(value)` compiles when `value` is one direct prop backed by a parent `useState({ ... })` literal.
- The existing parent SignalIR remains structural input while the child receives its own state slot and setter ownership.
- Direct primitive prop initialization and primitive-only zero-argument `.toString()` retain their existing behavior.
- The source compiler reuses its serializable literal proof; ModuleIR, RouteIR, runtime modules, and browser ABI are unchanged.

### Boundaries

- Parent arrays, aliases, property paths, composed expressions, lazy values, and object `.toString()` remain rejected.
- The callback must still follow the existing direct setter-callback specialization and three-boundary limit.
- This is an object-editor migration slice, not automatic prop-to-state synchronization or a general clone runtime.
- Static siblings remain complete HTML with zero JavaScript.

### Validation

- A FIRE-derived editor proves that changing the child object draft leaves the parent unchanged until the authored save callback commits it.
- Focused RouteIR coverage records separate, equal JSON-safe initial objects for parent and child ownership.
- A dedicated array-prop fixture remains fail-closed with a source diagnostic.
- `npm run check`, `npm test`, and `npm run test:package` pass with all 223 tests and 172 generated pages.

### Upgrade

```sh
npm install @kudzujs/core@^0.8.57
```

## 0.8.56 - Incremental affected-route development builds

Kudzu 0.8.56 keeps one project session alive during development so source edits recompile and rerender only the routes whose runtime graphs changed.

### Changed in 0.8.56

- The development server batches changed source paths and intersects them with current and prior per-page runtime graphs.
- Unaffected compiled `SourceResult` and pre-family route render records are reused across successful rebuilds.
- Every affected page recompiles its complete reachable graph so imported component specialization remains correct.
- Enhanced-navigation groups invalidate together to preserve shared layout function and ESM singleton identity.
- Generation-specific build-time module paths prevent stale Node ESM imports after both successful and failed builds.

### Safety

- Failed rebuilds retain the previous deployed output and carry every pending changed path into the next attempt.
- Added and removed source files refresh the session index and reachable source set.
- CSS, assets, and unknown source events conservatively invalidate every page.
- Production builds retain the existing complete staging, collision checks, `afterBuild()`, and rollback-safe promotion.
- No browser runtime, hydration layer, VDOM, retained component tree, or SPA router is added.

### Validation

- A focused independent-route fixture changes one route-owned helper and recompiles two of four modules while rerendering one of two pages.
- Its unaffected interactive route is reused, its static sibling remains zero JavaScript, and incremental deploy output is byte-identical to a fresh-process full build.
- Existing development error recovery, navigation groups, Workers, handlers, route families, and source-scale checks pass.
- `npm run check`, `npm test`, and `npm run test:package` pass with all 222 tests and 171 generated pages.

### Upgrade

```sh
npm install @kudzujs/core@^0.8.56
```

## 0.8.55 - Signature-keyed runtime families

Kudzu 0.8.55 replaces site-wide runtime specialization with deterministic capability families loaded only by the routes that require them.

### Changed in 0.8.55

- Equal standalone CapabilityIR signatures share one runtime family under `assets/runtime/<family>/`.
- Different route signatures emit isolated core, binding, list, effect, native, serialization, style, and selector modules.
- Route-specific parameter, effect, and native entries import their assigned family directly.
- Artifact report v2 records exact route signatures, assigned families, emitted family requirements, handlers, Workers, styles, and chunks.
- Development state restoration discovers the family core module from the rendered document.

### Navigation ownership

- Every enhanced-navigation group unions its route capabilities into one family.
- Persistent layout state, committers, mount hooks, unmount hooks, and native listeners retain one ESM singleton identity across group navigation.
- Independent groups may reuse byte-identical family files while keeping their own route matcher and layout/application identity modules.

### Output

- Static routes emit no runtime family and remain zero JavaScript.
- An unrelated standalone route capability no longer changes another route's loaded runtime bytes or cache URL.
- Legacy root-level `assets/kudzu*.js` runtime files are no longer emitted.
- No runtime loader, hydration layer, VDOM, component tree, or SPA router is added.

### Validation

- Focused tests cover signature deduplication, distinct capability isolation, deterministic IDs, navigation unions, static exclusion, shared handler/Worker chunks, and family-aware public collisions.
- Existing navigation, effect, list, native, parameter, Worker, base-path, development restoration, and browser ownership journeys pass.
- `npm run check`, `npm test`, and `npm run test:package` pass with all 221 tests and 170 generated pages.

### Upgrade

```sh
npm install @kudzujs/core@^0.8.55
```

## 0.8.54 - Inspectable route artifact closure

Kudzu 0.8.54 projects each validated route edge through the final handler and Worker bundle graphs into one inspectable artifact contract.

### Changed in 0.8.54

- `.kudzu/kudzu-artifacts.json` records every route in deterministic order.
- Each route receives its exact CapabilityIR manifest, SHA-256 signature, and required runtime families.
- Handler entry ownership derives from retained RouteBuildRecord references rather than HTML or filename inference.
- Handler and Worker esbuild metafiles are followed transitively to report route-owned and shared chunks.
- Chunks reached by multiple routes include a sorted reverse ownership list.
- `afterBuild()` receives the same JSON-safe report as `artifacts`.

### Boundaries

- The report distinguishes exact route runtime requirements from the currently site-specialized runtime files.
- Enhanced-navigation routes still share their existing ESM singleton and lifecycle boundary.
- Signature-keyed runtime emission remains the next route-closure slice.
- No runtime loader, manifest fetch, SPA router, or browser behavior is added.

### Validation

- Focused checks cover route-only and shared handler chunks, external-import exclusion, Worker ownership, shared Worker chunks, deterministic route order, and distinct capability signatures.
- `npm run check`, `npm test`, and `npm run test:package` pass with all 220 tests and 169 generated pages.

### Upgrade

```sh
npm install @kudzujs/core@^0.8.54
```

## 0.8.53 - Route-aware CSS closure

Kudzu 0.8.53 links source styles only from routes whose reachable TypeScript graph imports them.

### Changed in 0.8.53

- Relative CSS imports follow each page's runtime import and re-export graph in deterministic source order.
- RouteBuildRecord receives each route's exact source stylesheet URLs instead of one site-wide CSS list.
- `kudzu.config styles` remains explicitly global, deduplicated, and excluded from route-managed ownership.
- CSS `?url` imports emit downloadable assets without creating stylesheet links.
- Unimported source CSS is no longer implicitly linked; applications import route/layout styles or configure true globals.

### Enhanced navigation

- Navigable documents mark route-managed source styles separately from configured global links.
- Destination styles load before route cleanup and DOM replacement.
- Shared layout stylesheet links retain URL, DOM identity, and cascade order across navigation.
- Outgoing route styles are removed after successful preparation.
- Overlapping navigation cancels and rolls back provisional stylesheet transactions without disturbing the newer route.
- Invalid, duplicate, cross-origin, or failed managed stylesheets fall back to native document navigation.

### Migration evidence

- The React/Vite static sibling excludes the interactive app stylesheet while retaining zero JavaScript.
- Independent navigation groups exclude one another's layout and route styles.
- A delayed stylesheet browser test verifies cancellation rollback, shared-link identity, destination activation, and outgoing-link removal.
- Global style fixtures prove configured source/URL deduplication, while dynamic routes now import their intended CSS explicitly.
- The starter imports shared CSS through its common header so both generated routes reach the style intentionally.

### Output and performance

- Route HTML omits unrelated feature CSS and its cascade effects.
- Static pages remain JavaScript-free; only configured enhanced-navigation routes receive managed-style reconciliation.
- No CSS bundler, style runtime, SPA router, or new performance claim is added.

### Validation

- `npm run check`, `npm test`, and `npm run test:package` pass with all 219 tests and 168 generated pages.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.53
```

## 0.8.52 - Effect-private mutable refs

Kudzu 0.8.52 compiles component-authored mutable refs when one inline effect exclusively owns their complete lifecycle.

### Changed in 0.8.52

- Top-level `useRef(null)` and `useRef(0)` values lower when every direct `.current` reference belongs to one inline block-bodied effect setup, its nested callbacks, and cleanup.
- The compiler removes those component declarations and creates fresh mutable objects inside each effect setup invocation.
- Existing effect ownership handles dependency replacement, stale setter invalidation, conditional/keyed ownership, navigation, document disposal, and BFCache preservation.
- Animation-frame refs use the same invocation-private lowering while retaining exact scheduler, reset, and cancellation validation.
- JSX DOM refs remain component-owned; aliases, nonzero initializers, cross-effect/event use, missing cleanup invalidation, and escaped ref objects remain source-diagnosed.

### Migration evidence

- The E2B terminal fixture now preserves asynchronous generation invalidation, BFCache retain/resume, discard cleanup, and a static sibling without ResourceIR.
- A native WebSocket fixture verifies dependency replacement, listener removal, stale callback rejection, distinct connection ownership, and one close per connection.
- Mutable refs shared by multiple effects retain a focused source diagnostic.

### Output and performance

- Private refs stay inside existing route-specific effect handler ESM and are absent from build-time captures and RouteIR scope.
- Static sibling routes remain zero JavaScript.
- No ResourceIR record, component runtime, resource API, scheduler, or new performance claim is added.

### Validation

- `npm run check`, `npm test`, and `npm run test:package` pass with all 219 tests and 167 generated pages.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.52
```

## 0.8.51 - Owned effect package imports

Kudzu 0.8.51 lets inline owned effect setup and cleanup callbacks reference browser-only package imports directly.

### Changed in 0.8.51

- Direct package references are accepted inside inline `useEffect` setup callbacks and their directly returned inline cleanup functions.
- Existing package import records feed the route-specific effect handler ESM and package bundler.
- Build scratch replaces package-owning effect callbacks with inert functions because build-time rendering records ownership without executing effect code.
- Render-time, helper-indirect, mixed, side-effect, and dynamic package imports remain source-diagnosed.

### Output and performance

- Package code is retained only by routes whose effect graph references it.
- Build-time component modules and static sibling routes omit the package and its JavaScript.
- No package runtime, ResourceIR, public adapter API, or new performance claim is added.

### Validation

- `npm run check`, `npm test`, and `npm run test:package` pass with all 217 tests and 166 generated pages.
- A direct setup/cleanup fixture bundles TypeScript package data into one owned effect handler while its static sibling ships zero JavaScript.
- Focused negative fixtures retain diagnostics for render-time and helper-indirect package references.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.51
```

## 0.8.50 - Package-neutral shared state IR

Kudzu 0.8.50 contains reduced Zustand migration syntax behind package-neutral shared-state and action records before generic signal and handler consumers.

### Changed in 0.8.50

- ModuleIR v2 records JSON-safe `SharedStateIR` identities, fields, and initial values.
- `SharedActionIR` records reference their owning shared state through validated slots.
- HandlerIR records the shared actions used by route-specific native handlers.
- The Zustand adapter preserves package-specific source diagnostics while generic compiler and build-time rendering paths consume shared-state metadata.

### Output and performance

- Existing RouteIR layout state, functional action updates, same-turn behavior, and enhanced-navigation persistence remain unchanged.
- React, Zustand, subscriptions, and a generic store runtime remain absent from deploy output.
- No public store or compatibility-adapter API is added, and this release makes no new performance claim.

### Validation

- `npm run check`, `npm test`, and `npm run test:package` pass with all 215 tests and 165 generated pages.
- Focused ModuleIR tests validate JSON round-tripping and reject dangling shared-action state references.
- The maintained Zustand browser journey retains repeated same-turn updates, batched effects, layout identity, navigation persistence, and removal behavior.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.50
```

## 0.8.49 - Setter callback fan-out

Kudzu 0.8.49 lets one component forward the same destructured setter callback directly through multiple child component `on*` props.

### Changed in 0.8.49

- A specialized component may pass one callback prop directly to multiple child controls.
- Each child branch specializes independently to the original parent state signal.
- Fan-out composes with multiple direct intrinsic handlers within the existing three-boundary limit.
- Aliases, ordinary prop names, spreads, intermediate adapters, and a fourth callback boundary remain source-diagnosed.

### Output and performance

- Every leaf continues to emit its existing concrete state-operation descriptor.
- No callback registry, component runtime, browser runtime module, or public Kudzu API is added.
- This release makes no new performance claim.

### Validation

- `npm run check`, `npm test`, and `npm run test:package` pass with all 214 tests and 164 generated pages.
- A relative component fans one callback out to two child controls whose click descriptors target the same parent signal.
- Existing repeated-call and fourth-boundary negative fixtures retain their source diagnostics.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.49
```

## 0.8.48 - Multi-handler setter callbacks

Kudzu 0.8.48 lets one compiler-specialized setter-callback prop be called once from each of multiple direct intrinsic event handlers.

### Changed in 0.8.48

- A specialized leaf may call the same setter callback from multiple intrinsic `on*` attributes.
- Each handler call lowers independently to the same parent state signal.
- Direct callback forwarding through the existing three-boundary limit remains supported.
- Repeated calls inside one handler, aliases, non-handler uses, forwarding fan-out, and a fourth callback boundary remain source-diagnosed.

### Output and performance

- Command-only handlers continue to emit plain state-operation descriptors.
- No callback registry, component runtime, browser runtime module, or public Kudzu API is added.
- This release makes no new performance claim.

### Validation

- `npm run check`, `npm test`, and `npm run test:package` pass with all 213 tests and 163 generated pages.
- A positive fixture emits two independent click descriptors targeting the same parent signal.
- A focused negative fixture retains a source diagnostic for calling the callback twice inside one event handler.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.48
```

## 0.8.47 - Direct primitive prop state

Kudzu 0.8.47 lets a compiler-specialized setter-callback child initialize local state directly from one primitive parent state prop without a migration-only wrapper expression.

### Changed in 0.8.47

- `useState(value)` is accepted when `value` is a direct specialized prop linked to parent state with a proven primitive literal initializer.
- Build scratch reads the parent signal's initial primitive value while preserving the structural prop signal for handlers and effects.
- Existing direct `value.toString()` initialization remains supported for string input buffers.
- Composed expressions, aliases, and object/array state props remain source-diagnosed.

### Output and performance

- Parent and child retain independent state IDs and JSON-safe initial values.
- Handler specialization continues to target the same parent and child signals without a component runtime.
- No browser runtime module, public Kudzu API, or new performance claim is added.

### Validation

- `npm run check`, `npm test`, and `npm run test:package` pass with all 212 tests and 162 generated pages.
- A direct string-state prop emits complete initial input HTML and two matching RouteIR state seeds.
- Focused negative fixtures retain diagnostics for composed initializer expressions and object-state props.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.47
```

## 0.8.46 - Private Context action setters

Kudzu 0.8.46 lets relative Context-hook actions use Provider-owned setters without forcing those implementation-only setters into the authored Provider value or public Context type.

### Changed in 0.8.46

- An action-required setter may be omitted when its corresponding Provider state value remains exposed.
- Kudzu adds only the required setter fields to compiler build scratch so existing setter identity and HandlerIR lowering remain unchanged.
- Consumer scratch receives collision-free private bindings for action lowering without changing authored hook destructuring.
- Fully hidden action state and Provider setters exposed without their state remain source-diagnosed.

### Output and performance

- The Notes migration retains the same two RouteIR signals and concrete `notes` and `activeId` state operations.
- Context objects, Provider trees, action functions, and a setter registry remain absent from browser output; the static sibling remains zero JavaScript.
- No browser runtime module, public Kudzu API, or new performance claim is added.

### Validation

- `npm run check`, `npm test`, and `npm run test:package` pass with all 210 tests and 161 generated pages.
- The maintained Chrome Notes journey passes create, rename, select, delete, list identity, and active-note updates with authored setters omitted.
- Focused negative fixtures retain diagnostics for fully hidden action state, setter-only exposure, private captures, and indirect action references.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.46
```

## 0.8.45 - Plain TypeScript fast path

Kudzu 0.8.45 reduces large-project compiler work by sending proven plain `.ts` modules through TypeScript transpilation and relative ESM path rewriting without running Kudzu's TSX semantic transformer.

### Changed in 0.8.45

- The fast path is limited to `.ts` files whose runtime imports and exports are resolvable relative TypeScript modules.
- TSX, package imports, static assets, unresolved edges, and all uncertain module shapes retain the existing Kudzu transformer.
- `npm run benchmark:source-scale` deterministically generates 500 reachable modules and supports alternating baseline/candidate measurements with deploy-output equivalence checks.
- Compiler counters report the number of plain modules selected.

### Output and performance

- Seven alternating samples against clean `v0.8.44` reduced compile median from 2,323.9 ms to 1,413.2 ms (39.2%) and clean-build median from 3,325.3 ms to 2,382.4 ms (28.4%) on the maintained source-scale fixture.
- Compiler scratch decreased from 7,328,390 to 1,971,061 bytes and compile peak-RSS median decreased from 571.2 MiB to 552.6 MiB.
- Both targets emitted the same 50 HTML files, 10,980 deploy bytes, and SHA-256 digest. No browser runtime or public API changed.

### Validation

- `npm run check`, `npm test`, and `npm run test:package` pass with all 209 tests and 160 generated pages.
- A reduced deterministic source-scale run remains in the standard suite.
- The maintained benchmark alternates target order and rejects any deploy digest, file-count, page-count, or byte-count difference.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.45
```

## 0.8.44 - Collision-free Context actions

Kudzu 0.8.44 removes a compiler-only naming restriction from relative Context-hook actions: Provider state and setter fields needed privately by an action may now share names with ordinary consumer locals.

### Changed in 0.8.44

- Action-required Provider state/setter fields that are not publicly selected receive compiler-owned collision-free aliases in the consumer destructuring.
- The specialized action AST and its state map use the same aliases before existing HandlerIR lowering.
- Alias selection checks component parameters and top-level declarations and increments the compiler-owned suffix when necessary.
- Consumer source keeps its chosen local names and public hook destructuring; no application rename or extra Context field selection is required.
- Provider state identity, direct state operations, and existing Context action diagnostics remain unchanged.

### Output and performance

- Context action functions, Context objects, and Provider trees remain absent from browser output.
- Static siblings remain complete zero-JavaScript documents.
- No browser runtime module or public API changed. This release makes no new performance claim.

### Validation

- `npm run check`, `npm test`, and `npm run test:package` pass with all 208 tests and 158 generated pages.
- The maintained Notes Context fixture now declares a consumer-local `setNotes` while create, rename, delete, select, list identity, and active-note updates continue to pass in Chrome.
- A focused counter fixture previously rejected for consumer `setCount` collision now builds successfully.
- Private Provider captures, hidden state pairs, and indirect action references remain source-diagnosed.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.44
```

## 0.8.43 - Three-boundary callback ownership

Kudzu 0.8.43 extends ordinary React-shaped callback and ref composition through one more proven direct forwarding component without adding a callback registry, browser component tree, or runtime module.

### Changed in 0.8.43

- A direct setter or inline/simple `const` callback may cross a child component and two additional direct forwarding components before one intrinsic handler invokes it.
- Each forwarding component must destructure the callback and pass it directly exactly once as an `on*` JSX prop.
- Callback substitution now occurs after recursive component expansion, so each authored forwarding boundary is validated before the original parent callback is specialized into the leaf handler.
- Parent SignalIR, child state, effects, deterministic IDs, and parent/child object refs retain their existing ownership through the deeper tree.
- A fourth callback boundary, aliases, spreads, intermediate adapters, repeated callback uses, and dynamic hook paths remain fail-closed.

### Output and performance

- The forwarding components are specialized away and do not appear as retained browser functions.
- Static siblings remain complete zero-JavaScript documents.
- No browser runtime source or public API changed. This release makes no new build or cross-framework performance claim.

### Validation

- `npm run check`, `npm test`, and `npm run test:package` pass with all 208 tests and 157 generated pages.
- Chrome coverage proves parent callback updates, leaf local state/effects/IDs, mounted refs, conditional cleanup, null refs after removal, fresh remount state, and prop synchronization across three boundaries.
- Compiler-result checks retain the original parent signal through imported specialization and prove every forwarding component is erased from emitted JavaScript.
- A dedicated four-boundary fixture fails at the authored source location.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.43
```

## 0.8.42 - Large-route artifact sharing

Kudzu 0.8.42 reduces generated filesystem work for large static route sets and accelerates one proven hidden query form carry shape without adding a general runtime or changing the native-navigation default.

### Changed in 0.8.42

- Byte-identical native, parameter, and effect route-entry sources share the first generated route path and one emitted file within the current build.
- Existing single-route artifact URLs remain stable; deduplication is build-local and does not add a persistent or generalized cache.
- A read-only literal query shape bound only to matching hidden input `value` and `disabled` properties initializes those controls from `location.search` in a small inline script before deferred parameter ESM arrives.
- The inline form specialization requires exactly the proven hidden carry shape and falls back to existing parameter capabilities when handlers, effects, conditions, lists, writable query state, or unrelated bindings are present.
- Static siblings remain complete zero-JavaScript documents.

### Performance

- On the maintained external 1,000-product fixture, a three-run candidate check reduced cold build time from 13,866 ms to 13,203 ms, warm build time from 13,560 ms to 13,087 ms, and output from 10.48 MB to 9.53 MB.
- The generated catalog changed from 1,011 native plus 1,011 effect route entries to three native plus five effect files in the 100-product candidate inspection, while route HTML continued to reference valid complete capabilities.
- Five Slow 4G form sessions reduced hidden query carry readiness from 783 ms to 348 ms, about 56%.
- These are focused Kudzu before/after measurements, not a cross-framework fastest claim. A seven-run alternating catalog measurement remains the stronger follow-up for precise build attribution.

### Navigation decision

- A compressed static-catalog same-document navigation experiment was measured and removed rather than released.
- In three Slow 4G sessions, native navigation beat the enhanced candidate on detail latency (314 ms versus 575 ms), back latency (107 ms versus 297 ms), transfer (322.2 KB versus 511 KB), and degraded-capability survival (15/18 versus 12/18).
- Native document navigation therefore remains the default for `getStaticPaths()` catalogs; existing explicit exact and `runtimeParams` navigation groups are unchanged.

### Validation

- `npm run check`, `npm test`, and `npm run test:package` pass with all 208 tests and 156 generated pages.
- A three-route static-path fixture proves one shared native entry and one shared effect entry.
- A focused query form fixture proves three hidden fields initialize through the narrow inline path while a static sibling emits no script.
- Sites whose Content Security Policy forbids inline scripts should not rely on this optional fast path without an allowed policy; existing deferred parameter ESM remains in the document.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.42
```

## 0.8.41 - Two-boundary callback ownership

Kudzu 0.8.41 extends ordinary React-shaped component migration through one additional proven callback/ref forwarding boundary without retaining component functions or adding browser runtime machinery.

### Changed in 0.8.41

- A direct setter or inline/simple `const` state callback may cross a child component and one additional direct forwarding component before one intrinsic handler invokes it.
- The forwarding component must destructure the callback and pass it directly once as an `on*` JSX prop; aliases, spreads, intermediate adapters, repeated uses, and a third callback boundary remain fail-closed.
- Parent SignalIR remains stable through nested specialization, including direct setter input adapters and simple callbacks that capture parent state.
- Specialized children retain independent local state, effects, deterministic IDs, and `null`-initialized object refs through conditional cleanup and fresh remount.
- A parent-owned object ref may follow the same proven component tree to one direct intrinsic root.
- Static siblings still emit complete HTML with zero JavaScript; no callback registry, retained component tree, or browser runtime module was added.

### Performance

- Seven alternating clean builds measured `v0.8.40` and candidate medians of 3,565.236 ms and 3,470.277 ms. The +59.834 ms paired candidate-minus-baseline median and overlapping ranges establish no material build change.
- Peak RSS medians were 364.6 MiB and 362.0 MiB.
- Both targets emit byte-identical 176-file deploy graphs: 3,850,245 raw bytes, 1,984,991 aggregate gzip bytes, and identical route plans and deploy digests.
- Current maintained Worker, keyed-list, runtime-matrix, and commerce build measurements are recorded in `PERFORMANCE.md`; architecture and timeout limitations are explicit.

### Validation

- `npm run check`, `npm test`, and `npm run test:package` pass with all 206 tests and 156 generated pages.
- Browser coverage proves parent updates, child-local state/effects/IDs, parent ref resolution, conditional cleanup, and fresh remount across two boundaries.
- Compiler-result checks prove nested specializations retain the original parent signal, while a dedicated fixture rejects a third callback boundary at the authored source.
- Broader prop, callback, ref, and Context graphs remain migration-led work.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.41
```

## 0.8.40 - Property-level effect dependencies

Kudzu 0.8.40 starts the large-application foundation sequence by allowing ordinary object state to expose property-level effect dependencies without artificial primitive-state decomposition.

### Changed in 0.8.40

- Direct property paths over ordinary object state compile to existing tagged DerivedIR.
- Top-level immutable primitive locals derived from object properties use the same source subscription and expression evaluator.
- Source object commits schedule dependency comparison, while `Object.is` prevents cleanup and rerun when the selected property value is unchanged.
- Whole-object, dynamic-property, object-valued, and mixed whole-object/property dependencies remain fail-closed.
- The Zustand migration fixture proves property updates, equality across enhanced navigation, persistent layout ownership, and removal.
- No field signal, proxy, component rerender, RouteIR field, or browser runtime module was added.

### Performance

- Twenty-one alternating clean builds measured `v0.8.39` and candidate medians of 3,753.276 ms and 3,883.841 ms, with a +103.031 ms paired median.
- Peak RSS medians were 356.9 MiB and 363.7 MiB. Build and memory deltas remain below the 5% material-regression threshold.
- Both targets emit 175 files and byte-identical `kudzu-plan.json`; only updated docs add 98 raw and 31 aggregate gzip bytes. Runtime and route JavaScript are unchanged.
- Seven-build/fresh-profile React, Vue, and Svelte runtime comparisons pass. The matched commerce build matrix records Kudzu output at 14,689 aggregate gzip bytes versus 66,741 for React hydration, 247,612 for Next, 82,075 for Nuxt, and 41,061 for SvelteKit.

### Validation

- `npm run check`, `npm test`, and `npm run test:package` pass with all 205 tests and 155 generated pages.
- Focused checks cover direct object-property classification, canonical DerivedIR, whole-object/property ambiguity, RouteIR projection, browser equality behavior, and layout lifetime.
- The next migration-backed investigation is multi-boundary component/prop/callback/ref/context dataflow.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.40
```

## 0.8.39 - Fail-closed route contracts

Kudzu 0.8.39 completes P0.12 by deeply validating the concrete RouteIR, RouteBuildRecord, and CapabilityIR contracts before artifact selection and browser code generation.

### Changed in 0.8.39

- RouteIR v1 rejects duplicate state/parameter IDs, missing command targets, unsupported command operations, malformed captures, and invalid effect dependencies.
- Direct and evaluator bindings validate recursively, including nested scope bindings and every referenced state.
- Conditions validate identity, kinds, reactive sources, and owned states.
- Keyed lists validate state/key identity, row ownership templates, child reciprocity, duplicate parents, and ownership cycles.
- RouteBuildRecord verifies behavior, binding, list, effect, native, and parameter capability reciprocity before artifact planning.
- CapabilityIR validates standalone event/count/flag implications and exact projection equality from its validated route records before codegen.
- Strict JSON-safe checks reject cyclic, lossy, nonfinite, BigInt, sparse, accessor, symbol, and non-plain contract data with a deterministic field path.

### Performance

- Seven alternating clean 153-page builds measured `v0.8.38` and candidate medians of 2,356.477 ms and 2,352.382 ms. The +14.255 ms paired median and overlapping ranges establish no material speedup or regression.
- Peak RSS medians were 352.7 MiB and 356.8 MiB. Repeated validation of the same immutable contracts is eliminated by identity caching.
- Both targets emit the same 174 files, 3,840,694 raw bytes, 1,981,560 aggregate gzip bytes, deploy digest, and byte-identical `kudzu-plan.json`.

### Validation

- `npm run check`, `npm test`, and `npm run test:package` pass with all 203 tests and 154 generated pages.
- Focused checks cover duplicate/missing identity, malformed commands, effects, captures, bindings, conditions, lists, ownership, capabilities, versions, and JSON safety.
- Existing static, command, binding, keyed, effect, Worker, package-import, navigation, reducer, and migration fixtures retain browser behavior and zero-unused-runtime checks.
- The next migration-backed investigation is property-level derived dependencies over ordinary object state.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.39
```

## 0.8.38 - Structural route artifacts

Kudzu 0.8.38 completes P0.11 by replacing serialized route-output searches and parallel route facts with one validated RouteBuildRecord artifact graph.

### Changed in 0.8.38

- Each emitted route records its RouteIR, capability facts, route-entry paths, styles, and exact handler/effect references.
- Final event, effect, binding, conditional, and keyed-list descriptors retain handler references only when they are rendered.
- Handler modules resolve by exact module URL, and Worker references resolve by structural module/handler pairs instead of formatted keys.
- CSS output, package-client compilation, and bundle entry/chunk closure derive from retained route edges.
- CapabilityIR now folds RouteBuildRecord values directly; serialized HTML/plan `includes()` searches and parallel route capability/entry arrays are removed.

### Performance

- Seven alternating clean 152-page builds measured `v0.8.37` and candidate medians of 1,820.186 ms and 1,804.568 ms. The -20.933 ms paired median and overlapping ranges establish no material speedup or regression.
- Peak RSS medians were 351.6 MiB and 351.4 MiB.
- Both targets emit the same 173 files, 3,835,970 raw bytes, 1,979,875 aggregate gzip bytes, deploy digest, and byte-identical `kudzu-plan.json`.

### Validation

- `npm run check`, `npm test`, and `npm run test:package` pass with all 200 tests and 153 generated pages.
- Focused checks reject unsupported versions, malformed and duplicate references, missing handler modules, inconsistent route entries, and invalid JSON round trips.
- Existing static, command, binding, keyed, effect, Worker, package-import, navigation, and migration fixtures retain their browser behavior and zero-unused-runtime checks.
- P0.12 deep RouteIR and CapabilityIR validation is next.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.38
```

## 0.8.37 - Structural ModuleIR references

Kudzu 0.8.37 completes P0.10 by replacing mixed state names, export strings, formatted owner keys, and partial slots with one validated structural reference graph.

### Changed in 0.8.37

- ModuleIR v2 assigns deterministic slots to symbols, signals, handlers, bindings, derived values, effects, keyed blocks, and imports.
- ComponentAnalysis v2 assigns deterministic owner, specialization, state, ref, and ID slots.
- StateRef, OwnerRef, source-local SymbolRef, and stable ModuleSymbol records connect state, capture, import, effect, collection, specialization, prop-signal, and row ownership edges.
- Descriptor finalization resolves effect handlers and imports structurally instead of searching by export spelling.
- Readable state and export names remain only as codegen, runtime ABI, and diagnostic metadata.
- One fail-closed pre-codegen validator rejects unsupported versions, malformed slots, duplicate exports, invalid effect handlers, broken keyed parent-child reciprocity, ownership cycles, and dangling specialization/ref edges.

### Performance

- The maintained 100-importer fixture retains 103 parse misses, 103 export-summary misses, and 100 importer-local clones.
- Seven alternating fresh-process samples measured `v0.8.36` and 0.8.37 compiler medians of 224.506 ms and 227.158 ms. The +6.270 ms paired median and overlapping timing/RSS ranges establish no material regression.
- Source-result size increases from 395,346 B to 460,720 B because ModuleIR and ComponentAnalysis now serialize structural symbol, signal, owner, and slot metadata. This is compiler scratch data, not deployed browser JavaScript.
- Existing static, command, binding, keyed, effect, Worker, navigation, and migration fixtures retain their browser behavior and zero-unused-runtime checks.

### Validation

- `npm run check`, `npm test`, and `npm run test:package` pass with all 198 tests and 152 generated pages.
- Focused checks cover unsupported versions, malformed references, duplicate exports, parent-child reciprocity, cycles, effect-handler roles, specialization ownership, and JSON round trips.
- Package smoke installation passes from the packed tarball.
- P0.11 explicit route artifact graph is next.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.37
```

## 0.8.36 - Semantic state operations

Kudzu 0.8.36 completes P0.9 by proving equivalent direct, aliased, and local-helper state updates and lowering them through the existing command HandlerIR path.

### Changed in 0.8.36

- Direct `setCount(count + 1)`, an immutable result alias, a zero-argument arrow helper, and a one-parameter function helper emit the same structured `add` command.
- Binding identity proves state, setter, helper, and parameter ownership before specialization.
- Recursion, helper or alias escape, mutation, optional calls, and object-based dynamic dispatch fail at authored source locations.
- The existing direct command fast path remains first; whole-handler analysis runs only when direct specialization fails.
- Quick Start instructions now include an explicit `npm install`, and `create-kudzu@0.1.102` reports install-aware next steps and includes the install command in generated READMEs.

### Performance

- The maintained 100-importer fixture preserves the same normalized graph, source-result bytes, digest, and 103 / 103 / 100 parse, summary, and clone counts.
- Twenty-one alternating `v0.8.35`/candidate samples measured compiler medians of 947.100 ms and 942.596 ms. The +1.754 ms paired candidate-minus-baseline median and overlapping RSS ranges establish no material improvement or regression.
- Alias and helper forms avoid native handler ESM and reuse the existing command runtime; direct command artifacts remain unchanged.

### Validation

- `npm run check`, `npm test`, and `npm run test:package` pass with all 197 tests and 151 generated pages.
- Focused coverage proves identical JSON-safe command IR, signal ownership, build-module behavior calls, RouteIR commands, and zero native-handler artifacts for all four source forms.
- Existing command ABI, synchronous batching, ownership, browser runtime, and unrelated native handlers remain unchanged.
- P0.10 ModuleIR reference unification is next.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.36
```

## 0.8.35 - Stable module identity

Kudzu 0.8.35 completes P0.8 by giving cross-module declarations and authored compiler sites stable identities that do not depend on transformed TypeScript AST objects or readable names.

### Changed in 0.8.35

- ProjectSession summarizes declaration, import, named re-export, and `export *` sites as source-local SiteId records.
- ModuleSymbol identity combines a project-relative module path with the authored declaration SiteId; readable names remain diagnostic metadata.
- Default and named exports, local aliases, barrel chains, `export *`, cycles, and ambiguous star exports resolve through one cycle-safe symbol graph.
- Imported semantic consumers resolve ModuleSymbols first, then locate the authored SiteId in their private normalized AST clone instead of rescanning by declaration name.
- Component owners, component calls, hooks, keyed lists, effects, states, refs, and IDs expose deterministic source-local SiteIds in compiler analysis records.
- Repeated symbol resolutions are cached against their source dependencies and invalidate when any dependency source changes.

### Performance

- The 100-importer fixture retains 103 parse and 103 summary misses while removing 100 unnecessary intermediate barrel clones, reducing importer-local clones from 200 to 100.
- Twenty-one alternating `v0.8.34`/candidate samples measured compiler medians of 760.967 ms and 755.595 ms. The paired candidate-minus-baseline median was -2.971 ms, with the candidate faster in 13/21 pairs; this is a small directional improvement, not a material speedup claim.
- Peak RSS medians were 256.9 MiB and 257.8 MiB. The 12,743-byte source-result increase is deterministic SiteId metadata in build scratch, not deployed JavaScript.
- A matched whole-build check measured Kudzu at 495.4 ms, Astro at 974.5 ms, Vue SSR at 1,477.3 ms, React SSR at 1,639.5 ms, and Svelte SSR at 2,033.1 ms. Kudzu shipped less JavaScript gzip than React, Vue, and Svelte; Astro's direct imperative implementation remained much smaller.

### Validation

- `npm run check`, `npm test`, `npm run test:package`, and all 195 tests pass.
- Focused coverage verifies default/named exports, aliases, barrel chains, `export *`, ambiguity, cycles, repeated-session IDs, repeated-compilation IDs, resolution-cache invalidation, and clone-local declaration lookup.
- All five cross-framework device targets pass the same Chrome checks for initial HTML, filtering, empty state, detail fetch, superseded commands, stale-result rejection, and HTTP failures.
- Existing browser runtime code, route capabilities, source syntax, and deployed JavaScript remain unchanged; the repository build emits 150 pages.
- P0.9 semantic state operations is next.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.35
```

## 0.8.34 - Session-local module cache

Kudzu 0.8.34 completes P0.7 by making source parsing and supported-export summarization proportional to unique modules within one ProjectSession instead of repeated importer edges.

### Changed in 0.8.34

- ProjectSession caches one canonical read-only TypeScript AST and one narrow export summary for each file/source-text pair.
- Reachability, static collection, Zustand, client-helper, style, layout-diagnostic, and Worker graph consumers reuse canonical module records.
- Importer normalization receives a deep clone of every node with independent parent links; transformed mutable AST is never shared between transformer contexts.
- Source-text changes invalidate the parsed tree and export summary together, and independent ProjectSessions never share records.
- Export summaries preserve the existing supported direct, aliased, default, and named re-export forms. Stable ModuleSymbol/SiteId identity and `export *` expansion remain P0.8 work.
- Optional injected counters expose parse, summary, and clone misses to tests and the maintained benchmark without production logging.

### Performance

- A 100-importer fixture contains 103 unique page/barrel/component/helper modules. The candidate records exactly 103 parses, 103 export summaries, and 200 importer-local clones.
- Baseline and candidate produce the same 382,603-byte source-result graph and SHA-256 digest.
- The 21-pair timing run drifted materially on the measurement host. Paired candidate-minus-baseline differences had a +33.324 ms median, with the candidate faster in 9/21 pairs; no material speedup or regression is claimed.
- A separate matched SSR/native whole-build check measured Kudzu at 856.2 ms, Astro at 1,482.9 ms, Vue at 2,295.3 ms, React at 2,802.0 ms, and Svelte at 2,972.9 ms. Every target passed the same Chrome behavior validation; this is whole-build context, not a module-cache comparison.

### Validation

- `npm run check`, `npm test`, `npm run test:package`, and all 193 tests pass.
- Unit coverage verifies cache hits, source-text invalidation, export summaries, cross-session isolation, independent cloned node identity, and clone-local parent links.
- Existing imported components, re-export cycles, static collections, Zustand, client helpers, Workers, source diagnostics, and generated artifacts remain covered.
- The repository build emits 149 pages; unaffected static routes remain complete zero-JavaScript documents.
- P0.8 stable ModuleSymbol and SiteId is next.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.34
```

## 0.8.33 - Project-scoped compilation

Kudzu 0.8.33 completes P0.6 by replacing import-time project globals with an explicit build-scoped ProjectSession. Independent roots can now compile in one Node process without sharing paths, source records, graph resolution, or Worker compiler ownership.

### Changed in 0.8.33

- Each `build()` creates a ProjectSession containing the absolute project root, `src`, `src/pages`, `.kudzu`, and `dist` paths.
- Source graph resolution, source indexes, reachable source sets, source compiler helpers, and Worker compilation are bound to that session instead of the directory where compiler modules were first imported.
- The internal programmatic build and development entry points accept an explicit `root`; omitted roots still use call-time `process.cwd()`, preserving existing `kudzu build` and `kudzu dev` behavior.
- Config loading, styles, static assets, route diagnostics, generated modules, output locking, staging, promotion, and development serving all resolve against the selected project.
- Parsed-module and export-summary caching remains deferred to P0.7; this release establishes ownership without adding speculative shared caches or changing browser output.

### Validation

- `npm run check`, `npm test`, `npm run test:package`, and all 191 tests pass.
- One imported `build()` function compiles two roots with identical source filenames in sequence and verifies isolated config metadata, HTML, source results, `.kudzu` modules, and content-distinct Worker bundles.
- The standard CLI output-safety fixture still verifies staging, collision rejection, lock behavior, recovery, and replacement through call-time CWD.
- The repository build emits 148 pages, and existing static zero-JavaScript, interactive capability, Worker, navigation, ownership, and migration behavior remains covered.
- P0.7 parsed module and export summary caching is next.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.33
```

## 0.8.32 - Staged and collision-safe output

Kudzu 0.8.32 completes P0.5 by building production artifacts away from the active deploy tree, rejecting public/generated collisions, and replacing `dist` only after generation and trusted `afterBuild()` work succeed.

### Changed in 0.8.32

- Route HTML, runtime, handler, chunk, Worker, source CSS, and configured CSS artifacts complete in a project-local staging tree before promotion.
- Public files merge only into unowned paths. A public file cannot replace a generated file or directory, and duplicate configured stylesheet outputs fail before publication.
- Ordinary compiler, bundler, public-copy, and `afterBuild()` failures leave the previous successful `dist` unchanged.
- Same-root builds use an exclusive PID lock. Active overlap and dead/invalid lock files fail closed; after an operator removes a stale lock, the next admitted build recovers a backup left by interrupted promotion. Promotion is a guarded rollback/recovery sequence rather than a lock-free atomic directory exchange.
- Successful replacement removes stale output and staging/backup artifacts. Development rebuild errors retain the previous on-disk HTML while the existing error overlay reports the source failure.
- Route HTML writes use bounded batches. Keyed reverse/remove paths avoid repeated root-map work, and binding plus condition updates share one state commit dispatch.

### Performance

- Before final lock/recovery hardening, twenty-one alternating local replacement builds of the 1,011-page commerce fixture observed a 20,392.7 ms to 19,229.1 ms median change, 5.71% lower, while all 3,056 paths and 11,137,074 deploy bytes retained identical SHA-256 hashes.
- The optimized 1,000-row browser graph decreased by 194 B raw / 23 B gzip. External exploratory browser comparisons and their non-publication limitations are documented in `PERFORMANCE.md`; they are not a release gate or maintained general ranking.

### Validation

- `npm run check`, `npm test`, `npm run test:package`, and all 190 tests pass.
- Focused integration coverage verifies seven public/generated namespaces, configured-style collisions, late hook failure, successful stale-file removal, same-root overlap rejection, stale-lock diagnosis, interrupted-backup recovery after lock removal, and no staging/backup remnants.
- Existing keyed identity/state, nested lists, reducer rows, SVG, effects, Workers, navigation, async ownership, and static zero-JavaScript behavior remain covered.
- P0.6 ProjectSession and explicit root is next.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.32
```

## 0.8.31 - Async native-handler ownership

Kudzu 0.8.31 completes P0.4 by tying every mounted native-handler context to its DOM registration lifetime. Async work may finish after route, keyed, or conditional removal, but it cannot write through ownership that no longer exists.

### Changed in 0.8.31

- Native registrations expose one active lifetime to direct setters, captured setters, queued commits, and captured object refs.
- `unmountNative()` invalidates the registration before removing its listener. Enhanced navigation, keyed removal, and conditional removal use the shared unmount hook; non-persisted `pagehide` directly releases document registrations.
- Late state writes become no-ops instead of recreating released state IDs; already queued commits clear without touching replacement DOM.
- Captured object refs resolve to `null` after release, so a late handler cannot find a replacement node that reused the same compiler-owned ref ID.
- Application promises are not cancelled, and no scheduler, task registry, component runtime, or public API is added.

### Performance

- Twenty-one alternating headless Chrome processes measured 5,000 synchronous native event dispatches at a 6.4 ms median for both `0.8.30` and `0.8.31`; the recorded ranges overlap.
- The maintained `native-bubbling` fixture keeps the same eight JavaScript paths. `kudzu-native.js` and `kudzu-serialization.js` add 209 B raw / 94 B aggregate gzip; the runner rejects any other artifact change.
- Environment, raw arrays, artifact bytes, methodology, and limitations are recorded in `PERFORMANCE.md`.

### Validation

- `npm run check`, `npm test`, `npm run test:package`, and all 189 tests pass.
- Chrome starts async route and keyed-row handlers, releases and recreates their owners, and proves late state writes and refs cannot mutate replacement ownership. A persistent layout handler also proves non-persisted document disposal invalidates pending work.
- Focused context checks cover queued direct commits and captured setters. The browser suite retains normal synchronous native event semantics; unaffected static routes remain zero JavaScript.
- P0.5 atomic and collision-safe output is next.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.31
```

## 0.8.30 - Graph failure diagnostics

Kudzu 0.8.30 completes P0.3 by making ordinary source-graph failures stop at the original importer before compilation, generated module loading, or `.kudzu` paths can obscure the source error.

### Changed in 0.8.30

- Reachability validates every relative runtime import and re-export in an ordinary reachable module instead of silently dropping unresolved edges.
- Missing bound imports, side-effect imports, reachable helper imports, named/default forwarding, and `export *` report the importer file, line, column, and written specifier.
- Every ordinary dynamic `import()` form is rejected during graph discovery, including relative, package, template-literal, and computed specifiers.
- Ordinary and Worker traversal retain separate ownership, so Worker-only modules continue through Worker-specific graph diagnostics and cleanup rules.
- Type-only edges and unreachable migration source remain excluded and cannot block a build.

### Compiler Boundary

- `ordinaryRuntimeDependencies()` is the single pre-codegen validator for ordinary runtime graph edges; downstream import rewriting remains a fail-closed assertion.
- This release validates whether a relative runtime edge resolves to exactly one TypeScript file. Whether an existing target exports a requested name remains deferred to the planned module-symbol graph.
- P0.3 adds no accepted source syntax, ProjectSession, export cache, public API, browser runtime, or generated capability bytes. P0.4 async native-handler invalidation is next.

### Validation

- `npm run check`, `npm test`, `npm run test:package`, and all 189 tests pass.
- Focused in-memory and build fixtures cover missing page imports, reachable helper imports, re-exports, relative/package/computed dynamic imports, type-only exclusion, unreachable exclusion, and absence of generated `.kudzu` paths.
- Existing Worker graph diagnostics, React/Router/Zustand migrations, keyed ownership, effects, navigation, and static-route zero-JavaScript behavior remain covered.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.30
```

## 0.8.29 - Symbol-aware descriptor discovery

Kudzu 0.8.29 completes P0.2 by moving native handler, effect, binding, and list descriptor decisions from identifier spelling onto the source-local binding index introduced in 0.8.28.

### Changed in 0.8.29

- Native handlers and effects discover state, setters, reducers, imports, captures, and nested snapshots by lexical reference identity when the complete callback belongs to the source index.
- Handler lowering consumes the same indexed identity used during discovery, so callback parameters and locals that shadow state, setters, reducers, imports, or captures remain untouched.
- Reactive conditionals, bindings, keyed-list evaluators, and list state rewrites distinguish outer state from same-named nested callback parameters.
- The command fast path accepts state and setter references only when they resolve outside the callback, and recognizes `console.log()` only when `console` is the actual browser global.
- Effect resource validation distinguishes real `IntersectionObserver`, `requestAnimationFrame()`, and `cancelAnimationFrame()` globals from shadowed application bindings and matches cleanup to the exact observer or frame declaration.

### Compiler Boundary

- The binding index now recognizes normalized and original TypeScript node boundaries and exposes whether it directly owns an AST node.
- Imported, specialized, or compiler-synthesized trees continue through the established conservative shadow walker rather than borrowing an unrelated source index.
- P0.2 changes no public API, accepted source syntax, ModuleIR shape, browser runtime, or generated capability contract. P0.3 graph failure diagnostics is next.

### Validation

- `npm run check`, `npm test`, `npm run test:package`, and all 187 tests pass.
- Focused tests cover shadowed imports, browser globals, state, setters, list parameters, JSON-safe HandlerIR/BindingIR round trips, and same-named effect resource cleanup.
- Existing Context actions, keyed component callbacks, React Router search parameters, native events, effects, Workers, navigation, and static-route zero-JavaScript behavior remain covered.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.29
```

## 0.8.28 - Source-local binding index

Kudzu 0.8.28 completes the first large-application compiler foundation by resolving source-local lexical bindings before descriptor discovery and lowering.

### Changed in 0.8.28

- A source-local binding index classifies value references as local declarations, parameters, imports, outer captures, known globals, or unresolved names with deterministic slots and source ranges.
- The index models module, function parameter/body, block, loop, catch, switch, class, computed method, namespace, import, destructuring, `var`, `let`, and `const` scopes without adding a TypeScript Program or cross-module graph.
- Reactive binding capture/import discovery uses lexical identity, so component locals named `document`, `location`, `history`, `navigator`, or `console` no longer become browser globals and shadowed callback parameters no longer become imports.
- Reactive binding lowering rewrites only the indexed occurrences that resolve to state or capture bindings. Same-named nested parameters remain local.
- Synthesized keyed expressions use the existing fail-safe path unless the complete expression can be indexed, preserving keyed row state and identity behavior.

### Performance And Architecture

- A focused 1,000-reference guard verifies one index construction followed by direct indexed lookups and reports construction/lookup timing without making a cross-machine performance claim.
- The index is constructed after ordered normalization and parent repair, once per compiled source. It adds no public API, browser runtime, client metadata, or JavaScript bytes.
- Native handler, effect, and remaining descriptor discovery still use the existing analysis path; symbol-aware migration of those consumers remains the next P0.2 scope.

### Validation

- `npm run check`, `npm run test:package`, and all 185 tests pass.
- Browser integration verifies shadowed browser-global names through initial HTML and reactive evaluator updates.
- React, Router, Zustand, keyed row, nested list, effect, Worker, navigation, and static-route zero-JavaScript behavior remain covered.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.28
```

## 0.8.27 - Large-application compiler roadmap

Kudzu 0.8.27 records the evidence-backed path from the current static-first compiler to large production applications without adding a React runtime, generic client framework, or speculative resource API.

### Changed in 0.8.27

- A reduced fixture from E2B Dashboard preserves a callback-shared terminal handle, asynchronous generation token, BFCache retention, resume, and discard cleanup as the first concrete Goal C resource-ownership boundary.
- Unsupported page-level mutable value refs now fail during source analysis with the source location and the existing effect-owned animation-frame exception instead of reaching the build-time DOM-ref runtime error.
- Goal C records independent WebSocket/SSE, shared request, and optimistic transaction candidates while explicitly withholding store, resource, query, cache, Provider, subscription, and scheduler APIs.
- The new large-application and AI-native execution plan audits the current compiler, IR, runtime, navigation, package, build, fixture, and benchmark boundaries and orders the next twelve independently verifiable PRs.
- The next implementation is fixed as a source-local binding index followed by symbol-aware descriptor discovery; ecosystem features cannot skip those semantic dependencies.

### Architecture Boundary

- Existing ComponentAnalysis, ModuleIR, RouteIR, CapabilityIR, complete HTML, direct DOM ownership, native navigation, and capability runtimes remain the incremental foundation.
- The plan generalizes symbol identity, semantic state operations, component/module dataflow, resource/range ownership, artifact references, code splitting, diagnostics, migration analysis, and application-scale evidence without introducing a browser component tree.
- React ecosystem support is classified as Native, Compiled, Migrated, Adapter, Partial, or Unsupported so package-specific knowledge can move behind a compatibility boundary instead of accumulating in the core compiler.

### Validation

- `npm run check`, `npm run test:package`, and all 176 tests pass.
- The E2B fixture remains an expected failure at its proven source boundary; no browser resource runtime or public API is emitted.
- Static-route zero JavaScript, existing animation-frame support, keyed-row diagnostics, setter-child diagnostics, and all current browser ownership behavior remain covered.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.27
```

## 0.8.26 - Goal B benchmark hardening

Kudzu 0.8.26 makes the retained Goal B optimizations reproducible and directly regression-tested without changing generated runtime behavior or authoring support.

### Changed in 0.8.26

- `benchmark:commerce` requires byte-identical candidate output by default; `EXPECTED_CHANGES` explicitly preserves historical comparisons with known artifact deltas.
- The standard suite verifies that exact route-entry sources transform once per build, distinct sources do not collide, and a new build owns a fresh transform map.
- List runtime generation tests retain the measured bulk-mount threshold, majority guards, nested/owner exclusions, and per-root fallback.
- The architecture packet now covers `0.8.25`, records Goal B baseline evidence and deliberate gaps, and closes the retained-experiment checklist.

### Performance Validation

- Seven alternating `v0.8.24` and current-tree commerce builds emitted 1,011 pages and 3,056 files with no changed deploy hash.
- The measured medians were 14,766.5 ms and 12,202.4 ms. This validates the maintained runner and release direction but is not attributed to one optimization because the revisions include all `0.8.25` compiler-boundary changes.
- No new runtime bytes, scheduler, persistent cache, retained tree, or public browser capability was added.

### Validation

- `npm run check`, `npm run test:package`, and all 175 tests pass.
- The exact-output commerce runner passed seven alternating 1,011-page builds.
- No accepted syntax, runtime behavior, DOM ownership, effect cleanup, or `create-kudzu` template changed.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.26
```

## 0.8.25 - Exact route-entry reuse

Kudzu 0.8.25 removes measured repeated esbuild work from large multi-route builds, strengthens compiler boundary validation, and makes package publication gates explicit without changing generated deploy bytes or browser behavior.

### Changed in 0.8.25

- Generated native, parameter, and effect route entries reuse one build-local esbuild result when their complete source is byte-identical after route-relative URLs are resolved.
- Normalization passes now declare an immutable-root contract and reject any result that is not a TypeScript `SourceFile`.
- Finalized ModuleIR rejects invalid local slots and dangling signal, handler, derived, keyed-parent, keyed-child, keyed-selector, and ownership references.
- CI covers the minimum Node 22 runtime and the Node 24 Chrome suite, while release jobs exercise the packed package and verify package, lockfile, tag, and registry versions.
- Missing `0.8.21`, `0.8.22`, and `0.8.23` release pages and their canonical sitemap entries are restored.

### Performance

- Seven alternating clean builds of the public 1,000-product, 1,011-page fixture measured 12,581.4 ms with exact-source reuse versus 13,851.0 ms with repeated transformation, a 9.17% improvement.
- Every deploy path and SHA-256 hash matched. The map is scoped to one build and only the three generated route-entry families; no persistent or generalized transform cache was added.
- Raw arrays, environment, fixture revision, methodology, and limitations are recorded in `PERFORMANCE.md`.

### Validation

- `npm run check`, `npm run test:package`, and all 174 tests pass.
- The packed-package smoke test installs the produced tarball into a temporary consumer, imports both public entry points, runs the packed CLI, and verifies generated HTML.
- The external 1,011-page benchmark produced byte-identical deploy manifests across both targets.
- No accepted syntax, public runtime API, VDOM, hydration, scheduler, retained browser component tree, or `create-kudzu` template change was added.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.25
```

## 0.8.24 - Measured Goal B optimizations

Kudzu 0.8.24 starts the architecture optimization Goal B with two benchmark-proven optimizations for large keyed restoration and large multi-route builds while preserving complete HTML, direct DOM ownership, and existing compiler output. This is distinct from the completed historical Worker capability milestone in `GOAL_B.md`.

### Changed in 0.8.24

- A maintained `npm run benchmark:keyed` fixture measures 2,000 keyed rows with row-local state, reactive slicing/search, bulk restoration, retained-heavy append, reversal, DOM identity, reset state, and restored handlers across fresh Chrome profiles.
- Top-level flat lists batch mount-hook discovery through their connected parent only when more than 32 additions dominate both the next list and parent children. Nested lists, shared containers, and small or retained-heavy additions keep per-root mounting.
- `applyNormalizationPasses()` repairs TypeScript parent pointers only after a pass returns a structurally changed `SourceFile`; validators and no-op passes no longer walk the complete AST again.
- A focused test proves changed normalization output has repaired parent links before the next pass runs.
- Goal B records identical generated route entries as the next measured esbuild-transform investigation; no cache or generalized build system was added without isolated evidence.

### Performance

- Twenty-one fresh Chrome profiles measured 2,000-row restoration at 21.1 ms versus 26.3 ms for `0.8.23`, a 19.77% improvement. A retained-heavy 33-row append showed no material change at 2.7 ms versus 2.6 ms.
- The keyed route adds 127 B raw / 35 B aggregate gzip JavaScript. Filter, reverse, and clean-build distributions establish no material regression.
- Twenty-one alternating clean builds of [`SimYunSup/kudzu-based-bench`](https://github.com/SimYunSup/kudzu-based-bench)'s 1,000-product, 1,011-page Kudzu fixture measured 6,266.5 ms versus 6,684.7 ms for `0.8.23`, a 6.26% improvement.
- Both commerce builds emitted the same 3,056 files. Only `assets/kudzu-list.js` changed for the independently measured runtime optimization; normalization changed no output bytes.
- Exact keyed worktree setup and the checked-in `benchmark:commerce` paired runner are documented in `PERFORMANCE.md` with raw arrays and limitations.

### Validation

- `npm run check` and all 172 tests pass, including the new normalization boundary check.
- Node 22 focused compiler checks and the maintained Worker benchmark pass.
- Chrome-backed keyed list, selector, row-hook, Worker ownership, and the new large keyed benchmark checks pass.
- Before release-content updates, the complete site plus representative list, keyed-row-hook, and navigation builds retained identical file lists; only `assets/kudzu-list.js` changed, and normalized `.kudzu` trees remained identical to `v0.8.23`.
- No accepted syntax, public API behavior, VDOM, hydration, scheduler, cache, retained browser component tree, or `create-kudzu` template change was added.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.24
```

## 0.8.23 - Source compiler boundary

Kudzu 0.8.23 completes the Goal A compiler foundation by moving source normalization, TSX semantic analysis, ModuleIR finalization, handler generation, and build-module generation behind one explicit no-write source compiler result.

### Changed in 0.8.23

- `compileSource()` returns a JSON-safe source result containing the project-relative build module, component analysis, ModuleIR, optional handler module, and imported assets without writing to `.kudzu` or `dist`.
- `createKudzuTransformer()` and all TypeScript AST feature analysis moved from `framework/build.mjs` to `framework/compiler/source-compiler.mjs`.
- Shared source resolution moved to `source-graph.mjs`; shared URL and filesystem path conversion moved to `path-helpers.mjs` and is reused by the development server.
- Worker graph emission is owned and exported directly by `worker-compiler.mjs`; the source result retains only JSON-safe Worker edges and rewritten source.
- `build.mjs` decreased from 3,732 to 744 lines and now coordinates discovery, source results, RouteIR, CapabilityIR, and artifact emission.

### Goal A boundary

- Source analysis consumes all AST-bearing state before returning its result. No `ts.Node`, `Map`, `Set`, function, closure, or Symbol crosses into build orchestration.
- `compileSource()` returns project-relative generated paths and client import roots. Existing absolute paths remain only in source-located diagnostics and are normalized when comparing detached worktrees.
- RouteIR v1 and CapabilityIR v1 remain unchanged, and `core.mjs` remains authoritative for complete HTML and browser ownership IDs.
- Goal B optimization remains deferred; `0.8.23` is the corrected Goal A completion baseline.
- No accepted syntax, public API behavior, runtime capability, VDOM, hydration, component rerender, or retained browser component tree was added.

### Validation

- The complete suite passes 171/171 tests, including a direct no-write, project-relative, JSON-round-trippable `compileSource()` boundary check.
- Node 22 type checks, the 135-page complete-site build, and all 171 tests pass.
- The complete site and eight representative binding, keyed-row, effect, Worker, parameter, navigation, config, and package-handler deploy trees are byte-identical to `v0.8.22`; their `.kudzu` trees match after normalizing only checkout-root source locations.
- An invalid reducer fixture retains the same source file, line, column, and diagnostic text.
- Worker and window graph files remain byte-identical. Seven interleaved clean Node 22 builds measured a 287.0 ms candidate median against 287.7 ms for `v0.8.22`; raw arrays and provenance are recorded in `PERFORMANCE.md`.
- `create-kudzu` remains 0.1.101 because its unchanged template already accepts `@kudzujs/core@^0.8.15`.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.23
```

## 0.8.22 - Versioned compiler foundation

Kudzu 0.8.22 versions the rendered route plan as RouteIR v1 and the pure capability projection as CapabilityIR v1 while source-local ModuleIR seams and focused artifact generators preserve existing output.

### Changed in 0.8.22

- The existing `renderPage().plan` is RouteIR v1 rather than a duplicated route representation.
- Route states add a deterministic route-local numeric `slot`; existing string `id` values remain authoritative browser/DOM identities and `name` remains readable development metadata.
- The existing pure capability manifest is CapabilityIR v1. Route and capability consumers reject unsupported versions.
- List, parameter, core, effect, binding, native, and navigation runtime generation moved from `build.mjs` into focused generator modules with narrow inputs and no filesystem ownership.
- Required authored-runtime source anchors fail closed instead of silently retaining stale branches.
- `build.mjs` decreased from 3,999 to 3,732 lines and now coordinates generator results and artifact emission rather than containing those feature semantics.

### Goal A boundary

- ModuleIR slots identify source-local compiler records; RouteIR state slots identify positions in one rendered plan; browser IDs continue to own DOM/runtime behavior. The namespaces are deliberately independent.
- `core.mjs` remains authoritative for complete HTML, route/layout IDs, conditions, keyed paths, effect lifetimes, and exact cleanup.
- CapabilityIR selects shared runtime families and branches; RouteIR and ModuleIR references retain route entries, handlers, and Workers. Static pages remain complete documents with zero JavaScript.
- Goal B optimization remains deferred; the final source compiler boundary and corrected Goal A completion baseline follow in `0.8.23`.
- No accepted syntax, public API behavior, runtime capability, VDOM, hydration, component rerender, or retained browser component tree was added.

### Validation

- The complete suite passes 170/170 tests, including RouteIR JSON round-trip and slots, CapabilityIR JSON round-trip/version rejection, fail-closed generator contracts, list/parameter/navigation generation, lifecycle cleanup, and development restoration by readable state name.
- `npm run check`, focused Node 22 compiler tests, and a Node 22 complete-site build pass.
- The complete site plus six representative binding, list, effect, Worker, runtime-parameter, and navigation deploy trees are byte-identical to `v0.8.21`; normalized RouteIR meaning is identical in all seven comparisons.
- Worker and window graph files remain byte-identical. Seven interleaved clean builds measured equal 250.1 ms medians; raw arrays and provenance are recorded in `PERFORMANCE.md`.
- Release-blocking architecture audits drove full IR schema validation, accurate reachability ownership, and fail-closed source contracts before publication.
- `create-kudzu` remains 0.1.101 because its unchanged template already accepts `@kudzujs/core@^0.8.15`.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.22
```

## 0.8.21 - Explicit effect ownership

Kudzu 0.8.21 completes the next Goal A source-analysis seam: every supported effect now registers deterministic JSON-safe setup, cleanup, dependency, ownership, source, and Worker-edge data before existing build-time rendering allocates concrete lifecycle IDs.

### Changed in 0.8.21

- EffectIR links setup to finalized HandlerIR and records cleanup, ordered signal and DerivedIR dependencies, subscriptions, dependency state snapshots, and keyed-item fields.
- Component and keyed ownership retain lexical component provenance and KeyedBlockIR slots, including specialized imported rows.
- Relative TypeScript Worker rewriting returns functional callback and edge results; rendered Worker emission derives only from EffectIR rather than a build-wide mutable reference array.
- Transformed effect calls consume the registered EffectIR dependency and ownership record before final setup HandlerIR slot resolution.
- Effect dependency classification and cleanup-owned browser resource validation moved to `compiler/effect-analysis.mjs`; transformer-wide component and keyed effect AST side tables were removed.
- Mixed direct and derived dependencies create DerivedIR only for derived expressions while preserving authored dependency order.

### Goal A boundary

- `core.mjs` and the existing route plan remain authoritative for concrete route/layout/conditional/keyed effect IDs, mounting, stale-write invalidation, and cleanup order; ModuleIR does not duplicate RouteIR.
- EffectIR owns source-analysis facts and Worker graph edges. Route-specific effect codegen continues to consume rendered descriptors without rediscovering TSX semantics.
- No accepted syntax, public API, browser capability, VDOM, hydration, component rerender, or retained browser component tree was added.
- Goal A continues with the `0.8.22` RouteIR, CapabilityIR, numeric-slot, and final architecture/output audit.

### Validation

- The complete suite passes 170/170 tests, including EffectIR JSON round-trip, mixed dependencies, imported keyed provenance, Worker rendered exclusion and `about:blank` replacement, conditional/navigation ownership, stale-write isolation, and cleanup.
- `npm run check`, focused Node 22 compiler tests, and a Node 22 complete-site build pass.
- Before release-content updates, the complete 135-page site plus `effect-dependencies`, `keyed-effects`, and `worker-effects` output trees were byte-identical to `v0.8.20`.
- Worker and window graph files remain byte-identical. Seven interleaved clean builds measured a 253.0 ms candidate median against 255.6 ms for `v0.8.20`; raw arrays and provenance are recorded in `PERFORMANCE.md`.
- A release-blocking architecture audit found no implementation or runtime-correctness blockers.
- `create-kudzu` remains 0.1.101 because its unchanged template already accepts `@kudzujs/core@^0.8.15`.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.21
```

## 0.8.20 - Explicit keyed ownership

Kudzu 0.8.20 completes the next Goal A source-analysis boundary: keyed collection sites now finalize into deterministic JSON-safe ownership records before the existing build-time renderer allocates DOM identity and lifecycle state.

### Changed in 0.8.20

- KeyedBlockIR records parent/child slots, collection signal or calculated binding, key/index policy, owner field, selector reference and states, source provenance, and static status.
- Recursive same-file and imported row expansion records every component-specialization slot, including stateless intermediate components.
- Row states and refs retain their specialization owner and declaration source.
- Command, native, effect, list-expression, list-conditional, and calculated-collection HandlerIR/BindingIR records link to their owning keyed block.
- Transformer-wide keyed value, condition, event, nested-list, effect, rendered-list, and alias AST side tables were removed; temporary AST stays inside immediate source-local validation and lowering.
- The existing route list descriptor now has an explicit TypeScript shape without changing its serialized data.

### Goal A boundary

- `core.mjs` remains authoritative for final list IDs, row key paths, route descriptors, complete HTML, SVG context, state/ref/effect allocation, and exact release.
- Effect setup, cleanup, dependency, Worker, and lifetime ownership remains on the existing path until EffectIR in `0.8.21`.
- No accepted syntax, public API, browser capability, VDOM, hydration, component rerender, or retained browser component tree was added.

### Validation

- The complete suite passes 168/168 tests, including deterministic KeyedBlockIR JSON round-trip and calculated, nested, recursive-component, selector, state, ref, handler, binding, effect, and SVG ownership.
- Before release-content updates, the complete site `dist` and seven representative keyed fixture output trees matched `v0.8.19`; detached-worktree roots were normalized only in existing `.kudzu` source strings.
- The keyed list runtime remains byte-identical at 21,831 B raw / 6,930 B gzip. A same-volume 21-run interleaved comparison measured a 0.52% lower candidate median; raw arrays and provenance are recorded in `PERFORMANCE.md`.
- `create-kudzu` remains 0.1.101 because its unchanged template already accepts `@kudzujs/core@^0.8.15`.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.20
```

## 0.8.19 - Handler, binding, and derived IR

Kudzu 0.8.19 completes the next Goal A source-analysis boundary: native callbacks, reactive bindings, list evaluators, imports, and pure derived expressions now finalize into JSON-safe ModuleIR before mechanical artifact codegen.

### Changed in 0.8.19

- Native and effect callback exports retain explicit roles, signals, setters, captures, snapshot policy, imports, source ranges, and finalized export source in HandlerIR.
- Reactive bindings, list expressions, and list condition evaluators retain explicit states, captures, parameters, imports, and deterministic module-export slots in BindingIR.
- Rendered list selectors and derived effect dependencies use the existing tagged collection-expression language as canonical DerivedIR; transformed build source reads back the registered records.
- Reducer, Context, Zustand, package-import, nested snapshot, and scope semantics finish lowering while source AST and diagnostics are still available.
- `handler-codegen.mjs` imports no TypeScript or AST helpers. It renders the finalized ordered imports and concatenates generated HandlerIR/BindingIR export source.
- The previous semantic artifact arrays containing callback/expression AST, `Map`, and `Set` values were deleted. They remain only inside the source-local session until finalization and do not cross the IR boundary.

### Goal A boundary

- Effect lifetime, cleanup, dependencies, Worker edges, and ownership remain on the existing path until EffectIR in `0.8.21`; only their generated callback exports join HandlerIR now.
- Keyed DOM ownership remains on the existing path until KeyedBlockIR in `0.8.20`; list evaluators and pure selectors are explicit without moving key-path ownership early.
- `core.mjs` remains authoritative for complete HTML, final route/layout state IDs, and the serializable route plan.
- No accepted syntax, public API, runtime capability, VDOM, hydration, component rerender, or retained browser component tree was added.

### Validation

- The complete suite passes 167/167 tests, including ModuleIR JSON round-trip, command-only exclusion, native async handlers, bindings, package imports, reducer, Context, Zustand, list-derived, and effect-derived contracts.
- Before release-content updates, the complete site `dist` and nine representative fixture output trees matched `v0.8.18`; detached-worktree roots were normalized only in existing `.kudzu` diagnostic strings.
- Worker and window graphs remain byte-identical. A same-volume 21-run interleaved comparison measured a 0.32% lower candidate median; raw arrays, file lists, and environment are recorded in `PERFORMANCE.md`.
- `create-kudzu` remains 0.1.101 because its unchanged template already accepts `@kudzujs/core@^0.8.15`.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.19
```

## 0.8.18 - Explicit component ownership

Kudzu 0.8.18 completes the next Goal A source-analysis seam: state, setters, props, refs, IDs, and supported component specializations now have one ordered JSON-safe ownership result without changing final route allocation or deploy behavior.

### Changed in 0.8.18

- Every compiled non-Worker source retains component analysis alongside its transformed build module and optional handler module; Worker graphs keep their existing dedicated result.
- Lexical owners record ordered state and setter slots, destructured prop shape, object refs, deterministic IDs, and honest source ranges.
- Specialized calls record supplied/defaulted props, generated state/ref/ID ownership, and direct links to parent, reducer, custom-hook, or Context signals.
- Command IR resolves owner identity per state command instead of assigning one setter-map scope to an entire handler. Mixed parent/child and nested keyed commands remain distinct.
- Context consumer signals point to a stable Provider source owner; repeated imported and structural specializations retain independent compile-time ownership.
- AST `WeakMap` indexes remain private to immediate source rewriting. They do not cross the JSON-safe source result or become a runtime component model.

### Goal A boundary

- `core.mjs` still executes transformed components at build time and allocates final route/layout state, ref, ID, conditional, and keyed ownership in the same order.
- Initial values, browser state IDs, complete HTML, and the serializable route plan remain authoritative runtime inputs; the component result does not duplicate them.
- HandlerIR, BindingIR, and DerivedIR are the planned `0.8.19` seam. KeyedBlockIR and EffectIR remain on their existing paths until `0.8.20` and `0.8.21`.
- No accepted syntax, public API, VDOM, hydration, component rerender, or retained browser component tree was added.

### Validation

- The complete suite passes 167/167 tests, including JSON round-trip, per-signal owner, repeated/conditional/imported state, setter adapter, ref, ID, Context, reducer, and nested keyed ownership contracts.
- Before release-content updates, the complete `dist` and `.kudzu` trees were byte-identical to `v0.8.17`.
- Worker and window graphs remain byte-identical. A same-volume 21-run interleaved comparison measured a 2.43% candidate median difference, below the 5% architecture gate; raw arrays and environment are recorded in `PERFORMANCE.md`.
- `create-kudzu` remains 0.1.101 because its unchanged template already accepts `@kudzujs/core@^0.8.15`.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.18
```

## 0.8.17 - Command ModuleIR

Kudzu 0.8.17 lands the first real Goal A vertical slice: supported command handlers are recognized as plain JSON-safe data, registered in a sparse per-source ModuleIR, and lowered back through focused source codegen without changing deploy output.

### Changed in 0.8.17

- Direct setter arithmetic, functional setter arithmetic, primitive setter values, and state logging now produce plain Command IR instead of generated TypeScript array nodes during analysis.
- ModuleIR assigns deterministic numeric signal and handler slots while retaining readable state names, lexical state-owner keys, and original source ranges when they exist.
- Command codegen consumes only ModuleIR signal and handler data to reconstruct the existing `__kBehavior()` call; it performs no source analysis.
- Signed literals preserve unary-plus and negative-zero source semantics through JSON-safe syntax metadata. Non-finite numeric forms stay on the existing generic handler path.
- Same-named states in independent component owners receive distinct IR slots, while nested handlers sharing one setter environment reuse the same signal identity.
- Synthetic specialized handlers omit invented source positions; imported/original handlers retain normalized repository-relative source provenance.

### Goal A boundary

- The first active ModuleIR slice contains lexical signals and command handlers only. `core.mjs` remains authoritative for initial values, final route/layout state IDs, complete HTML, and the serializable route plan.
- State/props/ref/component specialization is the planned `0.8.18` seam. Bindings, derived values, keyed blocks, and effects remain on their existing paths until their own explicit results replace AST side tables.
- No VDOM, hydration, component rerender, runtime component tree, public API, or accepted syntax was added.

### Validation

- The complete suite passes 166/166 tests, including JSON round-trip, numeric edge, lexical owner, command codegen, specialized-component, and existing generic-handler contracts.
- Before release-content updates, the unchanged source site `dist`, Counter build module, route plan, and command runtime were byte-identical to `v0.8.16`; the final release adds only its expected version, homepage, documentation, and release-page content.
- The tracked Worker and window graphs remain byte-identical. A same-volume 21-run comparison found no build regression; raw arrays and environment are recorded in `PERFORMANCE.md`.
- `create-kudzu` remains 0.1.101 because its unchanged template already accepts `@kudzujs/core@^0.8.15`.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.17
```

## 0.8.16 - Compiler analysis boundaries

Kudzu 0.8.16 continues the behavior-preserving compiler decomposition: source-local descriptors, the pure collection language, command fast paths, reduced Zustand migration, and route capability projection now have explicit ownership outside build orchestration.

### Changed in 0.8.16

- One descriptor session owns deterministic native-handler, effect, reactive-binding, list-evaluator, and client-import registration for each source module.
- Collection roots, aliases, imported transforms, selector pipelines, and pure expression IR are shared directly by React migration, reactive JSX, effects, and keyed-list discovery.
- Direct setter arithmetic and literals remain compact command descriptors instead of becoming generic browser handler functions.
- Reduced Zustand store analysis and normalization now share one focused compiler pass while retaining the existing accepted and rejected migration boundary.
- Rendered route plans project through one pure capability manifest before runtime specialization and artifact emission.
- Route capability metadata is keyed by route identity, and effect descriptor registry ownership remains private to the source descriptor session.

### Architecture continuation

- `docs/next-architecture` records the current compiler responsibility map, Goal A through D decisions, the `0.8.17` through `0.8.22` Goal A sequence, version policy, and performance gates.
- Goal A proceeds with a sparse JSON-safe ModuleIR and one Counter command vertical slice next; it does not add a VDOM, hydration, component rerender, store/resource runtime, router, or React island.
- Component specialization, keyed-list ownership, and effect analysis remain in the main transformer until their AST-identity side tables can be replaced by explicit results rather than hidden behind large context objects.

### Validation

- `build.mjs` is 3,837 lines, down from 4,351 in 0.8.15, while retaining build orchestration and the intentionally coupled semantic transformer.
- The complete suite passes 163/163 tests, including focused descriptor, collection IR, command, Zustand, and capability-manifest contracts.
- A 21-run round-robin comparison on the same Apple M3 temp volume retained exact Worker and window graph bytes. The `0.8.16` 816.5 ms median was 3.75% above the `0.8.15` 787.0 ms baseline with overlapping distributions, below the 5% architecture gate; raw arrays and environment are recorded in `PERFORMANCE.md`.
- `create-kudzu` remains 0.1.101 because its template already accepts `@kudzujs/core@^0.8.15` and did not change.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.16
```

## 0.8.15 - Compiler architecture

Kudzu 0.8.15 makes the compiler's actual architecture explicit in source and public documentation: React-shaped TSX is normalized, analyzed into capability descriptors, and emitted as complete HTML plus route-specific ESM.

### Changed in 0.8.15

- `build.mjs` now owns build orchestration while focused compiler modules own shared AST scope analysis, ordered normalization, React and React Router migration, browser-signal and resource-lifecycle passes, Worker graphs, and effect/handler code generation.
- The duplicated page/imported-source normalization sequence is one ordered pipeline that restores TypeScript AST parent pointers after every pass.
- Private custom-hook timer metadata returns explicitly from its pass instead of relying on a module-global `WeakMap` keyed by transformed AST identity.
- Worker validation, relative graph checks, content-hashed emission, and placeholder rewriting share one compiler boundary while final rendered-effect gating remains in build orchestration.
- Effect, native-handler, reactive-binding, and keyed-list evaluator generation consume analyzed descriptors without participating in source analysis.
- The public homepage, README, and web documentation now describe Kudzu as a compiler that treats supported React-shaped TSX as input rather than as a browser runtime model.

### Fixed in 0.8.15

- Existing-project installation now states the Node.js 22 requirement and required package scripts.
- The generator package lock and generated core dependency now match the published package versions.
- The missing 0.8.2 release page is restored and release routes are included in the sitemap without replacing their page metadata.
- Documentation tables, code blocks, callouts, navigation, and long inline code remain bounded at a 390px viewport.
- Package-import handler guidance, serializable array-state guidance, benchmark provenance, and media-query external-store wording now agree with source and tests.
- Dedicated AST helper and normalization tests raise the complete suite to 153 tests.

### Boundary

This release does not broaden the accepted React-shaped syntax or add browser runtime capabilities. The main transformer still owns tightly coupled component, state, collection, and ownership analysis; future extraction should follow proven input/output seams rather than create directory structure without reducing coupling.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.15
```

## 0.8.14 - Localized blog migration

Kudzu 0.8.14 proves a localized MDX blog and continuous imperative canvas can migrate without React, request-time i18n, eval, or a canvas runtime.

### New in 0.8.14

- Build-known MDX emits complete static article HTML without `eval()` or `new Function()`.
- Locale-prefixed `/ko` and `/en` routes build through `getStaticPaths()`, and relative Link replacements automatically prefix native hrefs from the build-known locale.
- The root route selects a stored locale or reads `navigator.languages`, then preserves query and hash through native `location.replace()`.
- MDX copy blocks and tabs compile through existing clipboard, state, binding, and conditional capabilities.
- One `null`-initialized canvas ref may feed an inline effect whose local state survives recursive animation frames, visibility changes, and native input listeners.
- Bare `IntersectionObserver` and `performance` remain browser globals in route-specific effect ESM.
- Static sibling routes remain complete zero-JavaScript HTML.

### Fixed in 0.8.14

- Effect-owned `IntersectionObserver` instances must disconnect in cleanup.
- Local animation-frame handles assigned by effects must be cancelled in cleanup.
- The complete suite passes 151/151 tests.

### Boundary

This release does not execute `next-intl`, add request-time `Accept-Language` negotiation, general mutable refs, callbacks shared across effects or handlers, a canvas runtime, or arbitrary MDX component execution. Request-time locale redirects remain host/edge configuration; resource-private drawing state and listeners stay inside one owning effect.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.14
```

## 0.8.13 - Browser capability migration

Kudzu 0.8.13 proves browser-owned migration paths from Memos, Excalidraw, and Cal.com without adding React, general external-store compatibility, or browser capability runtimes.

### New in 0.8.13

- Memos-shaped scroll spies retain an effect-owned `useRef(0)` animation-frame handle with burst coalescing, exact cleanup, smooth navigation, and active-heading ARIA.
- Excalidraw-shaped `"share" in navigator` conditions emit false static fallback and mount Web Share DOM and handlers only in supporting browsers.
- Cal.com-shaped static `useSyncExternalStore` media queries emit desktop-first HTML and lower matching `change` subscriptions into owned effects.
- Direct Web Share and clipboard actions preserve application-owned success and failure state without package adapters.
- Static sibling routes remain complete zero-JavaScript HTML for every migration fixture.

### Fixed in 0.8.13

- Build-time Node `navigator` availability can no longer permanently fold browser capability UI to the wrong branch.
- Optimized state-select text bindings now register the same direct state commit path as optimized attributes.
- Animation-frame refs reject aliases, shadowed bindings, inverted guards, indirect reset/cancellation, repeated scheduling, and missing cleanup with source locations.
- The complete suite passes 149/149 tests.

### Boundary

This release does not add general mutable refs, external stores, media hooks, browser-expression rendering, animation scheduling, collaboration transport, QR generation, or React package execution. Dynamic capability names, `navigator.canShare()`, parameterized/imported media hooks, dynamic queries, and arbitrary store snapshots remain source migration work.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.13
```

## 0.8.12 - Static icon migration

Kudzu 0.8.12 proves a source migration path from Lucide React-shaped icon usage to accessible static SVG without a package factory or browser runtime.

### New in 0.8.12

- Used icons move into relative TSX components with direct intrinsic SVG roots and familiar size, stroke, class, fill, ARIA, and title props.
- Meaningful icons retain explicit roles and titles, while decorative icons remain hidden from assistive technology.
- React-shaped SVG presentation attributes normalize to native output and complete icon routes ship zero JavaScript.
- Unreachable icon modules are excluded from compilation instead of becoming deploy artifacts.
- Public documentation records the migration recipe and its deliberate package boundary.

### Fixed in 0.8.12

- Handler emission now follows references in the final route plan and HTML, removing evaluator modules left behind by build-folded component conditions while preserving list-expression evaluators.
- The complete suite passes 143/143 tests.

### Boundary

This release does not execute `lucide-react`. Dynamic icon lookup, `createLucideIcon()`, package-owned factories, and a generic icon runtime remain unsupported source migration work.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.12
```

## 0.8.11 - Stale-safe data migration

Kudzu 0.8.11 proves source migration paths for TanStack Query-shaped data and React Hook Form-shaped forms while strengthening dependency-effect stale-write isolation.

### New in 0.8.11

- Build-known query data moves to async pages and emits complete zero-JavaScript HTML.
- Browser-only query data uses one dependency effect with application-owned loading, error, result, and primitive refetch state.
- Superseded unowned dependency effects invalidate their invocation before cleanup, so late promise or fetch setters cannot overwrite newer state.
- A deterministic Chrome race verifies that a fast refetch remains visible after a delayed prior response arrives, followed by HTTP failure and recovery.
- React Hook Form-shaped signup source migrates to native controls, constraint validation, `FormData`, one async submit handler, accessible server errors, and retained uncontrolled values.
- Static sibling routes remain JavaScript-free, with no TanStack Query or React Hook Form runtime in deploy output.

### Fixed in 0.8.11

- Mobile documentation now uses a true 100% layout wrapper with explicit inner gutters instead of a reduced outer width.
- The complete suite passes 142/142 tests.

### Boundary

This release does not execute TanStack Query or React Hook Form. Query clients, Providers, caches, retries, deduplication, optimistic cache updates, query-key arrays, Suspense, controllers, watchers, resolvers, and dynamic field registration remain source migration work.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.11
```

## 0.8.10 - Native dialog migration

Kudzu 0.8.10 proves a source migration path from a shadcn/Radix-shaped dialog to the native `<dialog>` element without adding package compatibility runtime.

### New in 0.8.10

- A reduced migration fixture preserves a relative `forwardRef` component, props, children, object refs, and ordinary JSX event handlers.
- Package-owned Portal and Context behavior becomes native `showModal()`, `close()`, and cancel handling.
- Complete accessible dialog markup is pre-rendered while route output includes only the `click` and `cancel` events it uses.
- Chrome coverage verifies modal top-layer behavior, initial focus, confirm and cancel paths, and explicit trigger-focus restoration.
- Public documentation now includes the migration recipe and its deliberate library boundary.

### Fixed in 0.8.10

- Mobile documentation code blocks stay within the content grid and scroll horizontally instead of widening the viewport.
- Browser tests allow slower CI Chrome startup and report process timeouts directly instead of failing later against empty DOM output.
- The complete suite passes 140/140 tests.

### Boundary

This release does not execute Radix or arbitrary React UI packages. `Portal`, `asChild`/`Slot`, element cloning, and arbitrary compound-component Context must be removed during source migration. Applications remain responsible for dialog labeling and explicit focus restoration.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.10
```

## 0.8.9 - Context-backed CRUD actions

Kudzu 0.8.9 specializes state-backed actions exposed through one conventional Context Provider and relative custom hook.

### New in 0.8.9

- A relative zero-argument custom hook may directly return `useContext(ContextIdentifier)` from one local or named relative Context module.
- One Provider may expose direct shorthand `useState` pairs and synchronous actions that capture only those exposed pairs.
- Consumers may select state and actions across ordinary component boundaries; direct action calls inline into existing route handler ESM and concrete state operations.
- CRUD actions over object arrays compose with keyed rows, reactive selection, conditional editors, and guarded local storage effects in the React Notes migration.
- Unsupported private captures, hidden state dependencies, indirect action references, dynamic Provider values, multiple Providers, and consumer binding collisions fail with source diagnostics.
- Static sibling routes remain JavaScript-free. No action function, Context runtime, Provider tree, callback registry, VDOM, or hydration is emitted.
- The complete suite passes 139/139 tests, including Chrome coverage for create, rename, select, and delete behavior.

### Boundary

The hook must directly return `useContext(ContextIdentifier)`. The Context and exactly one Provider must be declared together in one local or named relative module, and its value must be one direct shorthand object. Actions must be synchronous, called directly in intrinsic handlers, and capture only exposed Provider state pairs.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.9
```

## 0.8.8 - Conditional keyed map roots

Kudzu 0.8.8 compiles ordinary expression-bodied conditional keyed maps through the existing pure collection selector path.

### New in 0.8.8

- One-parameter keyed maps may return `condition && <Row />` or `condition ? <Row /> : null`.
- Top-level conditions may combine the current item with direct primitive parent state; nested maps support item-only conditions.
- Omitted rows own no DOM or hooks. True-to-false transitions release row state, effects, and refs; re-entry creates fresh ownership.
- Retained siblings preserve keyed DOM identity through condition changes, insertion, and reorder.
- Same-file and relative row components remain compiler-specialized before the existing list runtime receives the normalized filter.
- Imported build-known item-only conditions still fold to complete zero-JavaScript HTML.
- The React Notes migration restores its ordinary `notes.map(note => activeId === note.id && <Editor />)` source shape.
- Map indexes, alternate JSX fallbacks, block-bodied conditional maps, arbitrary captures, and impure predicates remain diagnosed.
- The complete suite passes 134/134 tests.

### Boundary

Conditional map callbacks must be synchronous expression arrows with exactly one item parameter. Indexes are rejected because implicit filtering changes their meaning. The feature adds no runtime capability, VDOM, hydration, or component rerenderer.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.8
```

## 0.8.7 - Reactive keyed row selection

Kudzu 0.8.7 lets a flat keyed row combine its current item or index with direct primitive parent state in pure text and attribute expressions.

### New in 0.8.7

- Selected-row classes, `aria-current`, `aria-selected`, and similar pure expressions update directly after parent-state commits.
- Retained rows reevaluate only their expression text and attributes; list structure, handlers, and DOM identity remain untouched.
- Initial static HTML evaluates the same expression with build-time state values.
- Calculated SVG coverage verifies focus, Space, click, insertion, reorder, latest handlers, selected classes, ARIA state, and retained node identity.
- A React Notes migration restores its ordinary `activeId === note.id` selected-row source without imperative DOM code.
- Object/array parent state, arbitrary captures, nested-row parent state, structural conditions, mutation, and arbitrary calls remain diagnosed.
- The complete suite passes 134/134 tests.

### Boundary

This support is limited to pure flat keyed-row text and attribute expressions over the current item/index plus direct primitive parent state. It adds no component rerenderer, VDOM, hydration, or general capture runtime.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.7
```

## 0.8.6 - Responsive list reversals

Kudzu 0.8.6 fixes stale keyed-list bookkeeping after reverse and one-item removal fast paths.

### Fixed in 0.8.6

- Reverse fast paths now store the latest logical item order after moving existing keyed DOM nodes.
- One-item removal fast paths update the same baseline before subsequent list actions.
- Repeated reverse clicks apply on the next microtask instead of requiring another delayed interaction.
- Existing keyed rows retain DOM identity and uncontrolled input values through every reorder.
- Chrome coverage verifies `3,2,1 → 1,2,3 → 3,2,1` across rapid actions, and the complete suite passes 134/134 tests.

### Boundary

This is a bookkeeping correction in the existing keyed-list runtime. It adds no list capability, VDOM, hydration, or component runtime.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.6
```

## 0.8.5 - Owned timer actions

Kudzu 0.8.5 compiles one proven private timeout ref pattern from a returned relative custom-hook action into existing state and effect ownership.

### New in 0.8.5

- One directly returned relative custom-hook callback may own one `useRef<number | null>(null)`, directly clear its previous timeout, and assign a numeric-literal-delay `setTimeout()` whose callback updates hook state.
- One empty-dependency effect directly clears the latest timer on cleanup. Conditional unmount cancels pending work, and remount creates fresh ownership.
- The compiler lowers the private ref to a collision-free hidden state slot shared by existing native-handler and effect contexts; no timer scheduler or runtime is added.
- Named, default-arrow, and relative re-export hook forms retain the same specialization and independent timer identities.
- Browser coverage verifies replacement, latest-only firing, unmount cancellation, and fresh remount. Dynamic delays fail with source diagnostics.
- Static siblings remain JavaScript-free, and the complete suite passes 134/134 tests.

### Boundary

The hook may own one private timeout ref with one direct returned callback, one literal delay, and one direct cleanup effect. Multiple refs, aliases, dynamic delays, intervals, keyed ownership, indirect callbacks, and arbitrary timed graphs remain unsupported.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.5
```

## 0.8.4 - Browser-native handlers

Kudzu 0.8.4 fixes named event handlers that use standard browser globals during real React application migrations.

### New in 0.8.4

- Named and inline event handlers keep `localStorage`, `FileReader`, and `alert` in route-specific browser ESM instead of serializing them as component captures during static rendering.
- FrugalHQ backup export, file import, and reset handlers now build without evaluating browser-only globals in Node.
- Browser regression coverage verifies that the globals remain absent from SSR capture scope and resolve normally after a real click.
- The fix adds no runtime, shared bytes, hydration, or browser component tree.
- The complete suite passes 133/133 tests.

### Boundary

Application-owned handler captures must still be JSON-safe. This release only corrects classification of the proven standard browser globals; it does not execute browser APIs during static rendering or add arbitrary callback support.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.4
```

## 0.8.3 - Native interaction composition

Kudzu 0.8.3 characterizes ordinary clipboard, debounce, and accessible SVG point interactions through existing route-specific capabilities instead of dedicated browser runtimes.

### New in 0.8.3

- Direct async handlers and directly returned relative custom-hook callbacks may call native `navigator.clipboard.writeText()` while application state owns success and permission-failure feedback.
- Dependency effects may own debounced synchronization with `setTimeout()` and directly returned `clearTimeout()` cleanup; dependency changes and conditional unmount cancel pending work.
- Calculated keyed SVG points may use focus, click, Space, and Enter handlers to update parent state rendered in an external accessible HTML tooltip.
- Retained SVG rows preserve DOM identity and read the latest point labels after recalculation and reorder.
- Clipboard, timer, and chart-specific runtimes remain absent, and unaffected static sibling routes continue to ship zero JavaScript.
- The complete suite passes 133/133 tests with focused Chrome coverage for clipboard success/failure, latest-only debounce, unmount cleanup, fresh remount, accessible tooltip input, and retained SVG identity.

### Boundary

Debounce requires explicit effect ownership and direct cleanup. Private timer refs, unowned delayed event writes, intervals, arbitrary callback graphs, keyed-item SVG conditions, nested calculated SVG lists, and chart runtimes remain unsupported until a reduced migration fixture proves they are necessary.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.3
```

## 0.8.2 - Calculated keyed collections

Kudzu 0.8.2 lets one direct array field from a synchronous relative calculation result drive an intrinsic keyed list, preserving static HTML and existing DOM ownership while improving list and navigation hot paths.

### New in 0.8.2

- A top-level `const result = calculate(state)` may feed `result.items.map(...)` when the relative synchronous helper returns a JSON-safe array field.
- Route-specific evaluator ESM refreshes a compiler-owned array anchor after source-state commits; the existing keyed reconciler retains keys, current handlers, and SVG namespaces.
- Initial structural rows hydrate list bookkeeping without repeating DOM writes, retained direct attributes skip redundant DOM reads, and stable-list fallback avoids duplicate validation.
- Immutable local filter sources with unused ordinary `useState` setters use the existing static-filter restoration path while indirect custom-hook and reducer mutation paths remain dynamic.
- Required route modules emit `modulepreload` hints, and navigation prefetch resolves validated destination capabilities before commit while preserving complete-document fallback and cleanup ordering.
- Navigation prefetch safely ignores focus and pointer targets outside anchors.
- Calculated collection fixtures verify insert, reorder, removal, retained identity, latest handlers, scalar bindings, SVG namespace, and zero JavaScript on unaffected static routes.
- The complete suite passes 133/133 tests, and the FIRE migration retains all chart nodes and acceptance behavior.

### Boundary

The calculation must be one top-level immutable result from a synchronous relative TypeScript function, and the consumed field must remain a JSON-safe array. Indirect result aliases, dynamic fields, nested calculated SVG lists, package calculations, and asynchronous helpers remain unsupported. Static-filter specialization applies only when an ordinary local setter is provably unused; lifecycle-bearing and indirectly mutable collections retain the general path.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.2
```

## 0.8.1 - Custom-hook reset actions

Kudzu 0.8.1 compiles direct multi-state reset callbacks returned by relative custom hooks into one existing behavior command, keeping conventional hook ownership without adding a callback runtime.

### New in 0.8.1

- Returned custom-hook callbacks may reset their exposed state/setter pairs to direct string, number, negative-number, boolean, or `null` literals in one batched commit.
- Imported callback literals are synthesized before command emission, fixing source-range corruption when optimized behavior commands originate in another module.
- The FIRE Standard calculator now owns its twelve-field reset inside `useStandardParams()`; existing dependency effects update URL parameters and local storage after the same commit.
- A React/Vite migration fixture verifies exact optimized command output plus browser updates for multiple reset values.
- Static routes and routes without reset actions add no JavaScript or runtime capability.

### Boundary

Reset callbacks may capture only directly returned state/setter pairs and use direct literal setter calls. Private defaults, helper-indirect setters, dynamic values, timers, clipboard work, aliases, and arbitrary callback graphs remain unsupported.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.1
```

## 0.8.0 - URL-backed custom hooks

Kudzu 0.8.0 migrates practical relative React custom hooks that combine local state, effects, direct actions, writable URL search parameters, and guarded browser storage while preserving static HTML and route-specific capabilities.

### New in 0.8.0

- Named or default zero-argument custom hooks imported from relative TypeScript modules can expose direct shorthand `useState` value/setter pairs and callbacks that capture those states.
- React Router `useSearchParams()` accepts a top-level `[params, setParams]` tuple. Direct browser callbacks may pass one synchronous inline updater and optionally exactly `{ replace: true }`.
- Query writes use native `URLSearchParams` and History APIs, immediately recommit affected route signals, and follow browser `popstate` without an SPA router.
- Custom-hook mount and dependency effects can restore validated values from `localStorage`, persist subsequent state, and keep deterministic build-time fallbacks.
- Page entries now define the compiled TypeScript graph, so unreachable migration modules no longer block a build while reachable invalid imports retain diagnostics.
- Direct maps over imported immutable JSON-safe arrays fold to static HTML; relative calculation helpers can drive direct reactive result fields through route binding ESM.
- Package imports referenced directly inside JSX event handlers erase from build modules and bundle only into route handlers, enabling ExcelJS export without package execution during rendering.
- FIRE migration validation covers all fourteen routes, production Tailwind/Inter assets, URL and storage restoration, reset, presets, native SVG charts, Quiz and keyed Debt flows, and a real Excel workbook buffer.
- Static sibling routes continue to ship no JavaScript; React, React Router, hydration, a VDOM, and a browser hook dispatcher remain absent.

### Boundary

Custom hooks must be synchronous zero-argument relative imports with one final direct shorthand object return. Caller destructuring cannot use aliases, defaults, or rest. Writable search parameters require direct inline updater callbacks. Relative calculation results require direct static field reads. Package imports must be referenced directly inside intrinsic JSX event callbacks. Dynamic query reads, direct-value setters, arbitrary options, mutable value refs, generic reactive objects, calculated collection fields, helper-indirect package use, and callback graphs with private captures remain unsupported.

### Upgrade

```bash
npm install @kudzujs/core@^0.8.0
```

## 0.7.30 - Reactive number formatting

Kudzu 0.7.30 supports fixed-locale `Intl.NumberFormat` display chains in reactive JSX locals, restoring conventional comma-formatted controlled inputs while preserving narrow render-call validation.

### New in 0.7.30

- Reactive text and attributes accept `new Intl.NumberFormat("literal").format(Math.round(expression))` over supported state-derived primitive expressions.
- Initial HTML is formatted during the build and existing binding ESM reevaluates the same native expression after state changes.
- No collection selector opcode, shared formatting runtime, hydration, or browser component instance is added.
- Locale values must be direct string literals; dynamic locales and options remain unsupported.
- Optional calls, aliases, shadowed `Intl` or `Math`, arbitrary constructors, and other render calls retain source diagnostics.
- A migration-derived FIRE `CurrencyInput` restores `100,000` annual and `8,333` monthly display while preserving annualized state updates.
- The complete suite passes 123/123 tests, including emitted evaluator and invalid dynamic-locale coverage.

### Boundary

This is display formatting only. The accepted expression requires one static locale and exactly `Math.round(expression)` as the format argument. Collection selectors and effect dependency expressions keep their existing pure expression language.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.30
```

## 0.7.29 - Hermetic TypeScript checks

Kudzu 0.7.29 makes project and migration-fixture typechecks independent of unrelated ambient types and package declarations installed in ancestor directories.

### New in 0.7.29

- The root TypeScript configuration declares an empty ambient `types` set instead of scanning every visible ancestor `node_modules/@types` directory.
- `create-kudzu` emits the same isolated TypeScript configuration for new projects.
- Migration fixture checks skip third-party declaration bodies while continuing to typecheck fixture TS and TSX against Kudzu's reduced declarations.
- A clean `npm ci` checkout nested below conflicting `@types/minimatch`, React, and React Router installations now passes `npm run check`.
- The complete suite continues to pass 122/122 tests.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.29
```

## 0.7.28 - Nested component specialization

Kudzu 0.7.28 recursively specializes components rendered inside setter-adapter children, allowing conventional optional UI such as an imported hookful Tooltip to remain declarative without adding a browser component runtime.

### New in 0.7.28

- Setter-adapter children may recursively render synchronous same-file or relative-imported components.
- Nested component props, defaults, JSX children, static assets, handlers, and relative TypeScript imports reuse the existing call-site specialization path.
- Nested `useState()`, `useId()`, `useRef()`, and supported effects join the outer generated owner on unconditional or statically truthy paths.
- Literal `&&` and ternary conditions fold before specialization, so omitted and false optional components allocate no hooks or browser capabilities.
- Recursive component cycles, namespace/package components, and unresolved component imports retain source diagnostics.
- Hookful nested components on dynamic paths fail instead of receiving incorrect unconditional ownership.
- Setter callbacks cannot cross a second component boundary.
- A migration-derived FIRE `AgeInput` now restores its imported hookful `Tooltip`, including generated ARIA identity and hover/focus state.
- The complete suite passes 122/122 tests with Chrome coverage for nested tooltip state, omitted optional UI, and existing parent/child lifecycle behavior.

### Boundary

Nested hooks are accepted only when the nested component is unconditional or guarded by a statically truthy literal after outer prop substitution. Dynamic conditional hook ownership and forwarding the setter through another component remain unsupported. Components still erase to intrinsic HTML and route-specific capabilities; React is never emitted or executed.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.28
```

## 0.7.27 - Stateful component migration

Kudzu 0.7.27 lets ordinary setter-adapter components keep their local hooks and derived render values while compiling them into static HTML plus existing route-specific capabilities, not a browser component runtime.

### New in 0.7.27

- Same-file and relative-imported children receiving one supported setter callback may own multiple directly serializable `useState()` values.
- A child string draft may initialize from one direct primitive state prop through zero-argument `.toString()`, covering conventional controlled age and numeric inputs.
- Setter-adapter children may use deterministic build-time `useId()` values and `null`-initialized object refs.
- Supported child effects reuse existing route ESM, dependency comparison, cleanup, conditional ownership, and stale-work isolation.
- Conditional removal deletes child state, resolves refs to `null`, and runs cleanup; remount creates fresh ownership and prop dependency effects synchronize drafts to the latest parent value.
- Inline and simple `const` parent callbacks continue to specialize into the generated child helper instead of becoming serialized function captures.
- Reactive JSX text and attributes may read recursively chained top-level immutable locals built from supported pure primitive state expressions.
- Impure derived render calls, non-null child refs, unsupported dynamic state initializers, repeated callback use, and wider callback forwarding retain source-located diagnostics.
- React Router normalization now safely ignores local export declarations without module specifiers.
- A migration-derived FIRE age input verifies local draft editing, parent updates, blur validation, effect synchronization, and remount after a hidden parent update.
- The complete suite passes 121/121 tests, including same-file/imported hook ownership and Chrome lifecycle coverage.

### Boundary

This remains one compiler-specialized component boundary with one supported setter callback use. Prop-derived state initialization accepts only a direct primitive state prop's zero-argument `.toString()`; other dynamic initializers remain unsupported. Refs must initialize with `null`, effects must use the existing supported callback and dependency forms, and React is never emitted or executed.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.27
```

## 0.7.26 - React-shaped migration and faster lists

Kudzu 0.7.26 broadens ordinary React-shaped migration input and removes repeated keyed-row cleanup scans, making the matched 500-card search faster than React without adding a VDOM, hydration, or a retained component tree.

### New in 0.7.26

- JSX typing accepts React 19 `ReactNode`-shaped component output while preserving Kudzu's compile-time element model.
- Intrinsic DOM handlers retain contextual event typing through migration-compatible JSX declarations.
- A direct setter or one-call value-adapter callback may cross one supported component boundary, covering ordinary controlled search inputs without serializing a function.
- Imported static collections wrapped in TypeScript-only assertions such as `as const` remain analyzable and erase normally.
- Collection selector execution caches state reads and avoids recursive rest-array, `slice()`, and `map()` allocation in hot expression paths.
- Safe keyed rows with local state but no row effects, nested lists, or shared text targets release binding and condition registrations directly by state ID instead of rescanning every removed subtree.
- Rows outside that proven boundary continue through the existing DOM-owned unmount path.
- A 21-run alternating fresh-profile benchmark measured the 500-card filter at 13.5 ms for Kudzu and 13.9 ms for React, making Kudzu 2.88% faster and 52.30% faster than its preserved 28.3 ms baseline.
- The same benchmark measured Kudzu's build 11.90% faster, keyed row toggle 7.02% faster, and emitted JavaScript 87.29% smaller by aggregate gzip.
- The complete suite passes 118/118 tests, including remove-all, unseen-key remount, and fresh row-state coverage for the indexed release path.

### Boundary

Indexed row release is compiler-selected only when cleanup can be proven from row-owned state IDs and the row has no effects, nested lists, or shared text targets. Effectful, nested, and otherwise lifecycle-bearing rows retain the general ownership cleanup path. Setter adapters remain limited to one supported component boundary and one direct intrinsic handler call. React remains migration input only and is never emitted or executed.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.26
```

## 0.7.25 - Router-shaped native navigation

Kudzu 0.7.25 accepts a narrow React Router `useNavigate()` source shape and lowers safe static destinations to native full-document navigation without shipping React Router or adding an SPA runtime.

### New in 0.7.25

- A named or aliased `useNavigate` import may initialize one top-level `const` identifier in a component.
- Direct calls from nested browser callbacks with one safe static root-relative destination lower to `globalThis.location.assign()`.
- Exactly `{ replace: true }` lowers to `globalThis.location.replace()`.
- Configured `base` is applied while query strings and fragments are preserved.
- The React Router import and navigate binding are erased from emitted component code.
- Dynamic or relative destinations, render-time calls, passed aliases, optional calls, and other navigation options fail with source diagnostics.
- Native document navigation remains deliberate even when enhanced navigation is configured.
- Unaffected destination routes remain complete static documents with zero JavaScript.
- The complete suite passes 117/117 tests with Chrome coverage for base-aware full-document navigation.

### Boundary

The supported migration shape is one top-level `const navigate = useNavigate()` and direct calls from nested browser callbacks. Destinations must be safe static root-relative strings. Only the absent options argument and exactly `{ replace: true }` are supported; dynamic values, relative paths, deltas, state, relative routing, scroll options, aliases, and render-time calls remain unsupported. No SPA router is included.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.25
```

## 0.7.24 - Router-shaped query reads

Kudzu 0.7.24 accepts a narrow read-only React Router `useSearchParams()` shape and lowers each static query read to a nullable route signal backed by native `URLSearchParams`, without adding a router runtime.

### New in 0.7.24

- A named or aliased `useSearchParams` import may initialize one top-level `const [params]` tuple without a setter.
- Direct top-level `const value = params.get("literal")` reads lower to cached nullable query signals.
- The route-specific parameter module uses native `URLSearchParams.get()` semantics for missing, empty, duplicate, plus-encoded, Unicode, and percent-encoded values.
- Static fallback HTML renders missing query text as blank and omits nullable attributes; browser values initialize before route effects mount.
- Query signals compose with direct text and attributes, effect dependencies, native handlers, React Router Link lowering, and configured same-document navigation.
- Routes without query reads emit no parameter module or query branch.
- Setter tuples, dynamic names, other methods, aliases, wrapped expressions, and indirect reads fail with source diagnostics.
- The complete suite passes 115/115 tests with Chrome coverage for standalone and navigation-group query initialization.

### Boundary

The supported migration shape is one top-level `const [params] = useSearchParams()` and one or more top-level direct `const value = params.get("literal")` reads. Query setters, `getAll`, `has`, iteration, dynamic names, aliases, inline JSX calls, fallback wrappers, layout ownership, and general URLSearchParams semantics remain unsupported. Native document navigation remains the default; no SPA router is included.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.24
```

## 0.7.23 - Router-shaped runtime params

Kudzu 0.7.23 accepts the conventional React Router `useParams()` source shape on runtime bracket routes and redirects it to the existing capability-specific pathname reader without shipping React Router.

### New in 0.7.23

- Named or aliased `useParams` imports from `react-router-dom` may be called directly on bracket pages exporting `runtimeParams = true`.
- One optional TypeScript type argument is preserved through normalization while the runtime call remains argument-free.
- The React Router binding is redirected to `@kudzujs/core`; no `react-router-dom` module reference survives emitted code.
- Mixed `Link` and `useParams` imports lower together: Link becomes a base-aware native anchor and params reuse the pathname reader.
- Runtime parameter values retain existing secure decoding, direct DOM bindings, effects, handlers, and navigation-group lifecycle behavior.
- Indirect references, runtime arguments, default/namespace imports, and unsupported router hooks fail with source diagnostics.
- The complete suite passes 112/112 tests with browser coverage for multi-parameter paths and mixed Link/params migration input.

### Boundary

React Router `useParams()` lowering requires a direct named or aliased zero-argument call on a bracket route exporting `runtimeParams = true`. Build-known `getStaticPaths()` routes continue to receive params through page props. Catch-all routes, optional segments, indirect calls, runtime arguments, and other router hooks remain unsupported. No SPA router or shared router runtime is added.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.23
```

## 0.7.22 - SVG structures and native links

Kudzu 0.7.22 extends ordinary React-shaped structural authoring into SVG and erases the common React Router `Link` form to native navigation without adding an SVG renderer or router runtime.

### New in 0.7.22

- Reactive conditional branches inside SVG parse replacement markup in the actual SVG parent context and retain existing DOM ownership semantics.
- Flat intrinsic keyed lists inside SVG support add, update, reorder, and removal while preserving keyed identity and the SVG namespace.
- SVG fragment construction is compiled out of HTML-only condition and list builds; the measured matched fixture added 333 B raw / 79 B aggregate gzip JavaScript.
- A named or aliased `Link` import from `react-router-dom` with one static root-relative `to` lowers to a native `<a href>`, receives the configured `base`, and erases the package import.
- Dynamic or relative Link destinations, traversal, `NavLink`, router-only props, spreads, default/namespace imports, and non-JSX uses fail with source diagnostics.
- Effect dependency arrays are explicitly proven for multiple direct primitive states or supported props through existing commit batching and `Object.is` comparison.
- The complete suite passes 111/111 tests with Chrome coverage for SVG namespace, conditional replacement, keyed identity, Link erasure, and zero-JavaScript static output.

### Measured fixture

On the recorded Intel i5-9500 / Chrome 142 environment, 1,000-row SVG medians were 0.8 ms conditional, 1.9 ms update, 8.3 ms reverse, 2.4 ms remove, and 3.5 ms add. The matched HTML control measured 0.7, 1.8, 8.3, 2.5, and 3.6 ms. Link and native-anchor controls emitted byte-identical 248 B HTML and zero JavaScript. Full methodology and raw arrays are in `PERFORMANCE.md`.

### Boundary

Structural SVG currently supports reactive conditionals and flat intrinsic keyed lists. Keyed-item conditions, nested SVG lists, reactive MathML, and namespaced attributes remain unsupported. React Router lowering accepts only direct named or aliased `Link` JSX with one safe static root-relative destination and native anchor props. Native document navigation remains the default; no SPA router is included.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.22
```

## 0.7.21 - Composable collections and effects

Kudzu 0.7.21 expands ordinary React-shaped collection pipelines and effect authoring while preserving keyed identity, derived dependency semantics, and capability-specific browser output.

### New in 0.7.21

- A relative-imported named or default synchronous one-parameter function may directly return a supported pure collection pipeline; Kudzu composes its selector without executing or shipping the function.
- Immutable `slice(start, end?)` accepts numeric literals and supported direct primitive state expressions for bounded pagination.
- Pure `filter` predicates may combine direct primitive state with supported string methods for reactive search.
- Expression-bodied `toSorted((left, right) => ...)` comparators compile into immutable selector sorting; mutating `sort()` fails with a source diagnostic.
- A top-level immutable primitive local derived from direct state may appear in an effect dependency array. Source commits schedule comparison, but unchanged derived results do not rerun the effect.
- Derived expressions are substituted into setup and cleanup handlers, so reruns and final disposal observe the latest value.
- Same-component top-level simple `const` setup and directly returned cleanup functions are statically substituted into effect handlers; indirect aliases remain unsupported.
- The complete suite passes 107/107 tests with browser coverage for pagination, search, sorted identity, derived equality, cleanup order, and named effect functions.

### Boundary

Collection transforms must be relative, synchronous, capture-free, one-parameter functions with one returned supported pipeline. Slice bounds and sort comparators reject arbitrary calls; `sort()` remains unsupported. Derived effect locals must be pure primitive expressions over direct state. Effect function references must be direct top-level `const` functions in the same component; dynamic selection, parameters, and cross-component references remain unsupported.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.21
```

## 0.7.20 - Computed child collections

Kudzu 0.7.20 accepts a common block-bodied keyed `map` callback that computes one direct child collection before returning JSX, without executing arbitrary callback code or adding a browser runtime path.

### New in 0.7.20

- A keyed `map` callback may contain one top-level `const` declaration followed by its final JSX return.
- The `const` must start from a direct parent-item child property and may use the existing pure `filter`, direct-property `flatMap`, or `Array.from` selector pipeline.
- The computed alias feeds exactly one nested keyed list source.
- The compiler substitutes the proven calculation into the returned JSX before nested-list analysis, then reuses existing selector encoding and keyed ownership.
- Child insertion, reorder, removal, indexes, and DOM identity retain the existing nested-list behavior.
- Additional statements, multiple or mixed alias reads, parent capture, mutation, arbitrary calls, and asynchronous callbacks fail during compilation.
- The complete suite passes 107/107 tests with browser coverage for dynamic computed-child insertion and source-diagnostic coverage for mixed alias use.

### Boundary

This release supports one direct-child collection `const` in a block-bodied keyed-map callback. Multiple calculations, aliases used outside one nested keyed list, imported transforms, parent captures, mutation, and async work remain unsupported.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.20
```

## 0.7.19 - Reusable collection aliases

Kudzu 0.7.19 lets one immutable local collection alias feed multiple keyed list sites while preserving independent DOM identity, and formalizes setter callback and object-ref ownership across one ordinary component boundary.

### New in 0.7.19

- A top-level immutable local alias over a supported collection pipeline may be reused by multiple keyed `map` sites.
- Every alias reference must remain a statically analyzable collection source; mixed reads such as `visible.length` fail with a source-located diagnostic instead of becoming stale build-time values.
- Each list site retains its own keyed DOM identity through insertion, reorder, and removal while sharing the same state-backed selector.
- Inline or simple `const` setter callbacks may cross one same-file or relative-imported component boundary to an event on the child's direct intrinsic root.
- A `null`-initialized object ref may cross the same boundary; conditional removal resolves it to `null`, and remount points it at a fresh element.
- These paths reuse compiler-owned behavior and ref descriptors without a callback registry, retained component instance, VDOM, or hydration.
- The complete suite passes 107/107 tests with browser coverage for both reusable list identity and callback/ref conditional ownership.

### Boundary

Reusable aliases must be top-level immutable locals whose every reference is a supported collection source. Search, slice, pagination, sorting, mutation, imported transforms, arbitrary callbacks, callback refs, and forwarding beyond the proven component boundary remain unsupported.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.19
```

## 0.7.18 - Primitive child prop dependencies

Kudzu 0.7.18 formalizes direct JSON-safe primitive parent state as a reactive child prop across ordinary same-file and relative-imported components, without adding component specialization or a browser component tree.

### New in 0.7.18

- A direct parent state identifier passed to a destructured child prop remains the same compiler-owned signal.
- Child text and attribute bindings update directly when the parent primitive changes.
- Child `useEffect` dependency arrays may reference that destructured prop and reuse the parent state ID.
- Repeated child calls share the parent signal while retaining independent effect records and captures.
- Conditional child insertion mounts its effect, parent updates run cleanup before setup, and removal cleans up exactly once.
- Same-file and relative-imported children receive matching behavior; React and component functions remain absent from browser output.
- The complete suite passes 106/106 tests with browser coverage for binding updates, dependency order, conditional mount, rerun, and removal.

### Boundary

The prop must be a direct JSON-safe primitive parent state identifier. Derived expressions, object or array dependencies, computed prop forwarding, and broader callback/ref ownership remain unsupported.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.18
```

## 0.7.17 - Lazy reducer initialization

Kudzu 0.7.17 lowers React-shaped `useReducer(reducer, initialArg, initializer)` calls into existing compiler-owned reducer state when the initializer is statically analyzable, and fixes capability-specialized keyed-list fallback paths.

### New in 0.7.17

- A synchronous one-parameter initializer may be inline, same-file, or imported from a relative TypeScript module.
- The initial argument must be directly serializable, and the initializer result must be a primitive, plain-object, or array literal derived only from that argument.
- The compiler substitutes the argument, emits fresh literal AST, and lowers the call to the existing two-argument reducer ownership path.
- React migration imports and direct `@kudzujs/core` imports receive matching TypeScript overloads without adding a reducer runtime.
- Dynamic calls, captures, defaults, rest parameters, async or generator functions, and non-literal results fail with source-located diagnostics.
- Keyed-list builds now use the template fallback when static collection support is absent and preserve a zero index when index capability code is removed.
- The complete suite passes 105/105 tests, including browser coverage for ordinary, nested, reducer-owned, effect-owned, and conditional keyed lists.

### Boundary

Kudzu does not execute initializer functions during compilation. It only substitutes a directly serializable argument into a directly serializable return expression. Reducer factories, package initializers, arbitrary computation, and captured values remain unsupported.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.17
```

## 0.7.16 - Build-time lazy state

Kudzu 0.7.16 accepts the common React-shaped `useState(() => initialValue)` form when the initializer directly returns a serializable literal, lowering it into existing compiler-owned state with no browser component runtime.

### New in 0.7.16

- Anonymous synchronous zero-argument lazy initializers may directly return primitive, plain-object, or array literals.
- The compiler lowers those functions before state analysis, so ordinary, repeated, imported, conditional, and keyed-row state reuse existing ownership paths.
- Conditional removal still deletes owned state, and remount recreates a fresh clone of the serialized object or array initializer.
- React migration imports and direct `@kudzujs/core` imports receive the same behavior and TypeScript inference.
- Dynamic calls, captures, parameters, async or generator functions, named function expressions, and multi-statement bodies fail with source-located diagnostics.
- Static routes remain JavaScript-free; lazy initializer functions are absent from generated component and browser modules.

### Boundary

This release evaluates no arbitrary user code at build time. Initializers must directly return data the compiler can already serialize. Lazy `useReducer` initialization and dynamic state factories remain unsupported.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.16
```

## 0.7.15 - Child state ownership

Kudzu 0.7.15 gives repeated ordinary child components independent state and adds explicit state ownership to reactive conditional branches without introducing a browser component tree.

### New in 0.7.15

- Repeated same-file and relative-imported child components receive distinct concrete state IDs.
- Shared generated handler modules retain per-element state maps and serializable prop captures, so one child update cannot mutate its sibling.
- Reactive conditional descriptors record only state created directly by each branch.
- Conditional removal unmounts DOM capabilities and deletes the active branch's owned state slots.
- Re-entry recreates primitive, object, or array state from serialized initial values instead of restoring stale state.
- Initially active branches reuse their pre-rendered state IDs rather than executing the child component a second time.
- Nested condition owners remain independent, and existing route/layout, keyed-row, effect, and navigation ownership behavior is preserved.
- Static sibling routes remain JavaScript-free; no component registry, hook dispatcher, or generic rerender loop is emitted.

### Measured fixture

The focused three-route fixture rendered repeated same-file and imported toggles plus conditional removal/re-entry. A clean local build measured approximately 270 ms and emitted 10,815 B raw JavaScript across the two interactive routes; the static sibling route emitted no script. Chrome verified sibling isolation, state deletion on removal, fresh remount values, and stable initial active-branch IDs.

### Boundary

This release owns direct state created while rendering ordinary conditional branches. Lazy `useState`/`useReducer` initialization, broader primitive prop dependencies, and additional callback/ref ownership remain fixture-driven work. Browser output still contains only state and DOM capabilities, never component functions.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.15
```

## 0.7.14 - Intrinsic forwardRef

Kudzu 0.7.14 preserves conventional direct `forwardRef()` component authoring while erasing the wrapper into build-time intrinsic output.

### New in 0.7.14

- `forwardRef` may be imported directly or with an alias from `react`, or called as a direct default/namespace React member.
- One top-level `const` component may wrap one inline synchronous `(props, ref)` render function.
- The compiler removes `ref` from ordinary props and rest bindings before supplying it as the render function's second parameter.
- The forwarded object ref must appear exactly once on the direct intrinsic root and reuses Kudzu's existing deterministic ref marker.
- Components remain valid when the optional ref prop is omitted; `null` and `undefined` intrinsic refs emit no marker.
- Same-file and relative-imported components compile without React, a wrapper function, hydration, or a browser component runtime.
- Indirect callbacks, async/generator renders, callback or composed refs, fragments, component roots, nested targets, repeated forwarding, and `memo(forwardRef(...))` fail with source diagnostics.

### Boundary

This release intentionally supports one direct object-ref boundary. It does not add React ref objects, imperative handles, generic ref composition, or browser component instances. Existing keyed-row ownership checks still require refs used inside keyed lists to originate from that row.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.14
```

## 0.7.13 - Deterministic useId

Kudzu 0.7.13 preserves conventional top-level React `useId()` authoring while emitting deterministic static HTML IDs with no browser runtime.

### New in 0.7.13

- `useId` may be imported directly or with an alias from `react`, or called as a direct default/namespace React member.
- Each top-level `const id = useId()` receives a stable build-time ID that can be reused by `id`, `htmlFor`, and ARIA ID-reference attributes.
- Repeated component calls receive distinct IDs, while unchanged clean builds reproduce the same output.
- Shared layouts and route content use separate ID namespaces during complete-document and enhanced navigation builds.
- Static routes remain JavaScript-free; no hook dispatcher, hydration metadata, or browser component function is emitted.
- Calls with arguments, non-top-level forms, and keyed-row ownership fail with source-located diagnostics.

### Boundary

`useId()` accepts no arguments and must initialize one top-level `const` identifier in an ordinary component. Keyed rows remain unsupported because cloned row templates require key-scoped rewriting of `id`, `for`, ARIA IDREF, and fragment-reference attributes; Kudzu rejects the unsafe shape instead of emitting duplicate IDs.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.13
```

## 0.7.12 - Exported row reuse

Kudzu 0.7.12 lets directly exported same-file row components remain ordinary reusable source while every supported call still specializes to intrinsic DOM.

### New in 0.7.12

- Same-file keyed rows may use direct `export function Row` declarations.
- Function-valued `export const Row = ...` declarations receive the same specialization.
- One exported row may be reused across multiple keyed maps and ordinary static JSX sites.
- Every discovered JSX call specializes independently; the exported declaration remains build-only and no component function or name enters browser assets.
- Existing keyed identity, event handlers, conditions, styles, static callbacks, reorder, and removal behavior remain unchanged.
- Non-JSX references and dynamic component aliases continue to fail with a source-located `may only be referenced as JSX` diagnostic.
- Export-list and default-export aliases, exported state-backed wrappers, and exported reducer-dispatch components remain outside this direct-row fixture.

### Boundary

This release supports direct export modifiers on same-file keyed row function declarations and function-valued constants. Every local reference must remain a JSX call, and effectful row components may still only run at keyed sites. Imported rows retain their existing default, named, aliased, and direct named re-export support.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.12
```

## 0.7.11 - Serializable defaults and rest props

Kudzu 0.7.11 preserves common non-primitive defaults and direct rest forwarding across existing compiler-specialized component boundaries.

### New in 0.7.11

- Specialized collection wrappers, keyed rows, and reducer components accept directly serializable primitive, plain-object, and array literal prop defaults.
- One final identifier rest binding may be forwarded exactly once to the component's direct intrinsic root.
- Rest props expand into ordinary JSX attributes before existing event, binding, style, and keyed-row analysis, preserving source-order overrides without a runtime rest object.
- Calling-component `const` prop spreads now resolve through lexical function scopes, including keyed row calls nested inside `map` callbacks.
- Dynamic defaults, indirect or repeated rest use, rest-forwarded children, and prototype-sensitive rest properties fail with source-located diagnostics.
- A React-shaped keyed row fixture proves object and array defaults, ARIA and event rest props, style output, and component erasure.
- The repository README is now a concise project entry point; detailed APIs, limits, and benchmarks link to the maintained web documentation.

### Boundary

Defaults must be directly serializable literals. Rest must be one final identifier binding used exactly once as a spread on the direct intrinsic root. State collections still cross specialized wrapper boundaries as direct props. Exported reusable specialized rows, `forwardRef`, and `useId` remain fixture-driven work.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.11
```

## 0.7.10 - Component composition

Kudzu 0.7.10 preserves common component composition across existing compiler-specialized collection boundaries.

### New in 0.7.10

- State-backed collection wrappers, keyed rows, and reducer specializations accept prop spreads from direct inline object literals or one direct `const` object literal declared in the calling component.
- Spread and explicit props apply in source order, preserving ordinary override behavior.
- Specialized components accept forwarded JSX children, including mixed text and element children, while still lowering to intrinsic DOM.
- Non-self-closing specialized component tags are counted as one JSX use instead of treating the closing tag as another reference.
- A conventional React-shaped landing fixture proves imported layout children, component spreads, keyed row children, interaction output, and a zero-JavaScript static route.
- Dynamic, computed, circular, prototype-sensitive, and method/accessor spread shapes fail with source-located diagnostics.

### Boundary

Spread sources must be inline object literals or one direct `const` object literal declared in the calling component. State collections still cross the specialization boundary as direct props. Rest bindings, non-primitive defaults, exported reusable specialized rows, `forwardRef`, and `useId` remain fixture-driven work.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.10
```

## 0.7.9 - Keyed-row prop defaults

Kudzu 0.7.9 lets ordinary keyed row components retain destructured primitive literal prop defaults instead of restructuring every call site.

### New in 0.7.9

- Same-file and relative-imported keyed row components accept string, finite-number, boolean, and `null` defaults.
- Missing props receive their default literals during existing component specialization.
- The component call lowers to intrinsic keyed JSX; React imports and the component call do not enter browser output.
- Rest and nested destructuring remain source-diagnosed, while object, array, computed, and call defaults remain rejected.
- No browser runtime branch or shared asset bytes are added.
- The product documents now define commerce and realtime dashboards as validation fixtures under one general React migration roadmap, not separate product verticals.

### Boundary

This release supports primitive literal defaults on compiler-specialized keyed rows. General prop spreads, rest bindings, non-primitive defaults, specialized `children`, `forwardRef`, and `useId` remain fixture-driven composition work.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.9
```

## 0.7.8 - Static collection fast paths

Kudzu 0.7.8 specializes compiler-owned static `filter` collections so repeated category changes avoid general keyed-list validation and reconciliation.

### New in 0.7.8

- Static source items, unique keys, source positions, and reference entries validate and cache once when the list mounts.
- Structural rows removed by a filter become detached prototypes; restoration clones fresh DOM, preserving remount semantics without moving retained keys.
- Interleaved additions insert only new contiguous runs instead of attaching additions and then reordering the complete list.
- General local-state lists, dynamic selectors, indexed rows, handlers, effects, refs, and row state retain their existing reconciliation paths.
- The capability is route-specific and compiles out when no compiler-owned static collection is rendered.
- The matched route adds 648 B gzip compared with 0.7.7's initial implementation while reducing 500-row restoration from 13.2 ms to 3.6 ms.

### Benchmark

The matched fixture imports 1,000 alternating products, filters to 500, then restores all 1,000 while checking retained and remounted DOM identity. Thirty-one rotating fresh Chrome 150 profiles on an Apple M3 used 4x CPU throttling. Median visible/filter/restore times were Kudzu 37.8/8.4/3.6 ms, React 86.3/12.9/6.2 ms, Vue 54.1/8.4/4.3 ms, and Svelte 61.4/11.7/8.3 ms. React, Vue, and Svelte used Vite CSR shells while Kudzu emitted initial HTML, so visible-row and artifact comparisons are architecture-dependent.

### Boundary

The fast path requires a compiler-owned static source, field keys, filter-only selection, and structural rows without handlers, effects, refs, row state, or index dependencies. It is intended for ordinary catalog-sized collections, not direct rendering of 100,000 or 1,000,000 DOM rows; use pagination or windowing for those workloads.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.8
```

## 0.7.7 - Imported memo collections

Kudzu 0.7.7 lets ordinary React migration source filter an imported static catalog through state-dependent `useMemo` while reusing existing keyed-list reconciliation.

### New in 0.7.7

- Named relative imports of exported JSON-safe `const` arrays can anchor analyzable collection pipelines.
- Direct local-state reads in collection selectors invalidate the list when their declared state dependencies change.
- Existing keys retain DOM identity through filtering and restoration; removed keys remount when restored.
- Compiler-owned static collection state is excluded from development snapshot restoration.
- Static routes remain JavaScript-free, and interactive routes ship no React runtime or browser memo cache.
- Focused fixtures verify dependency diagnostics, static output, generated selectors, and browser DOM identity.

### Boundary

Static collections must be named relative imports of exported JSON-safe `const` arrays. Package, namespace, default, dynamic, mutable, and non-serializable collection sources remain unsupported, as do arbitrary callbacks and general-purpose memo caching.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.7
```

## 0.7.6 - Zustand-shaped shared stores

Kudzu 0.7.6 lets reduced React migration source retain a Zustand `create(set => ...)` store across an explicitly configured shared-layout navigation group.

### New in 0.7.6

- One exported store with one directly serializable data property and synchronous capture-free actions compiles to one ordinary layout-lifetime Kudzu state slot.
- Components select the data or an action with direct forms such as `state => state.quantities` and `state => state.add`.
- Selected actions inline through existing functional state updates, so repeated same-turn calls observe current logical state and DOM writes still batch.
- Same-group navigation retains the store and layout DOM while incoming route bindings mount against the current value.
- Neither React, Zustand, a subscription runtime, nor a generic external-store capability enters the deploy output.
- The shopping fixture verifies two same-turn additions, product-to-cart retention, removal, layout DOM identity, package erasure, and source diagnostics in Chrome.

### Boundary

The shared layout must initialize the store before route consumers. Derived selectors, multiple data properties, middleware, `get`, subscriptions, equality functions, persist/devtools wrappers, async actions, helper captures, replacement updates, keyed-row initialization, and indirect action forwarding remain unsupported.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.6
```

## 0.7.5 - Class composition migration

Kudzu 0.7.5 lets ordinary React source retain common direct `clsx` calls while compiling them to existing static and reactive class paths.

### New in 0.7.5

- Default and named `clsx` imports lower at build time for string and number literals, literal arrays, literal object conditions, and conditional expressions.
- Dynamic object conditions reuse existing reactive class bindings without serializing or shipping the `clsx` function.
- Static uses add no browser JavaScript, and the package import is erased from compiled modules.
- Mixed React imports such as `import { useState, type ReactNode } from "react"` now erase type-only specifiers before runtime module rewriting.
- The React/Vite fixture verifies initial class output, state-driven class updates in Chrome, package erasure, and mixed type imports.

### Boundary

`clsx` spreads, computed object keys, arbitrary calls, and indirect references remain unsupported. This is source lowering for a proven migration pattern, not package execution or a general React ecosystem runtime.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.5
```

## 0.7.4 - Memoized collection pipelines

Kudzu 0.7.4 lets ordinary React/Vite source retain analyzable collection work inside `useMemo` while reusing the existing keyed-list selector and DOM identity model.

### New in 0.7.4

- Inline `useMemo` callbacks accept collection pipelines rooted in direct local array state.
- Existing `filter`, direct-property `flatMap`, and `Array.from` selector analysis is reused without a browser memo cache.
- Intermediate `.map()` calls lower to the existing `Array.from(source, mapper)` selector operation.
- Memo locals are removed from emitted server modules after their uses are inlined, so state signals never execute array methods during rendering.
- State updates preserve keyed row DOM identity while adding, removing, filtering, mapping, and reordering selected values.
- Collection callbacks must be synchronous arrows with plain `(item)` or `(item, index)` identifier parameters; async, rest, default, and optional parameters fail with source locations.
- The React/Vite fixture verifies `filter + map`, selector generation, browser updates, and retained identity for an existing row.

### Boundary

Memoized collections use the existing statically analyzable collection subset. Arbitrary callbacks, external captures, asynchronous transforms, getters, and general-purpose memo caching remain unsupported. React, a VDOM, hydration, and a retained browser component tree are not emitted.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.4
```

## 0.7.3 - React memo normalization

Kudzu 0.7.3 accepts common React memo authoring forms while preserving build-time components, direct state bindings, static HTML, and capability-only JavaScript.

### New in 0.7.3

- `memo(Component)` and aliased or direct-member equivalents lower to same-file build-time function components.
- Inline `useCallback` wrappers continue to lower directly to analyzable handler functions without a browser memo cache.
- Inline synchronous `useMemo` callbacks may return one expression over primitive literals and direct local state.
- Memoized state expressions are inlined at same-component JSX uses so existing bindings update them without component rerenders.
- Static pages wrapped in `memo` remain JavaScript-free.
- Component shadowing, impure expressions, incomplete state dependencies, duplicate memo locals, and nested memo-local captures fail with source locations.
- The React/Vite app fixture verifies repeated counter updates, derived `Double 2`/`Double 4` output, CSS and SVG assets, mount effects, and a zero-JavaScript static route.

### Boundary

`memo` identifiers must name unshadowed same-file top-level function components. `useMemo` locals must use unique `const` declarations, may reference only direct local state and primitive literals, and cannot cross nested function boundaries. No browser component cache, React runtime, VDOM, hydration, or retained component tree is emitted.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.3
```

## 0.7.2 - React hook normalization

Kudzu 0.7.2 accepts more ordinary React/Vite hook syntax while compiling through the existing static HTML and direct DOM capability paths.

### New in 0.7.2

- Supported hooks imported from `react` may retain aliases such as `useState as useMenuState` and `useEffect as runEffect`.
- Default and namespace imports may use direct supported members such as `React.useState(...)`.
- Inline React `useCallback` wrappers with literal inert dependencies are erased to their callback before Kudzu specialization.
- Captured local state must appear in the callback dependency array, preserving an actionable boundary around stale React closures.
- Unsupported members, indirect hook references, computed React members, and effectful dependency expressions fail with source locations.
- Type-only React namespaces remain available to TypeScript and do not trigger runtime migration diagnostics.
- A React/Vite-shaped app fixture verifies CSS, SVG assets, a non-root base, aliased state/effects, member state, repeated callback updates, browser interaction, and a zero-JavaScript static route.

### Boundary

`useCallback` requires an inline function and a literal array containing only identifiers or primitive literals. `memo`, `useMemo`, React classes, indirect hook references, side-effect React imports, and dynamic React imports remain unsupported. React, a VDOM, hydration, and a retained browser component tree are never emitted.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.2
```

## 0.7.1 - Vite-style landing assets

Kudzu 0.7.1 lets ordinary React/Vite landing-page source retain its common local stylesheet and static asset imports while preserving static HTML output and capability-only JavaScript.

### New in 0.7.1

- Relative side-effect CSS imports are validated and erased before server module evaluation.
- Default CSS Module imports compile to deterministic scoped class maps with no client runtime.
- Relative image, SVG, and font imports compile to base-aware URL strings; supported assets also accept `?url`.
- Relative CSS `url(...)` references are rewritten to base-aware emitted URLs, preserving query and hash suffixes.
- Referenced asset bytes are copied under deterministic source-relative `dist/assets` paths.
- Static assets and CSS Modules work inside specialized relative keyed-row components.
- Declaration files under `src` remain available to TypeScript but are excluded from executable module compilation.
- The migration fixture verifies a non-root base, byte-identical assets, scoped classes, browser interaction, and zero JavaScript on its static route.

### Boundary

CSS Module `composes`, arbitrary import queries, import hashes/attributes, and named or namespace asset bindings fail at build time with source locations. React, a VDOM, hydration, and a retained browser component tree remain absent.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.1
```

## 0.7.0 - React-source migration preview

Kudzu 0.7.0 begins the migration track for ordinary React-shaped landing pages. Existing source may retain conventional supported imports from `react`; Kudzu rewrites those imports to compile-time APIs, pre-renders complete HTML, and emits only the route capabilities that are actually used. React, a virtual DOM, hydration, and a browser component tree are never emitted or executed.

```tsx
import React, { useState } from "react"

export default function Header() {
  const [open, setOpen] = useState(false)

  return <React.Fragment>
    <button onClick={() => setOpen(!open)}>{open ? "Close" : "Menu"}</button>
    {open && <nav>Navigation</nav>}
  </React.Fragment>
}
```

### New in 0.7.0

- Conventional unaliased named imports of supported hooks from `react` compile through Kudzu without loading React.
- Default, namespace, and named `Fragment` imports are accepted for migration source.
- Relative function components, props, children, conditions, attributes, text, and event handlers keep their familiar TSX shape.
- Static routes using the accepted React import forms still ship zero JavaScript.
- Interactive routes ship direct DOM capabilities only; the landing-page acceptance fixture adds state, text, attribute, condition, and menu-handler capabilities.
- Emitted modules are checked for surviving runtime React references, and side-effect React imports fail with a source location.
- Keyed collections now support analyzable `filter`, direct-property `flatMap`, `Array.from`, positional keys, recursively deep sibling child maps, nested conditions, latest-item handlers, multiple serializable row states, effects, and `null` object refs.

### Current boundary

This is source migration support, not a React compatibility runtime. Aliased hooks, member hook calls such as `React.useState`, `memo`, `useMemo`, `useCallback`, React classes, React Router, Next-specific components, React UI packages, side-effect imports, and dynamic React imports remain unsupported. Migrate a real route, reduce the first unsupported pattern to a fixture, and extend the compiler one proven blocker at a time.

### Measured fixture

The two-route landing fixture retains React imports across relative components. Its static route has no script, while its interactive mobile-menu route emitted 10,245 B raw / 5,030 B aggregate gzip JavaScript across seven capability files in the 0.7.0 release snapshot. Seven clean builds after one warm-up measured a 310.0 ms median in that historical development environment; the original runner and raw array are not tracked in the current repository.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.0
```

New Kudzu source should continue importing APIs from `@kudzujs/core`. Retaining `react` imports is intended for migration input where minimizing source edits matters.
