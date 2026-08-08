# React Migration Roadmap

This document is the source of truth for Kudzu's product direction, architecture invariants, and future development order. Read it before extending React-shaped syntax or browser capabilities.

[`GOAL_A.md`](./GOAL_A.md) and [`GOAL_B.md`](./GOAL_B.md) are completed capability-validation records. Their commerce and realtime dashboard fixtures prove general lifecycle, navigation, async-workflow, and Worker capabilities; they are not separate product verticals or future priority lists.

## North Star

An AI should be able to migrate ordinary React-shaped TypeScript and TSX to CDN-deployable static HTML, CSS, and only the route-specific ESM capabilities actually used, with minimal source restructuring.

```text
ordinary React-shaped TSX
  -> Kudzu compiler specialization
  -> complete static HTML + CSS + capability-specific ESM
```

Kudzu is a general migration compiler. Shops, dashboards, documentation, blogs, landing pages, forms, and administration screens are outcomes built on the same compiler model. No application category defines Kudzu's architecture.

Syntax compatibility does not mean reproducing React wholesale. Kudzu accepts the statically analyzable subset it can lower to build-time output and direct browser capabilities. Unsupported nearby patterns must fail at build time with a file, line, and actionable explanation.

## Product Invariants

- Never add React as a runtime or production dependency.
- Never add a VDOM, hydration pass, retained browser component tree, generic component rerenderer, or hook dispatcher.
- Static routes ship zero client JavaScript.
- Interactive routes ship only the capabilities they use.
- Prefer build-time execution whenever all inputs are available during the build.
- State setters update logical state immediately and batch direct DOM writes at synchronous-turn boundaries.
- Preserve familiar function components, props, children, JSX, hooks, conditions, collections, and event handlers where Kudzu can compile them safely.
- Prefer compiler specialization over asking migrated applications to replace ordinary declarative React UI with imperative DOM code.
- Unknown browser-only data receives a static shell plus only the ESM needed to obtain and patch it.
- Native document navigation and ordinary `<a>` elements are the default.
- Same-document navigation remains explicit, route-group scoped, complete-document based, and recoverable through native navigation.
- Do not add compatibility APIs speculatively. A real or reduced conventional React fixture must fail first.

## Data And Route Decisions

Classify each migrated screen before changing the framework.

| Requirement | Kudzu treatment |
|---|---|
| Data and route known at build time | Async component or `getStaticPaths()`; emit complete HTML |
| Interaction after user input | Existing event compiler; emit handler ESM only |
| Data available only after browser mount | Inline `useEffect`; emit one route-specific effect graph |
| Route IDs known at build time | Bracket route plus `getStaticPaths()` |
| Route value known only from the URL | Static fallback plus compiled pathname parameter reader |
| Normal navigation | Native `<a>` document navigation |
| Proven same-document requirement | Explicit shared-layout route group with complete-document fallback |
| High-frequency browser processing | Relative Worker or imperative resource owned by an effect when a fixture proves it |
| Dataset too large for direct DOM | Pagination or windowing; do not render an unbounded tree |

Do not add `getStaticProps`, request-time SSR, an SPA router, a stream runtime, or a virtualization system until a reduced migration fixture proves the existing treatments insufficient.

## Completed Foundation

The following are available building blocks, not future vertical roadmaps:

- Async build-time components, `getStaticPaths()`, runtime path parameters, metadata, base paths, public assets, CSS, CSS Modules, and post-build hooks.
- React import normalization for supported named/aliased hooks, direct `React.*` members, fragments, same-file `memo`, inline `useCallback`, direct intrinsic `forwardRef`, top-level `useId`, and analyzable `useMemo` expressions and collections.
- Function components, props, children, context, direct bindings, conditions, controlled form properties, refs, and synchronous or async handlers.
- `useState`, independent repeated non-keyed child state with conditional mount ownership, reduced relative-imported `useReducer`, direct dispatch specialization, and reduced Zustand-shaped shared state proven by migration fixtures.
- Mount and dependency effects with cleanup, route/layout lifetimes, conditional/keyed ownership, stale-write isolation, and relative TypeScript Workers.
- Keyed local-state and imported static collections, pure selectors, nested direct-property lists, recursive and directly exported row specialization, static/keyed component reuse, analyzable specialized prop spreads, serializable literal defaults, direct intrinsic rest forwarding, forwarded JSX children, latest-item handlers, row state/effects/refs, and stable keyed identity.
- Complete-document native fallback and optional shared-layout navigation groups with parameter initialization, finite prefetch caching, focus, history, cleanup, and independent capability output.
- React-shaped SVG presentation attributes, direct `clsx` lowering, fixed-locale reactive `Intl.NumberFormat` display formatting, relative TypeScript handler helpers, and source-located diagnostics.

Completed fixtures such as commerce, TodoMVC, nested order data, Zustand state, landing pages, and realtime Workers are evidence that these compiler capabilities compose. They do not set the product's domain or automatically justify broader package compatibility.

## Development Selection Rule

Future work begins with an actual React application or a reduced fixture derived from one.

1. Build the source with the current compiler before restructuring it.
2. Inventory the first unsupported ordinary React pattern.
3. Reduce that pattern to the smallest executable fixture.
4. Confirm the pattern is general React authoring rather than one application's architecture.
5. Reuse an existing compiler/runtime capability before adding a new one.
6. Implement the narrowest shared specialization that preserves familiar source.
7. Add source diagnostics for the supported boundary and nearby rejected forms.
8. Prove static output, browser behavior, identity/cleanup, and zero-cost exclusion.
9. Measure output bytes, build time, and the affected browser operation.
10. Update public support and limit documentation.

An unsupported item is not automatically backlog work. Arbitrary callbacks, packages, and React semantics remain unsupported until independent migration evidence justifies a safe static specialization.

## Active Fixture Queue

This queue orders the next investigations by general migration value. Start only the highest item for which a real failing fixture exists.

### Completed In 0.8.0

- Relative zero-argument custom hooks expose direct shorthand state/setter pairs and state-capturing callbacks to one top-level caller destructuring.
- Writable React Router search parameters use native inline `URLSearchParams` updaters, push/replace history, signal recommits, and `popstate` synchronization.
- Guarded `localStorage` restoration and persistence compose through existing mount/dependency effects, preserving deterministic static fallbacks without a storage runtime.
- Reachable source compilation excludes unused React/Vite modules while preserving source diagnostics for every reachable module.
- Direct imported immutable maps fold to static HTML, and relative structured calculations reevaluate consumed scalar fields through existing binding ESM.
- Direct event-only package imports bundle into route handlers without executing during static rendering.
- Production Tailwind output, Inter assets, direct native SVG charts, and Excel export compose without adding Tailwind, Recharts, or a package runtime to Kudzu.
- FIRE migration validation covers all fourteen routes, URL/storage updates and reload, reset, presets, chart identity, Quiz recommendation, keyed Debt updates, Excel workbook creation, and zero-JavaScript Home/Books/Apps output.

### Completed In 0.8.1

- A direct custom-hook reset action may batch literal updates across its returned state/setter pairs. Imported callback literals are synthesized into existing behavior commands, and the FIRE Standard reset now remains owned by its hook while URL and storage effects observe the same commit.

### Completed In 0.8.2

- A direct array field from one top-level synchronous relative calculation result may feed a keyed intrinsic list. Route-specific evaluator ESM refreshes a compiler-owned array anchor before the existing list reconciler runs, preserving keyed SVG namespace, latest item handlers, and DOM identity without a chart or component runtime.
- The FIRE Standard projection exposes eleven calculated yearly points as accessible keyed SVG circles. Input commits update coordinates and labels while retaining every year node alongside the existing reactive path.

### Characterized In 0.8.3

- A direct clipboard action returned by a relative custom hook compiles through existing async native-handler ESM, including application-owned success and rejection state, without a clipboard runtime.
- A dependency effect using `setTimeout()` with directly returned `clearTimeout()` cleanup provides debounced synchronization; dependency changes and conditional unmount cancel pending work through existing effect ownership.
- The React/Vite migration fixture verifies latest-only debounce commits, unmount cancellation, fresh remount, clipboard success/failure, and zero JavaScript on its static sibling.
- Parent state plus focus, keyboard, and click handlers on calculated keyed SVG points drives an external accessible tooltip through existing native-handler and binding ESM. Recalculation preserves point identity and gives retained handlers the latest labels; the static sibling remains JavaScript-free.

### Completed In 0.8.5

- A directly returned relative custom-hook callback may own one private `null`-initialized timeout ref, directly clear its previous value, and assign one literal-delay `setTimeout()` whose callback updates hook state.
- One empty-dependency effect directly clears the latest timer on cleanup. The compiler lowers the ref to a hidden state slot shared by existing native-handler and effect contexts, so conditional unmount cancels pending work and remount starts fresh without a timer runtime.
- The React/Vite migration fixture verifies timer replacement, latest-only firing, conditional cleanup, fresh remount, source diagnostics for dynamic delays, and zero timer-specific runtime bytes.

### Completed In 0.8.7

- The FIRE migration's detailed Withdrawal and Debt charts compose from relative calculation fields, reactive SVG paths, calculated keyed SVG points, and ordinary parent state without a chart runtime.
- Withdrawal renders two series and 31 yearly targets. Debt renders remaining-balance comparisons plus cumulative principal and interest with monthly targets.
- Pointer, focus, click, Space, and Enter update external accessible tooltips. Input and debt-list changes preserve retained point and path identity while handlers read current labels.
- Home, Books, and Apps remain JavaScript-free. The expanded charts require no compiler or runtime change.
- A React Notes migration proved selected keyed rows need direct primitive parent state in ordinary class and ARIA expressions. Kudzu now reevaluates only retained row expressions on that state commit, preserving row identity without a component rerender.
- The supported boundary is a pure flat-row text or attribute expression combining the direct item/index with direct primitive parent state. Object/array state, arbitrary captures, nested-row parent state, and structural conditions remain diagnosed.

### Completed In 0.8.8

- The React Notes editor now retains its ordinary `notes.map(note => activeId === note.id && <Editor key={note.id} />)` source shape. Kudzu normalizes expression-bodied `condition && <Row />` and `condition ? <Row /> : null` keyed maps into existing pure filter selectors.
- False rows own no DOM or hooks; true-to-false transitions clean up state, effects, and refs, while re-entry creates fresh keyed ownership. Retained siblings preserve identity.
- Conditions may combine the current item with direct primitive parent state. Nested rows accept item-only conditions; map indexes, alternate JSX fallbacks, arbitrary captures, and impure predicates remain diagnosed.
- Imported build-known item-only conditions still fold to complete zero-JavaScript HTML, and no runtime capability was added.

### Completed In 0.8.9

- A React Notes migration preserves its Provider, relative `useNotes()` alias, consumer components, and parameterized CRUD actions. A direct custom-hook `useContext(Context)` return resolves one local or named relative Context module whose Provider value exposes direct state/setter pairs and synchronous actions.
- Context actions inline into existing route handler ESM and compile to concrete state operations. Private captures, dynamic Provider objects, and multiple Provider implementations remain diagnosed; no browser Context tree, callback registry, or shared runtime was added.

### Completed In 0.8.10

- A reduced shadcn/Radix-shaped dialog migration replaces package-owned Portal and Context behavior with the native `<dialog>` element while preserving a relative `forwardRef` component, props, children, object refs, and ordinary JSX handlers.
- Browser validation covers modal top-layer behavior, initial focus, confirm and cancel paths, and explicit trigger-focus restoration. Complete dialog HTML is pre-rendered, React and Radix are absent from output, and native event output remains specialized to the route's actual events.
- This is a source migration recipe rather than Radix package compatibility. `Portal`, `asChild`/`Slot`, element cloning, and arbitrary compound-component Context remain unsupported.

### Completed In 0.8.11

- A reduced React Hook Form-shaped signup migration replaces `useForm`, registration spreads, and submit wrappers with native controls, constraint validation, `FormData`, one direct async submit handler, and application-owned result state.
- Browser validation covers required and email constraints, submitting state, server-error ARIA, success cleanup, and retained uncontrolled values. Complete form HTML is pre-rendered, the route emits only one `submit` listener, the static sibling remains JavaScript-free, and React Hook Form is absent from output.
- This is a source migration recipe rather than React Hook Form package compatibility. Controllers, watchers, resolvers, dirty/touched proxies, dynamic field registration, and schema package execution during render remain unsupported.
- A reduced TanStack Query-shaped migration classifies build-known reads into async page rendering and browser-only reads into one dependency effect with application-owned loading, error, result, and primitive refetch state.
- Dependency replacement now invalidates prior unowned effect invocations before cleanup in both single-dependency and general runners. Delayed fetch setters from superseded invocations cannot overwrite newer keyed result state.
- Browser validation covers a fast refetch winning over a delayed response, cleanup ordering, HTTP failure, recovery, complete zero-JavaScript build output, and a static zero-JavaScript sibling. Query clients, Providers, caches, retries, deduplication, query-key arrays, optimistic updates, Suspense, and background refetch remain unsupported.

### Completed In 0.8.12

- A reduced Lucide React-shaped migration moves only used icons into one relative TSX module with direct intrinsic SVG roots, destructured size/stroke defaults, explicit prop forwarding, and no package factory or runtime.
- Static output preserves meaningful `role`/`title` labeling, decorative `aria-hidden`, explicit dimensions and fill overrides, `currentColor`, and normalized stroke attributes. The route ships no JavaScript, and an unreachable icon module is not compiled.
- Final route plans now gate handler emission, so build-folded component conditions cannot leave dead evaluator JavaScript in deploy artifacts. Dynamic icon lookup, `createLucideIcon()`, package-owned factories, and a generic icon runtime remain unsupported.

### Completed In 0.8.13

- A reduced fixture from [Memos](https://github.com/usememos/memos) preserves its memo-outline scroll spy: native heading links, active `aria-current`, smooth scrolling, hash replacement, capture-phase scroll/resize listeners, and animation-frame coalescing with cleanup.
- One effect-owned `useRef(0)` lowers to a serializable mutable effect capture when a local frame callback resets it and cleanup cancels the pending frame. Existing effect ownership handles setup, listener removal, and document disposal without state, a retained component, or an animation runtime.
- Chrome validation covers burst coalescing, active-heading updates, outline clicks, hash replacement, pending-frame cancellation, listener cleanup, and a zero-JavaScript static sibling. Ref aliases, cross-effect/event use, nonzero initializers, multiple scheduling assignments, and missing cancellation remain unsupported.
- A reduced fixture from [Excalidraw](https://github.com/excalidraw/excalidraw) preserves its active-room progressive sharing shape: a readonly collaboration URL, a Web Share button gated by `"share" in navigator`, direct `navigator.share()`, clipboard fallback, and accessible application-owned status.
- Browser capability conditions lower to a false static state plus one existing mount effect and state-owned conditional branch. Supported browsers mount the Share DOM and handler; unsupported browsers keep both out of the document and accessibility tree. Node's build-time `navigator` can no longer fold browser capability UI incorrectly.
- Chrome validation covers supported and unsupported capability paths, exact share/copy payloads, status updates, conditional handler ownership, and a zero-JavaScript static sibling. Dynamic properties, escaped capability values, composed tests, `navigator.canShare()`, QR package execution, collaboration transport, and general browser-expression rendering remain unsupported.
- A reduced fixture from [Cal.com](https://github.com/calcom/cal.diy) inlines the exact static `useSyncExternalStore` core of its shared media-query hook for 768px and 1024px Booker breakpoints. False server snapshots preserve desktop-first static HTML while browser changes update layout and visible-day density.
- Static media-query stores lower to existing primitive state and owned effects with exact `change` listener cleanup. No external-store runtime or media-query capability module is added; the work also fixes existing state-select text bindings so effect commits update optimized derived text as attributes already did.
- Chrome validation covers desktop fallback, tablet/mobile transitions, two subscriptions, document cleanup, ignored post-disposal changes, and a zero-JavaScript static sibling. Parameterized/imported hooks, dynamic queries, arbitrary stores, legacy listener APIs, and non-boolean snapshots remain unsupported.

### Completed In 0.8.14

- A reduced fixture from [colonni's blog](https://colonni.xyz/ko/posts/math-for-development) emits build-known MDX as static HTML without `eval()` or `new Function()`, generates `/ko` and `/en` through `getStaticPaths()`, prefixes native Link replacements from the build-known locale, and chooses a stored or browser-preferred locale at `/` while preserving query and hash. Request-time `Accept-Language` negotiation remains a host/edge concern.
- The blog's WalkingDog-shaped canvas lifecycle moves resource-private mutable values into one inline effect while retaining a direct canvas object ref. Bare `IntersectionObserver`, `performance`, recursive animation frames, keyboard/click listeners, and exact cleanup compile to one route-specific effect module without a canvas runtime.
- Chrome validation covers locale detection and redirect, prefixed links, static MDX, clipboard copy, reactive tabs, visible and hidden frame behavior, retained local drawing state, keyboard/click updates, exact disposal, and a zero-JavaScript static sibling. Component-level mutable value refs, callbacks shared across effects or handlers, arbitrary canvas graphs, and arbitrary runtime MDX remain unsupported.

### Completed In 0.8.15

- Build orchestration, ordered normalization, shared AST scope analysis, React and Router migration, browser resource passes, Worker compilation, development serving, and effect/handler code generation now have explicit module boundaries.
- Page and imported-source normalization share one pipeline with parent-pointer repair after each pass, while custom-hook timer metadata returns explicitly instead of using an AST-identity `WeakMap` side channel.
- The refactor preserves accepted syntax, source diagnostics, generated capability selection, static-route zero JavaScript, Worker determinism, browser ownership behavior, and all existing migration boundaries.
- Public documentation now presents Kudzu as a compiler that specializes supported React-shaped TSX into complete HTML and route-specific browser capabilities.

### Completed In 0.8.16

- Per-source handler, effect, binding, list-evaluator, and client-import registration belongs to one descriptor session rather than build orchestration.
- Pure collection expression and selector analysis is shared directly by React migration, reactive JSX, effects, and keyed-list discovery without a callback owned by `build.mjs`.
- Serializable route plans project through one pure capability manifest before runtime specialization and artifact emission.
- Component specialization, effect analysis, and keyed-list ownership remain in the main transformer until their AST-identity side tables can be replaced by explicit analysis results rather than moved behind large context objects.
- The continuation packet under `docs/next-architecture` fixes the Goal A patch sequence, output/performance gates, and explicit decision boundaries for deferred optimization, state/resource research, routing, and React compatibility.

### Completed In 0.8.17

- Supported command handlers cross the first JSON-safe ModuleIR slice: analysis emits plain command data, ModuleIR owns numeric signal/handler slots and lexical/source metadata, and focused codegen restores the existing `__kBehavior()` build ABI.
- Primitive SET, numeric ADD/subtract, functional setters, state logging, unary-plus, and negative-zero semantics remain specialized; non-finite values safely retain generic handler lowering.
- Same-named state in separate owners no longer aliases in IR, shared setter environments reuse signal identity, and synthetic specialized callbacks receive no fabricated source position.
- For unchanged source input, Counter HTML, route plans, command runtime, and generated artifacts remain byte-identical to 0.8.16; no browser capability or source syntax changed.

### Completed In 0.8.18

- Every compiled non-Worker source retains an ordered JSON-safe component analysis result covering lexical state/setter pairs, destructured props, object refs, deterministic IDs, and supported component specializations.
- Command signals now resolve ownership per referenced state rather than per setter-map identity, preserving distinct parent, specialized-child, keyed-row, reducer, custom-hook, and Context Provider relationships.
- Specialized prop records retain default application and direct signal links; imported hook declarations keep source provenance while synthetic ownership invents no source range.
- `core.mjs` remains authoritative for final route/layout state, ref, ID, conditional, and keyed allocation. Repeated, conditional, imported, setter-adapter, Context, and reducer fixtures preserve their existing ownership and deploy output.

## Cross-Cutting Performance Gates

Every migration feature must preserve:

- zero JavaScript for unaffected static routes;
- no new shared runtime bytes for routes that do not use the capability;
- complete initial HTML where data is build-known;
- direct DOM identity and cleanup semantics;
- no unexplained material build or browser regression;
- honest comparisons with matched content and behavior.

Production measurements receive one warm-up and at least seven interleaved builds. Browser measurements use rotating fresh profiles; use more runs when ranges overlap. Record raw/gzip artifacts, environment, raw arrays, medians, known losses, and deliberate limits.

## AI Migration Workflow

When migrating a React application:

1. Inspect routes, data timing, hooks, browser globals, router usage, packages, forms, and expected behavior.
2. Preserve ordinary React-shaped source where current Kudzu supports it.
3. Move build-known fetches into async pages/components.
4. Use `getStaticPaths()` for build-known dynamic routes.
5. Use native anchors unless same-document navigation is an explicit requirement.
6. Build and run browser checks after each route.
7. Reduce the first blocker before extending the compiler.
8. Measure generated HTML, raw/gzip JavaScript, build time, and affected interactions.
9. Document both the new support and its deliberate boundary.

## Explicit Non-Goals

- Running arbitrary React applications unchanged.
- React runtime, package ecosystem, islands, VDOM, hydration, or retained components.
- Shipping component functions to reproduce React rerender semantics.
- A default SPA router or global client application runtime.
- Request-time SSR, server actions, or a hidden application server.
- General state, stream, scheduler, widget, plugin, chart, map, editor, or virtualization frameworks.
- Implementing speculative compatibility because an API exists in React.

## Completion Definition

A migration feature is complete only when:

- it comes from a real or reduced conventional React fixture;
- ordinary source structure is preserved where safely compilable;
- static HTML remains the initial document;
- generated JavaScript is capability-specific and absent when unused;
- diagnostics explain unsupported nearby forms;
- browser tests prove behavior, ownership, and identity where applicable;
- performance and output impact are recorded;
- `npm run check` and `npm test` pass;
- public documentation states support, limits, and architecture tradeoffs.
