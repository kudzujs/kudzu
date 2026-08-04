# Kudzu Releases

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
