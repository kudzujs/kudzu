import { CodeBlock } from "../CodeBlock"

function BenchmarkTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return <div className="benchmark-table"><table>
    <thead><tr>{columns.map(column => <th>{column}</th>)}</tr></thead>
    <tbody>{rows.map(row => <tr>{row.map(value => <td>{value}</td>)}</tr>)}</tbody>
  </table></div>
}

export function ArchitectureSection() {
  return <section className="docs-section" id="architecture">
    <div className="docs-heading"><span>10</span><div><p>REFERENCE</p><h2>Compiler architecture</h2></div></div>
    <p>Kudzu treats supported React-shaped TypeScript and TSX as compiler input. It does not retain component functions or reproduce React rendering in the browser.</p>
    <CodeBlock language="text" code={`React-shaped TypeScript/TSX
  -> ordered normalization passes
  -> state/effect/handler/binding/list analysis
  -> complete HTML + route-specific capability ESM`} />
    <div className="docs-columns">
      <div><strong>Normalize</strong><p>Focused passes lower supported React, Router, browser-signal, resource-lifecycle, and render-control shapes. Parent pointers are repaired after structural changes.</p></div>
      <div><strong>Analyze</strong><p>The no-write source compiler finalizes JSON-safe ModuleIR and rejects unsupported syntax with source locations. Build-time rendering emits RouteIR, then pure capability planning projects CapabilityIR.</p></div>
      <div><strong>Generate</strong><p>Dedicated codegen modules produce native handlers, reactive evaluators, keyed-list expressions, effects, parameters, and navigation capabilities.</p></div>
      <div><strong>Exclude</strong><p>Final route plans remove unreferenced handlers and Workers. Static routes emit complete HTML and no browser JavaScript.</p></div>
    </div>
    <p>The compiler uses TypeScript AST transforms through <code>transpileModule()</code>; semantic type checking remains the separate <code>tsc --noEmit</code> project check. Each build owns an explicit ProjectSession containing its root, source records, graph operations, compiler paths, Worker compiler, canonical parsed modules, stable ModuleSymbols, and source-local SiteIds. Read-only consumers reuse canonical facts while each transformer context receives a private clone. Browser runtime is capability-specific rather than absent: a route receives only the modules it needs. The <a href="https://github.com/kudzujs/kudzu/tree/main/docs/next-architecture">architecture packet</a> records the current compiler and ordered large-application program.</p>
  </section>
}

export function BuildSection() {
  return <section className="docs-section" id="build">
    <div className="docs-heading"><span>11</span><div><p>REFERENCE</p><h2>Build output</h2></div></div>
    <CodeBlock language="text" code={`npm run build

dist/
├── index.html
├── docs/index.html
└── assets/
    ├── style.css
    ├── kudzu.js
    ├── kudzu-deps.js (when dependency-only effects are used)
    ├── kudzu-navigation.js (legacy navigation.routes)
    ├── kudzu-navigation-<route-hash>.js (per navigation group)
    ├── kudzu-binding.js (when used)
    ├── kudzu-effect.js (when effects are used)
    ├── kudzu-style.js (when reactive styles are used)
    ├── effects/ (when route-specific effects are used)
    ├── params/ (when runtimeParams is used)
    ├── handlers/ (evaluators and imported helpers)
    ├── kudzu-list.js (when used)
    ├── kudzu-native.js (when used)
    └── kudzu-serialization.js (when used)`} />
    <p>Static pages ship no JavaScript. Interactive pages receive only the command runtime and external handler or binding modules they use. Runtime bracket pages emit one fallback HTML file plus a route-specific parameter matcher. Production artifacts and <code>afterBuild()</code> output complete in a staging tree; public files cannot replace generated paths, and the previous <code>dist</code> remains available after ordinary build or hook failure. Ordered host rewrites are written to <code>.kudzu/kudzu-plan.json</code>.</p>
  </section>
}

export function BenchmarksSection() {
  return <section className="docs-section" id="benchmarks">
    <div className="docs-heading"><span>12</span><div><p>REFERENCE</p><h2>Benchmarks</h2></div></div>
    <div className="docs-callout"><strong>Current 0.8.50 release context</strong><span>The maintained cross-framework matrix below remains the 0.8.41 snapshot. The 0.8.45 source-scale result remains the latest compiler performance comparison; 0.8.50 changes compiler and build-time shared-state metadata only and makes no new performance claim.</span></div>
    <h3>Runtime matrix</h3>
    <BenchmarkTable columns={["Target", "Build", "JS raw / gzip", "Total raw / gzip", "Initial DOM"]} rows={[
      ["Kudzu 0.8.41 snapshot", "1,475.480 ms", "33,575 / 12,928 B", "212,963 / 49,936 B", "532.9 ms"],
      ["React 19.2.8", "856.231 ms", "193,685 / 60,043 B", "193,967 / 60,262 B", "510.6 ms"],
      ["Vue 3.5.40", "1,053.062 ms", "64,023 / 24,772 B", "64,304 / 24,993 B", "357.6 ms"],
      ["Svelte 5.56.7", "1,733.637 ms", "40,726 / 15,659 B", "41,007 / 15,878 B", "401.1 ms"]
    ]} />
    <p>Kudzu serves complete initial HTML; the controls start from client-rendered shells and ship their production client renderers. All targets passed correctness, accessibility, DOM identity, effect-cleanup, and browser-error gates. Raw arrays, quartiles, source hash, and environment metadata are checked in under <code>benchmarks/runtime-matrix/results</code>.</p>
    <h3>Large keyed restoration</h3>
    <BenchmarkTable columns={["Rows", "Build", "Append 33", "Filter", "Restore 1,999", "Reverse", "JS raw / gzip"]} rows={[
      ["2,000", "901.4 ms", "14.7 ms", "25.4 ms", "126.2 ms", "25.1 ms", "28,450 / 11,036 B"]
    ]} />
    <p>Seven fresh profiles checked retained identity and local state, released identity, fresh restored state, restored handlers, and reversal identity. The requested 21-profile run exceeded the ten-minute execution limit, so no 21-run result is claimed.</p>
    <CodeBlock language="shell" code={`RUNS=7 npm run benchmark:keyed
node benchmarks/runtime-matrix/run.mjs`} />
    <h3>Six-route commerce builds</h3>
    <BenchmarkTable columns={["Target", "Build", "Files", "Total raw / gzip"]} rows={[
      ["Kudzu", "867.188 ms", "17", "37,434 / 14,689 B"],
      ["React SSR + Vite hydration", "859.125 ms", "10", "209,270 / 66,741 B"],
      ["Next.js static export", "7,290.533 ms", "74", "814,186 / 247,596 B"],
      ["Nuxt generation", "7,334.287 ms", "26", "215,851 / 82,067 B"],
      ["SvelteKit static export", "4,725.279 ms", "19", "102,659 / 41,047 B"]
    ]} />
    <p>Seven rotating clean builds used the tracked matched-content commerce sources. The browser suite timed out in Kudzu's existing in-flight rejection-navigation wait before cross-target sampling, so no commerce browser timing is published.</p>
    <h3>Large static catalogs and query carry</h3>
    <p>On the maintained external 1,000-product fixture, sharing byte-identical route entries reduced cold build time from 13,866 ms to 13,203 ms, warm build time from 13,560 ms to 13,087 ms, and output from 10.48 MB to 9.53 MB across the three-run candidate check. A five-session Slow 4G form check reduced hidden query carry readiness from 783 ms to 348 ms. These focused samples establish the optimization direction but are not a claim that Kudzu is the fastest framework overall.</p>
    <p>A three-session Slow 4G static-catalog navigation experiment was rejected: native navigation reached product detail in 314 ms versus 575 ms, returned in 107 ms versus 297 ms, transferred 322.2 KB versus 511 KB, and preserved 15/18 degraded capabilities versus 12/18. Kudzu therefore keeps native document navigation as the catalog default.</p>
    <h3>Tracked Worker fixture</h3>
    <p>The maintained Worker build median is 1,823.2 ms. Its Worker graph is 907 B raw / 477 B gzip and its aggregate window graph is 12,148 B raw / 5,411 B gzip. The focused Chrome test verifies throughput, cadence, bounded history, stale writes, and 30-cycle termination and listener ownership.</p>
    <div className="docs-callout"><strong>Historical records retained</strong><span>Paired release measurements, optimization wins, raw arrays, limitations, and the dated 0.7.12 framework snapshot remain in PERFORMANCE.md for provenance. They are not current rankings.</span></div>
    <p>The <a href="https://github.com/kudzujs/kudzu/blob/main/PERFORMANCE.md">full performance record</a> separates current maintained runs from historical and external-workspace evidence.</p>
  </section>
}

export function LimitsSection() {
  return <section className="docs-section" id="limits">
    <div className="docs-heading"><span>13</span><div><p>REFERENCE</p><h2>Current limits</h2></div></div>
    <ul className="docs-limits">
      <li>Repeated ordinary same-file and relative-imported child components own independent state IDs and effect records. Direct JSON-safe primitive parent state passed to a destructured child prop remains reactive in child DOM bindings and effect dependencies. A direct setter or inline/simple <code>const</code> callback may cross one boundary and two additional direct forwarding components before one intrinsic handler invokes it. Each forwarding component must destructure and directly forward the callback once as an <code>on*</code> JSX prop. Specialized children may own directly serializable <code>useState()</code>, direct primitive prop <code>.toString()</code> string-state initialization, <code>useId()</code>, supported effects, and <code>null</code>-initialized object refs. Nested presentation components recursively specialize, including hooks on unconditional or statically truthy paths, and a parent-owned object ref may follow the same proven tree. Reactive conditional branches drop handlers and refs with removed DOM, delete child state, and clean up effects, then recreate ownership on re-entry. Fourth callback boundaries, intermediate adapters, aliases, spreads, repeated callback uses, dynamic nested hook paths, other dynamic state initializers, derived props, arbitrary callbacks, callback refs, captures, and dynamic calls remain unsupported.</li>
      <li>Reactive JSX text and attributes may reference recursively chained top-level immutable locals derived through supported pure primitive expressions from direct state. Kudzu substitutes the expressions and subscribes each source state. Fixed-locale <code>new Intl.NumberFormat("literal").format(Math.round(expression))</code> display chains are supported; dynamic locales/options, arbitrary calls, mutation, cycles, shadowed or block-local declarations, and structural JSX locals remain unsupported.</li>
      <li><code>forwardRef()</code> must directly initialize one top-level <code>const</code> component with one inline synchronous <code>(props, ref)</code> render function. The object ref must appear exactly once as the direct intrinsic root's <code>ref</code>. Indirect render functions, callback/composed refs, fragments, component roots, nested or repeated forwarding, imperative handles, and <code>memo(forwardRef(...))</code> are not supported.</li>
      <li><code>useId()</code> must initialize one top-level <code>const</code> identifier in an ordinary component and accepts no arguments. Values are deterministic within the rendered document and add no browser JavaScript. Keyed rows reject <code>useId()</code> because cloned row templates cannot safely duplicate HTML IDs.</li>
      <li>Object refs initialize directly with <code>null</code>, including refs declared by keyed row components. Callback refs, general mutable value refs, non-<code>null</code> initializers, and reactive <code>dangerouslySetInnerHTML</code> are not supported. The single private timeout ref described below is a narrow compiler-owned exception.</li>
      <li><code>useReducer</code> requires a pure synchronous two-parameter default or named reducer imported from a relative TypeScript module. An optional inline, same-file, or relative-imported synchronous one-parameter initializer may derive a directly serializable literal only from a directly serializable initial argument. Dispatch may cross one direct prop boundary into a specialized same-file or relative-imported synchronous component, including a keyed row with latest-item handlers and the ordinary keyed-row state/effect/ref capabilities. That component may pass one dispatch-containing callback, optionally wrapped in React <code>useCallback</code>, into one relative-imported synchronous intrinsic child. These specializations accept directly serializable primitive, plain-object, or array literal defaults and one final rest binding forwarded exactly once to a direct intrinsic root. Computed defaults, indirect rest use, non-keyed local state inside reducer-dispatch-specialized components, dynamic initializer calls or captures, package, namespace, local, async, and generator reducers, package imports or child imports outside handlers, further forwarding, and dispatch through context are not supported.</li>
      <li>Reduced Zustand migration stores require one exported <code>create(set =&gt; ({`{ data, ...actions }`}))</code> store with one serializable data property, direct property selectors, and synchronous capture-free merge-form actions. A shared layout must initialize the store outside keyed rows. Derived selectors, multiple data properties, middleware, <code>get</code>, subscriptions, equality functions, persist/devtools wrappers, async actions, helper captures, replacement updates, and indirect action forwarding are not supported.</li>
      <li>Reactive conditionals and flat intrinsic keyed lists are supported inside SVG and preserve the SVG namespace for inserted nodes. Keyed SVG points may use focus, keyboard, and click handlers to update parent state for an external accessible HTML tooltip; retained handlers read the latest item after list updates. Keyed-item conditions, nested SVG keyed lists, reactive MathML structures, and namespaced SVG attributes such as <code>xlinkHref</code> are not yet supported.</li>
      <li>Keyed lists require a local array-state anchor and intrinsic roots or specialized same-file/relative row components. Directly exported same-file rows may be reused at static and keyed JSX sites. Immutable local collection aliases may compose inline pure <code>filter</code>, direct-property <code>flatMap</code>, <code>Array.from</code>, immutable <code>slice(start, end?)</code>, and expression-bodied <code>toSorted</code> selectors and feed multiple keyed list sites when every reference is an analyzable collection source. Direct primitive state may drive pure string search predicates, slice bounds, comparator expressions, and pure flat-row text or attribute expressions that also read the current item/index. One-parameter expression callbacks may return <code>condition &amp;&amp; &lt;Row /&gt;</code> or <code>condition ? &lt;Row /&gt; : null</code>; the condition may read the item and direct primitive parent state, while nested forms are item-only. Object/array state, nested-row parent state, conditional map indexes, alternate JSX fallbacks, and block-bodied conditional maps remain unsupported. A relative-imported named or default synchronous function may accept one supported collection and directly return one such pipeline. Captures, additional statements, arbitrary bounds or comparators, package/namespace transforms, mutating <code>sort()</code>, and async functions remain unsupported. Ordinary map callbacks accept <code>(item)</code> or <code>(item, index)</code>; field keys own item identity and index keys own positional identity.</li>
      <li>A keyed row may contain multiple sibling maps over direct parent-item array properties recursively without a numeric depth limit. A block-bodied keyed <code>map</code> callback may declare one top-level direct-child collection <code>const</code> through a supported pure selector and use it once as a nested keyed list source before its final JSX return. Intrinsic, same-file, directly exported same-file, or relative-imported rows support recursive specialization, analyzable prop spreads, directly serializable literal prop defaults, direct intrinsic rest forwarding, forwarded JSX children, nested conditions, latest-item handlers, multiple directly serializable state slots, supported effects, and <code>null</code>-initialized object refs.</li>
      <li>Multiple or mixed-use computed child collection locals, parent capture in child rows, component cycles, package or namespace row imports, export-list/default aliases, non-JSX component references, dynamic/computed prop spreads or defaults, indirect/repeated rest use, rest-forwarded children, derived-expression captures, dynamic row state, non-<code>null</code> refs, and arbitrary or asynchronous collection callbacks remain unsupported.</li>
      <li>Reactive statement control flow supports terminal returns and adjacent exhaustive JSX assignment; effectful branches, loops, <code>switch</code>, <code>try</code>, and later reassignment remain unsupported.</li>
      <li><code>useEffect</code> supports inline block-bodied callbacks, one same-component top-level simple <code>const</code> setup function, directly returned inline or simple <code>const</code> cleanup, DOM ownership in ordinary conditional children and supported keyed rows, and literal dependency arrays. Arrays may contain multiple direct JSON-safe primitive state/runtime parameters, destructured child props passed directly from parent state, or direct property paths over ordinary object state; every selected value is compared with <code>Object.is</code>, and same-turn changes cause one cleanup and rerun. One top-level immutable local derived through a supported pure primitive expression from state may also be a dependency, with latest setup/cleanup evaluation. Keyed rows accept direct <code>item.&lt;field&gt;</code> primitive properties. An inline canvas effect may own local mutable drawing state, a recursive animation frame, one <code>IntersectionObserver</code>, and native listeners when cleanup cancels, disconnects, and removes those resources. Component-level mutable refs or callbacks shared across effects/handlers, whole-object, prototype-sensitive, object-valued, spread, arbitrary-call, dynamic or indirect callbacks, callback/cleanup parameters or generators, cross-component functions, and other return forms are not supported.</li>
      <li>Direct async handlers and directly returned relative custom-hook callbacks may call native <code>navigator.clipboard.writeText()</code>; applications own permission errors and feedback state. Effect-owned debounce uses <code>setTimeout()</code> plus directly returned <code>clearTimeout()</code> cleanup. One directly returned relative custom-hook callback may own one <code>useRef&lt;number | null&gt;(null)</code>, directly clear its previous timer, and assign one numeric-literal-delay timeout when one empty-dependency effect directly clears the latest timer on cleanup. Multiple refs, dynamic delays, aliases, intervals, unowned delayed writes, and arbitrary timed callback graphs remain unsupported.</li>
      <li>Relative TypeScript Workers are limited to unshadowed <code>new Worker(new URL("../name.worker.ts", import.meta.url), {`{ type: "module" }`})</code> directly inside an inline effect. Worker graphs allow relative TypeScript ESM runtime imports only; JSX, package runtime imports, import-equals declarations, dynamic imports, <code>require()</code>, outside-source paths, ordinary runtime imports of Worker source, event handlers, imported helpers, and imported keyed-row effects are rejected.</li>
      <li>React Router migration input supports a named or aliased <code>Link</code> used directly in JSX with exactly one static root-relative <code>to</code> and native anchor props. It supports a direct zero-argument <code>useParams()</code> call on a <code>runtimeParams</code> bracket route, one top-level <code>const [params]</code> or <code>const [params, setParams]</code> <code>useSearchParams()</code> binding with direct static <code>get()</code> locals and synchronous inline setter updaters, and one top-level <code>useNavigate()</code> binding called directly from nested browser callbacks with safe static root-relative destinations. Kudzu applies <code>base</code>, redirects path/query reads to route-specific capabilities, lowers search writes to native push history or exactly <code>{`{ replace: true }`}</code> to replace history, lowers navigation to <code>location.assign()</code> or <code>location.replace()</code>, and erases the package import. Dynamic destinations, <code>NavLink</code>, direct-value query setters, dynamic outer query methods, aliases, render-time writes/navigation, other options, other router hooks, router-only props, spreads, conflicting <code>href</code>, and default/namespace imports are not supported. Build-known <code>getStaticPaths()</code> routes use props.</li>
      <li><code>runtimeParams = true</code> requires full bracket segments, cannot be combined with <code>getStaticPaths()</code>, and requires an exact-file-first fallback rewrite on the production host. Catch-all runtime parameters are not supported.</li>
      <li>Static locale routing uses <code>getStaticPaths()</code>, build-known locale props, relative components that emit prefixed native anchors, and optionally one root mount effect reading a stored locale or <code>navigator.languages</code>. Kudzu does not execute <code>next-intl</code> or provide request-time <code>Accept-Language</code> negotiation; configure that redirect at the host or edge when browser-side selection is too late.</li>
      <li>There is no request-time SSR, server actions, default/general router, HMR, or DevTools. Opt-in navigation supports independent emitted exact/runtime groups with one shared layout per group; cross-group path domains cannot overlap. Conditional and keyed effects follow their layout or route lifetime.</li>
      <li>Imported client helpers require relative TypeScript modules; package runtime imports, dynamic imports, JSX helpers, and non-serializable captures are rejected.</li>
      <li>Compilation follows relative runtime imports and re-exports from page entries, plus validated Worker references. Unreachable TypeScript files are excluded. A direct map over an imported exported JSON-safe immutable array folds to static rows. A synchronous relative calculation may initialize one top-level immutable result whose direct static primitive fields feed reactive JSX; state arguments use build values initially and route binding ESM reevaluates the helper after commits. One direct array field may feed a keyed intrinsic map through a compiler-owned array anchor, preserving retained DOM and SVG keys. The field must remain a JSON-safe array; indirect result aliases, dynamic fields, and nested calculated SVG lists are unsupported.</li>
      <li>Package imports may be referenced directly inside intrinsic JSX event-handler callbacks only. They are removed from build-time modules and bundled into route handler ESM. Render-time, effect, helper-indirect, mixed, side-effect, and dynamic package imports are rejected.</li>
    </ul>
  </section>
}
