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
    <p>The compiler uses TypeScript AST transforms through <code>transpileModule()</code>; semantic type checking remains the separate <code>tsc --noEmit</code> project check. Each build owns an explicit ProjectSession containing its root, source records, graph operations, compiler paths, Worker compiler, canonical parsed modules, stable ModuleSymbols, and source-local SiteIds. Read-only consumers reuse canonical facts while each transformer context receives a private clone. Browser runtime is capability-specific rather than absent: a route receives only the modules it needs. The <a href="https://github.com/kudzujs/kudzu/tree/v0.8.35/docs/next-architecture">architecture packet</a> records the current compiler and ordered large-application program.</p>
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
    <div className="docs-callout"><strong>Current 0.8.35 results</strong><span>Performance records include stable-symbol A/B output, current matched whole-build context, output replacement, keyed interaction, optimization wins, and correctness-guard costs. Retained measurements and limitations are recorded in PERFORMANCE.md.</span></div>
    <h3>Staged output replacement</h3>
    <BenchmarkTable columns={["Target", "Pages", "Replacement build", "Deploy output"]} rows={[
      ["0.8.31 baseline", "1,011", "20,392.7 ms", "3,056 files / 11,137,074 B"],
      ["0.8.32 pre-release candidate", "1,011", "19,229.1 ms", "Byte-identical"]
    ]} />
    <p>Twenty-one alternating local replacement builds exercised staging, collision validation, promotion, and previous-tree removal before final lock/recovery hardening. The observed median was 5.71% lower while every deploy path and SHA-256 hash matched. This is a recorded fixture result, not a general build-speed claim.</p>
    <h3>Async native-handler ownership guard</h3>
    <BenchmarkTable columns={["Target", "5,000 sync events", "Native fixture JS raw / gzip", "Late ownership"]} rows={[
      ["0.8.30 baseline", "6.4 ms", "13,629 B / 6,177 B", "Writes after unmount"],
      ["0.8.31", "6.4 ms", "13,838 B / 6,271 B", "Invalidated"]
    ]} />
    <p>Twenty-one alternating headless Chrome 151 processes measured real synchronous DOM listener dispatch after one warm-up. Both medians are 6.4 ms and the recorded ranges overlap. The deterministic cost is 209 B raw / 94 B aggregate gzip across <code>kudzu-native.js</code> and <code>kudzu-serialization.js</code>; all other native fixture artifacts are byte-identical.</p>
    <h3>Large keyed restoration</h3>
    <BenchmarkTable columns={["Target", "Append 33", "Filter", "Restore 1,999", "Reverse", "JS raw / gzip"]} rows={[
      ["0.8.23 baseline", "2.6 ms", "4.6 ms", "26.3 ms", "6.2 ms", "28,308 B / 10,937 B"],
      ["0.8.24", "2.7 ms", "4.6 ms", "21.1 ms", "6.1 ms", "28,435 B / 10,972 B"]
    ]} />
    <p>Twenty-one fresh Chrome 151 profiles measured a 2,000-row local-state list. Restoration improved 19.77%; its 20.4–21.9 ms range did not overlap the 25.7–27.3 ms baseline range. Append, filter, and reverse establish no material change. Every run checked retained identity/state, released identity, fresh restored state, restored handlers, and reversal identity.</p>
    <CodeBlock language="shell" code={`RUNS=21 CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  npm run benchmark:keyed`} />
    <h3>1,000-product compiler build</h3>
    <BenchmarkTable columns={["Target", "Pages", "Build median", "Output files", "Normalization bytes"]} rows={[
      ["0.8.23 baseline", "1,011", "6,684.7 ms", "3,056", "0 B"],
      ["0.8.24", "1,011", "6,266.5 ms", "3,056", "0 B"]
    ]} />
    <p>Twenty-one alternating clean builds of the public <a href="https://github.com/SimYunSup/kudzu-based-bench">kudzu-based-bench</a> fixture measured a 6.26% improvement after no-op normalization passes stopped repeating full-AST parent repair. The catalog is generated once outside timing; both revisions run the same complete Kudzu build. Published cross-framework headline numbers are not used for this paired Kudzu claim.</p>
    <h3>Repeated route-entry transforms</h3>
    <BenchmarkTable columns={["Target", "Pages", "Build median", "Deploy output"]} rows={[
      ["Repeated transform", "1,011", "13,851.0 ms", "Baseline"],
      ["0.8.25 exact-source reuse", "1,011", "12,581.4 ms", "Byte-identical"]
    ]} />
    <p>Seven alternating clean builds on the recorded Linux environment measured a 9.17% improvement by reusing esbuild output only when the complete generated native, parameter, or effect route-entry source matches. The map lasts for one build; route-relative URLs are resolved before lookup.</p>
    <h3>Tracked Worker fixture</h3>
    <CodeBlock language="shell" code={`npm run benchmark
CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \\
  node --test --test-name-pattern="bundles relative TypeScript Workers" test/framework.test.mjs`} />
    <p>On Node 22.23.2, the 0.8.24 candidate retained a 907 B raw / 477 B gzip Worker graph and a 12,148 B raw / 5,411 B aggregate gzip window graph. The maintained benchmark and focused Chrome test verify build output, throughput, cadence, bounded history, stale writes, and 30-cycle start/termination and listener ownership.</p>
    <div className="docs-callout"><strong>Historical comparison</strong><span>This dated 0.7.12 snapshot retains raw arrays in PERFORMANCE.md. It is not a current 0.8.35 framework ranking.</span></div>
    <h3>Historical 0.7.12 keyed local state</h3>
    <BenchmarkTable columns={["Target", "Initial rows", "JS gzip", "Build", "Edit", "Reverse", "Remove", "Re-add"]} rows={[
      ["Kudzu", "Yes", "8,610 B", "238 ms", "0.5 ms", "4.2 ms", "1.3 ms", "1.9 ms"],
      ["Vue CSR", "No", "24,018 B", "199 ms", "0.9 ms", "3.8 ms", "1.3 ms", "0.9 ms"],
      ["Svelte CSR", "No", "13,686 B", "279 ms", "0.8 ms", "20.1 ms", "1.6 ms", "1.3 ms"],
      ["React CSR", "No", "59,564 B", "186 ms", "2.1 ms", "7.5 ms", "2.4 ms", "1.9 ms"]
    ]} />
    <p>This corrected 0.7.12 rerun used 31 rotating unthrottled fresh Chrome 150 profiles per target and in-page <code>MutationObserver</code> completion timing. All 124 profiles passed row/input identity and removal/re-add reset checks. Kudzu led edit, tied Vue on remove, beat React and Svelte on reverse, and trailed Vue by 0.4 ms on reverse. A separate seven-profile 4x run measured Kudzu at 2.3/17.3/5.9/8.6 ms for edit/reverse/remove/re-add. The discarded external-CDP polling method added roughly 42–49 ms to reverse and unstable phase delay to short operations. Kudzu and the CSR targets have different initial-delivery architectures, so JavaScript, total output, and build values are not equivalent loading comparisons. The <a href="https://github.com/kudzujs/kudzu/blob/main/PERFORMANCE.md">raw performance record</a> contains environment, versions, methodology, caveats, and corrected distributions.</p>
    <p>Older excluded-workspace snapshots remain in the <a href="https://github.com/kudzujs/kudzu/blob/v0.8.31/PERFORMANCE.md">raw performance archive</a> for provenance, but are omitted here because their runners and raw arrays are unavailable.</p>
  </section>
}

export function LimitsSection() {
  return <section className="docs-section" id="limits">
    <div className="docs-heading"><span>13</span><div><p>REFERENCE</p><h2>Current limits</h2></div></div>
    <ul className="docs-limits">
      <li>Repeated ordinary same-file and relative-imported child components own independent state IDs and effect records. Direct JSON-safe primitive parent state passed to a destructured child prop remains reactive in child DOM bindings and effect dependencies. A direct setter may cross one boundary when invoked once by a direct intrinsic event handler; inline/simple <code>const</code> setter callbacks may use that adapter shape or direct forwarding, and the child may own directly serializable <code>useState()</code>, direct primitive prop <code>.toString()</code> string-state initialization, <code>useId()</code>, supported effects, and <code>null</code>-initialized object refs. Nested same-file and relative-imported components recursively specialize, including hooks on unconditional or statically truthy paths. A parent-owned object ref may cross the same boundary. Reactive conditional branches drop handlers and refs with removed DOM, delete child state, and clean up effects, then recreate ownership on re-entry. Dynamic nested hook paths, setter forwarding through another boundary, other dynamic state initializers, derived props, arbitrary callbacks, callback refs, multiple callback uses, captures, and dynamic calls remain unsupported.</li>
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
      <li><code>useEffect</code> supports inline block-bodied callbacks, one same-component top-level simple <code>const</code> setup function, directly returned inline or simple <code>const</code> cleanup, DOM ownership in ordinary conditional children and supported keyed rows, and literal dependency arrays. Arrays may contain multiple direct JSON-safe primitive state/runtime parameters or destructured child props passed directly from parent state; every value is compared with <code>Object.is</code>, and same-turn changes cause one cleanup and rerun. One top-level immutable local derived through a supported pure primitive expression from direct state may also be a dependency, with latest setup/cleanup evaluation. Keyed rows accept direct <code>item.&lt;field&gt;</code> primitive properties. An inline canvas effect may own local mutable drawing state, a recursive animation frame, one <code>IntersectionObserver</code>, and native listeners when cleanup cancels, disconnects, and removes those resources. Component-level mutable refs or callbacks shared across effects/handlers, whole-item, nested, prototype-sensitive, object, spread, arbitrary-call, dynamic or indirect callbacks, callback/cleanup parameters or generators, cross-component functions, and other return forms are not supported.</li>
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
