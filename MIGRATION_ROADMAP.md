# React Migration Roadmap

This document is the source of truth for Kudzu's product direction, architecture invariants, and future development order. Read it before extending React-shaped syntax or browser capabilities.

The completed `0.9.0` execution sequence is maintained in [`docs/next-architecture/0.9-semantic-compression.md`](./docs/next-architecture/0.9-semantic-compression.md), with session-level implementation records in [`docs/next-architecture/0.9-implementation-plan.md`](./docs/next-architecture/0.9-implementation-plan.md). The next authorized execution train is [`docs/next-architecture/application-capability-release-plan.md`](./docs/next-architecture/application-capability-release-plan.md): each application-capability section owns one minor release, each independently accepted work packet owns one patch release, and the train closes with the separately gated 1.0 AI delivery proof. The completed compiler foundation and longer-term research remain in [`docs/next-architecture/large-application-ai-native-roadmap.md`](./docs/next-architecture/large-application-ai-native-roadmap.md); this document remains authoritative when selecting or accepting a migration capability.

[`GOAL_A.md`](./GOAL_A.md) and [`GOAL_B.md`](./GOAL_B.md) are completed capability-validation records. Their commerce and realtime dashboard fixtures prove general lifecycle, navigation, async-workflow, and Worker capabilities; they are not separate product verticals or future priority lists.

The post-0.9 local discovery audit of Memos, Apache Answer, and Actual Budget is recorded in [`docs/next-architecture/1.0-large-application-compatibility-audit.md`](./docs/next-architecture/1.0-large-application-compatibility-audit.md). Its passing reduced builds are not whole-application migrations. Each package-component, browser-data, router/layout, provider, and localization shape requires a separate executable evidence packet under the authorized application-capability release plan before implementation.

The first Apache Answer reduction is complete: one direct top-level `const match = useMatch("/exact-path")` over a named or aliased React Router import folds case-insensitively against the build-known application route. Reused relative components produce route-specific static HTML with zero browser bytes. Layout use, runtime-parameter pages, params, wildcards, query/hash patterns, trailing slashes, dynamic values, indirect calls, and pattern objects remain diagnosed.

The next Apache Answer reductions preserve its direct numeric page fallback and string order fallback over `useSearchParams()`. Both reuse nullable query signals and existing primitive binding ESM; the string form accepts only a static element of a named relative JSON-safe immutable array. Dynamic indexes, arbitrary wrappers, and general query expressions remain diagnosed.

Apache Answer layouts may retain named React Bootstrap `Row` and `Col` components when they use children, static `className`, and numeric literal `Col` spans from 1 through 12 for `xs` through `xxl`. Compiler normalization emits native Bootstrap grid classes with no browser JavaScript and covers all 63 observed static-breakpoint Col sites; Bootstrap stylesheet ownership remains with the application. Dynamic/object/boolean grid props and broader React Bootstrap components remain separate evidence packets.

Apache Answer's `useTranslation()` cannot be folded safely because its language resources come from 46 YAML files, browser storage, and server responses. Kudzu emits a source-located diagnostic directing build-known locales to `getStaticPaths()` and props or browser-only selection to an owned effect; it does not substitute English or ship i18next.

Apache Answer's SWR/axios/qs question reads now have an executable migration path through one native fetch effect with application-owned loading/error/data state. Derived `page` and `order` query dependencies restart the effect, stale responses lose setter authority, recommendation endpoints and HTTP recovery remain explicit, nested keyed tags retain list ownership, and a static sibling remains JavaScript-free. No cache, Provider, retry scheduler, SWR, axios, or query runtime is added.

Apache Answer authentication now has a browser-proven layout-owned session path: native login form submission persists a token, a mount effect restores and validates it, shared header/settings consumers read one package-neutral state record, and a 401 clears storage/state before native replacement navigation. A deterministic server verifies anonymous, invalid login, valid login, reload restoration, shared consumers, and expiry while the public sibling remains JavaScript-free. Broader server-fed settings stores remain a subsequent gate.

Apache Answer's first route-shell gate replaces `RouterProvider` and nested `Outlet` ownership with seven directly addressable Kudzu file routes, one ordinary shared shell, native anchors, and runtime question/tag parameters. Questions, tags, admin dashboard, and unwrapped legal output build without a browser router; the two bracket routes emit only pathname capability and rewrite metadata.

Apache Answer authoring/admin intake now builds native question creation and keyed administration without form, editor, query, or state package runtimes. Constraint-backed title/markdown fields, controlled preview, markdown file import, local draft mutation, keyed admin rows, and deletion compile through existing handlers/lists while a legal sibling remains JavaScript-free. Rich CodeMirror ownership, server validation, upload progress, and destructive confirmation remain later acceptance gates.

## North Star

An AI should be able to migrate ordinary React-shaped TypeScript and TSX to CDN-deployable static HTML, CSS, and only the route-specific ESM capabilities actually used, with minimal source restructuring.

```text
ordinary React-shaped TSX
  -> Kudzu compiler specialization
  -> complete static HTML + CSS + capability-specific ESM
```

Kudzu is a general migration compiler. Shops, dashboards, documentation, blogs, landing pages, forms, and administration screens are outcomes built on the same compiler model. No application category defines Kudzu's architecture.

Syntax compatibility does not mean reproducing React wholesale. Kudzu accepts the statically analyzable subset it can lower to build-time output and direct browser capabilities. Unsupported nearby patterns must fail at build time with a file, line, and actionable explanation.

## Version Outcomes

### 0.9.0: Proven Browser Advantage

`0.9.0` is not complete when Semantic Compression merely works internally. On behavior-, content-, accessibility-, and environment-matched applications, Kudzu must prove its intended advantage against React + Vite and representative Vue, Svelte, and Astro baselines:

- the least initial and session browser JavaScript;
- no hydration and complete initial HTML;
- fastest or statistically tied-fastest interaction readiness, event, and navigation results;
- no material CPU or memory loss;
- stronger JavaScript failure resilience;
- no remaining material large-route build-scaling weakness.

The completed 0.9 plan defines the cross-framework comparison and release gate. The active application packet is `0.19.2` in the capability release plan below. Benchmark-only feature omission, unmatched accessibility, weighted scores that hide losses, and unrecorded environment differences do not count as proof.

### 0.10.0 Through 0.21.x: Application Capability Release Train

The post-0.9 train proves Kudzu as an application framework before freezing
1.0. Local/shared state, async/server data, routing/lifetime, forms, large
lists, overlays, external UI, long-lived resources, lazy loading, React
migration, AI tooling, and production-scale proof each own one minor release.
Each independently reviewable evidence packet owns one patch release. The exact
sequence, stop conditions, completion gates, and active status are maintained in
[`docs/next-architecture/application-capability-release-plan.md`](./docs/next-architecture/application-capability-release-plan.md).

### 1.0.0: Best Framework For AI-Assisted Delivery

`1.0.0` means Kudzu Semantic IR v1 is stable and Kudzu is demonstrably the best framework in the maintained AI delivery benchmark, not merely the framework with the smallest runtime.

Use the same agent model, system constraints, tools, starting application requirements, context budget, time budget, and acceptance suite for every framework. Agents receive public framework documentation and normal diagnostics; Kudzu must not receive private compiler knowledge or framework-specific prompt help unavailable to competitors.

Evaluate complete production-representative tasks across at least content, forms, CRUD/shared state, commerce-derived state, and resource/realtime ownership. Each result must pass behavior, accessibility, build, browser, and output checks before it counts as successful.

Kudzu qualifies for `1.0.0` only when repeated trials show:

- success rate is highest or statistically tied for highest against the maintained framework set;
- median cost per successful task is lowest;
- completion time, correction cycles, tool calls, compiler attempts, and context consumption are lowest or statistically tied for lowest;
- ordinary source abstraction and maintainability are not sacrificed to win;
- the resulting browser output still passes the complete `0.9.0` performance advantage gate;
- most new ecosystem coverage is delivered through normalization, adapters, diagnostics, and optimization rather than Semantic Kernel growth.

Publish task definitions, prompts, framework versions, raw attempts including failures, acceptance results, token/cost accounting, source retention, artifacts, and browser measurements. A build-only success, cherry-picked successful run, or toy-only benchmark cannot authorize `1.0.0`.

## Product Invariants

- Never add React as a runtime or production dependency.
- Never add a VDOM, hydration pass, retained browser component tree, generic component rerenderer, or hook dispatcher.
- Static routes ship zero client JavaScript.
- Interactive routes ship only the capabilities they use.
- Prefer build-time execution whenever all inputs are available during the build.
- State setters update logical state immediately and batch direct DOM writes at synchronous-turn boundaries.
- Async handler state writes, queued commits, and captured ref resolution end when its mounted DOM owner is released; application promises and ordinary reads may finish without reviving that ownership.
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
- Relative source CSS imports close over each page's reachable TypeScript import/re-export graph; configured styles remain explicitly global. Enhanced navigation loads destination CSS before route DOM replacement, reuses shared layout links, and removes outgoing route links.
- Interactive routes use deterministic signature-keyed runtime families. Equal standalone capability manifests share files, while each enhanced-navigation group unions its routes into one ESM singleton family for persistent layout state and lifecycle ownership.
- React import normalization for supported named/aliased hooks, direct `React.*` members, fragments, same-file `memo`, inline `useCallback`, direct intrinsic `forwardRef`, top-level `useId`, and analyzable `useMemo` expressions and collections.
- Function components, props, children, context, direct bindings, conditions, controlled form properties, refs, and synchronous or async handlers.
- `useState`, independent repeated non-keyed child state with conditional mount ownership, reduced relative-imported `useReducer`, direct dispatch specialization, and reduced Zustand-shaped shared state lowered through package-neutral shared-state/action IR and proven by migration fixtures.
- Mount and dependency effects with cleanup, route/layout lifetimes, conditional/keyed ownership, stale-write isolation, and relative TypeScript Workers.
- Direct browser-only package references in inline effect setup/cleanup callbacks bundle into route-owned effect ESM without entering build-time component execution or static sibling output.
- A CodeMirror-class editor may retain one package instance across one mount or guarded lazy activation effect and later dependency update effects through a null-initialized ref with one direct setup assignment and null-reset cleanup. The lazy form assigns only inside the literal package import's direct `.then()` callback. The ref lowers to existing owner-scoped object state; package DOM, bidirectional updates, errors, accessibility, conditional disposal, and fresh remount require no loader, widget runtime, or React island.
- A Chart.js-class canvas instance uses the same retained-handle contract. One mount effect owns construction, resize listeners, and destroy/reset cleanup; later data effects read the instance without replacing it. Enhanced route disposal and fresh remount require no chart runtime or package-specific IR.
- A SortableJS-class drag engine may temporarily move keyed DOM during a gesture, but Kudzu state remains the durable order owner. The package callback restores authored DOM order before one immutable state reorder; existing keyed reconciliation then preserves row identity. Keyboard controls use the same state operation, package disposal is effect-owned, and static siblings exclude the package.
- Keyed local-state and imported static collections, pure selectors, nested direct-property lists, recursive and directly exported row specialization, static/keyed component reuse, analyzable specialized prop spreads, serializable literal defaults, direct intrinsic rest forwarding, forwarded JSX children, latest-item handlers, row state/effects/refs, and stable keyed identity.
- Direct object-state props with one-segment binding/effect/list consumers when the child directly maps an array field; ComponentAnalysis links every consumer to the parent SignalIR without authored field state or a browser component.
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
- In `0.8.61`, a ClimateCompatibleGrowth-shaped relative `useDebounce(value, delay)` hook may accept one direct primitive state and numeric literal delay, initialize one returned state from the source build value, and own one exact timeout dependency effect with cleanup. Dynamic delays, non-primitive state, aliases, additional effects, intervals, and missing cleanup remain diagnosed.
- In `0.8.62`, a ClimateCompatibleGrowth dropdown may retain one direct `createRef()` DOM ref and pass it with an inline direct literal setter callback to its relative outside-click hook. The exact document `mousedown` listener and matching cleanup reuse existing ref serialization, setter capture, and conditional effect ownership. Aliases, dynamic event names, additional listeners, and mismatched cleanup remain diagnosed.
- Writable React Router search parameters use native inline `URLSearchParams` updaters, push/replace history, signal recommits, and `popstate` synchronization.
- Guarded `localStorage` restoration and persistence compose through existing mount/dependency effects, preserving deterministic static fallbacks without a storage runtime.
- Reachable source compilation excludes unused React/Vite modules while preserving source diagnostics for every reachable module.
- Direct imported immutable maps fold to static HTML, and relative structured calculations reevaluate consumed scalar fields through existing binding ESM.
- Direct event-handler and inline owned-effect package imports bundle into route handler/effect ESM without executing during static rendering.
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
- In `0.8.46`, the same Notes migration may omit action-only setters from its public Context type and authored Provider value when the corresponding state remains exposed. Kudzu restores those setters only in build scratch so existing concrete state operations, RouteIR signals, CRUD behavior, and zero-Context runtime output remain unchanged. Fully hidden action state and exposed setters without state remain diagnosed.
- In `0.8.47`, a specialized setter-callback child may initialize local state directly from one primitive parent state prop. Build scratch reads the parent signal's build value while retaining the structural prop signal for handlers/effects. `0.8.57` extends that exact path to a parent state authored with one JSON-safe plain-object literal; independent child draft state and parent commit behavior pass in the FIRE-derived callback fixture. Array props, aliases, property paths, composed expressions, and object `.toString()` remain diagnosed.
- In `0.8.58`, a direct keyed item prop may initialize one row-owned object draft. Retained keys preserve that draft and DOM identity through reorder; removal releases it, and re-adding the key clones the current item into fresh state. Aliases, property paths, composed expressions, and indirect item props remain diagnosed.
- In `0.8.59`, the ClimateCompatibleGrowth teaching-kit `Dropdown` migration may initialize local array state from one direct parent array-state prop and commit it through a direct `on*` callback or matching `set*` setter prop. Parent and child arrays remain independently owned, mounted drafts do not auto-synchronize, and aliases, property paths, composed arrays, indirect callbacks, and additional `set*` forwarding remain diagnosed.
- In `0.8.60`, that dropdown may preserve its direct `useEffect(() => setSelectedItems(items), [items, setSelectedItems])` synchronization shape. Kudzu proves the matching parent state/setter pair, removes the stable setter dependency, and compares the direct child array-state dependency by identity through existing effect ownership. Composed values, aliases, mismatched pairs, cleanup, and automatic parent-to-draft synchronization remain diagnosed.
- In `0.8.48`, one setter-callback prop may be called once from each of multiple direct intrinsic event handlers in the specialized leaf. Each call lowers independently to the same parent signal; forwarding fan-out, aliases, non-handler uses, and repeated calls inside one handler remain diagnosed, and no callback registry or handler runtime is added.
- In `0.8.49`, one component may forward the same destructured setter callback directly through multiple child component `on*` props. Each branch specializes independently to the original parent signal within the existing three-boundary limit; aliases, ordinary props, spreads, and a fourth boundary remain diagnosed.

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
- Top-level `useRef(null)` and `useRef(0)` values used exclusively through direct `.current` references in one inline effect graph lower to invocation-private closure objects in effect ESM. Existing effect ownership handles SDK/WebSocket handles, generation invalidation, animation frames, dependency replacement, listener removal, BFCache-aware document disposal, and cleanup without serialized captures, ResourceIR, or a retained component.
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

### Completed In 0.8.19

- Native and effect callback exports now finalize into JSON-safe HandlerIR with ordered signals, setters, captures, snapshot policy, imports, roles, source provenance, and generated module source.
- Reactive bindings, list expressions, and list condition evaluators finalize into BindingIR with explicit states, captures, parameters, imports, and deterministic export slots.
- Existing tagged collection expressions and selectors are canonical DerivedIR for rendered lists and derived effect dependencies; transformed source embeds the registered records rather than parallel analyzer values.
- AST, `Map`, and `Set` callback descriptors remain private only until source-local lowering completes. Handler codegen now performs no TypeScript traversal or state/capture/reducer/import discovery, while command-only routes retain zero handler ESM.

### Completed In 0.8.20

- Every rendered keyed collection now finalizes into JSON-safe KeyedBlockIR with deterministic slots, explicit parent/child links, collection and selector ownership, key/index policy, source provenance, and complete component-specialization membership.
- Keyed row states and refs retain their declaration source and specialization owner. Command, native, effect, list-expression, list-conditional, and calculated-collection records link back to their owning keyed block.
- Previous transformer-wide keyed value, condition, event, nested-list, effect, and rendered-list AST side tables were removed. AST remains private only inside immediate source-local validation and lowering.
- `core.mjs` remains authoritative for final list IDs, key paths, route descriptors, complete HTML, DOM identity, and exact state/effect/ref release; accepted syntax and browser output are unchanged.

### Completed In 0.8.21

- Every supported effect finalizes into JSON-safe EffectIR with setup HandlerIR, cleanup, ordered signal/DerivedIR dependencies, component/keyed ownership, source provenance, and Worker edges.
- Effect dependency/resource analysis and Worker rewriting return explicit results; transformer-wide effect AST side tables and build-wide mutable Worker references were removed.
- Existing route/layout/conditional/keyed lifetime allocation, stale-write invalidation, cleanup order, accepted syntax, and browser output remain unchanged.

### Completed In 0.8.22

- The existing rendered route plan is RouteIR v1, with route-local numeric state slots beside unchanged browser IDs and readable state names; it is not duplicated in ModuleIR.
- The existing pure capability projection is CapabilityIR v1 and every runtime/list codegen consumer rejects unsupported versions.
- List, parameter, core, effect, binding, native, and navigation source generation moved out of `build.mjs` behind focused fail-closed generators; `build.mjs` decreased by 267 lines and coordinates stage outputs.
- Complete-site and representative deploy artifacts remain byte-identical to `v0.8.21`; only additive RouteIR version/slot metadata changes build plans.

### Completed In 0.8.23

- Source normalization, TSX semantic analysis, ModuleIR finalization, handler generation, and build-module generation now belong to one no-write source compiler boundary.
- `compileSource()` returns JSON-safe, project-relative source results; `build.mjs` consumes them without TypeScript traversal or feature analysis.
- Source graph resolution and shared path conversion have focused owners, while Worker compilation directly owns Worker graph emission.
- Complete-site and representative deploy artifacts remain byte-identical to `v0.8.22`; diagnostics, RouteIR, CapabilityIR, browser ownership, and accepted syntax are unchanged.

### Completed In 0.8.24

- Goal B adds a maintained 2,000-row keyed browser benchmark with fresh-profile timing and ownership checks.
- Safe large flat-list restoration batches mount-hook discovery, reducing the measured median by 19.77% while retained-heavy append, filter, reverse, identity, state reset, and handler behavior remain unchanged.
- No-op normalization passes skip redundant recursive parent repair, reducing the measured 1,000-product build median by 6.26% with equivalent output.
- Identical generated route-entry transformation remains the next evidence-backed Goal B investigation; it is not implemented without an isolated benchmark.

### Completed In 0.8.25

- Seven alternating builds of the 1,000-product, 1,011-page fixture authorized build-local exact-source reuse for identical generated native, parameter, and effect route-entry transforms, improving the median by 9.17% with identical deploy paths and bytes.
- Normalization pass results and finalized ModuleIR cross-slot references now fail closed at their compiler boundaries.
- Node 22 compatibility, required Chrome coverage, packed-package installation, version alignment, and post-publish registry checks are explicit release gates.

### Completed In 0.8.26

- The maintained commerce runner requires byte-identical output by default while explicit expected deltas preserve historical benchmark reproduction.
- The standard suite counts exact route-entry transforms across repeated, distinct, and new-build sources and protects the safe keyed bulk-mount guard plus its per-root fallback.
- Goal B records which build, output, keyed, Worker, integration, and heap evidence exists; no new optimization is authorized without another reproduced material loss.

### Characterized In 0.8.27

- Reduced E2B Dashboard terminal and route-owned WebSocket fixtures establish callback-shared mutable browser resources, asynchronous generation invalidation, dependency replacement, exact cleanup, and BFCache retain/resume/discard behavior. Exclusive effect-private refs now compile through ordinary effect ESM; shared transports and cross-owner subscriptions remain Goal C research.
- Unsupported page-level mutable value refs fail during source analysis with a source location and the existing effect-owned animation-frame exception; no resource API or runtime is added.
- The large-application and AI-native execution plan orders symbol resolution, semantic operations, project/module analysis, IR authority, application foundations, ecosystem compatibility, AI tooling, and scale validation before broad feature work.

### Completed In 0.8.28

- A source-local binding index assigns deterministic lexical identities to locals, parameters, imports, captures, known globals, and unresolved references after normalization.
- Reactive binding capture/import discovery and lowering distinguish outer application values from same-named browser globals and nested callback parameters without changing source syntax or adding browser bytes.
- Synthesized keyed expressions retain the existing fail-safe lowering path; native handler, effect, and remaining descriptor consumers stay ordered behind the next symbol-aware compiler patch.

### Completed In 0.8.29

- Native handler, effect, remaining binding, keyed evaluator, optimized-command, and effect-resource discovery/lowering use source-local lexical identity when the binding index owns the complete AST.
- Same-named callback parameters, locals, imports, browser globals, state values, setters, reducers, observer handles, and animation-frame handles no longer alias through identifier spelling alone.
- Imported, specialized, and compiler-synthesized trees retain the existing conservative fallback; no public API, source syntax, ModuleIR contract, browser runtime, or capability bytes were added.

### Completed In 0.8.30

- Reachable ordinary source validates relative runtime imports and re-exports before compilation and reports unresolved edges at the original importer file, line, column, and specifier.
- Ordinary dynamic `import()` fails during graph discovery rather than surviving into generated `.kudzu` modules; relative, package, template, and computed forms share one source-located boundary.
- Ordinary and Worker graph ownership remain separate, while type-only and unreachable source stay excluded. Export-name validation, ProjectSession, runtime behavior, and public APIs remain unchanged.

### Completed In 0.8.31

- Pending async native handlers lose state-write, queued-commit, and captured-ref authority when enhanced navigation, keyed removal, conditional removal, or document disposal releases their mounted DOM owner.
- Direct and captured setters cannot recreate released state, queued commits clear without touching replacement DOM, and captured object refs resolve to `null` after release.
- Chrome coverage removes and recreates the same route and keyed row before old work resolves, proving replacement ownership stays fresh without cancelling application promises or adding a scheduler.
- The focused 5,000-event Chrome dispatch median remains 6.4 ms; the native fixture retains its emitted paths with a measured 209 B raw / 94 B aggregate gzip correctness cost.

### Completed In 0.8.32

- Production artifacts complete in staging; public/generated collisions and late `afterBuild()` failure preserve the previous successful `dist`.
- Same-root builds use an exclusive PID lock, stale locks fail closed, interrupted promotion backups recover on the next admitted build after lock removal, and successful replacement removes stale output.
- Route HTML writes use bounded batches, keyed reverse/remove paths avoid repeated map reconstruction, and binding/condition commits share one dispatch without adding a runtime or public API.

### Completed In 0.8.33

- Build root, source paths, source graph resolution, source records, and Worker compilation now belong to one explicit ProjectSession created for each build.
- Programmatic build and development entry points accept an explicit root while omitted roots preserve call-time CWD and existing CLI behavior.
- One process compiles two independent roots with identical module names and verifies isolated config, HTML, `.kudzu`, source results, and Worker output; no browser runtime or migration syntax changes.

### Completed In 0.8.34

- Each unchanged source module is parsed and export-summarized once per ProjectSession, with source-text invalidation and no cross-project cache sharing.
- Read-only graph consumers share a canonical AST while importer normalization deep-clones every node and repairs independent parent links before transformation.
- A 100-importer fixture proves bounded parse/summary work and identical source results without changing accepted migration syntax or browser output.

### Completed In 0.8.35

- Cross-module declarations resolve through stable project-relative ModuleSymbol records rather than transformed AST identity or readable names.
- Source-local SiteIds identify imports, re-exports, component calls, hooks, keyed lists, effects, and ownership records across private transformer clones.
- Default/named exports, aliases, barrel chains, `export *`, cycles, ambiguity, repeated compilation, and source-dependent cache invalidation are covered without changing migration syntax or browser runtime behavior.
- The 100-importer fixture reduces private clones from 200 to 100 and records a small directional build improvement; current React/Vue/Svelte/Astro whole-build and artifact context is retained in `PERFORMANCE.md`.

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
