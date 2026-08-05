import { CodeBlock } from "../CodeBlock"

function BenchmarkTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return <div className="benchmark-table"><table>
    <thead><tr>{columns.map(column => <th>{column}</th>)}</tr></thead>
    <tbody>{rows.map(row => <tr>{row.map(value => <td>{value}</td>)}</tr>)}</tbody>
  </table></div>
}

export function BuildSection() {
  return <section className="docs-section" id="build">
    <div className="docs-heading"><span>10</span><div><p>REFERENCE</p><h2>Build output</h2></div></div>
    <CodeBlock language="text" code={`npm run build

dist/
├── index.html
├── docs/index.html
└── assets/
    ├── style.css
    ├── kudzu.js
    ├── kudzu-deps.js (when dependency-only effects are used)
    ├── kudzu-navigation.js (legacy navigation.routes)
    ├── kudzu-navigation-&lt;route-hash&gt;.js (per navigation group)
    ├── kudzu-binding.js (when used)
    ├── kudzu-effect.js (when effects are used)
    ├── kudzu-style.js (when reactive styles are used)
    ├── effects/ (when route-specific effects are used)
    ├── params/ (when runtimeParams is used)
    ├── handlers/ (evaluators and imported helpers)
    ├── kudzu-list.js (when used)
    ├── kudzu-native.js (when used)
    └── kudzu-serialization.js (when used)`} />
    <p>Static pages ship no JavaScript. Interactive pages receive only the command runtime and external handler or binding modules they use. Runtime bracket pages emit one fallback HTML file plus a route-specific parameter matcher. Ordered host rewrites are written to <code>.kudzu/kudzu-plan.json</code> and passed to <code>afterBuild()</code>.</p>
  </section>
}

export function BenchmarksSection() {
  return <section className="docs-section" id="benchmarks">
    <div className="docs-heading"><span>11</span><div><p>REFERENCE</p><h2>Benchmarks</h2></div></div>
    <div className="docs-callout"><strong>Benchmark provenance</strong><span>The cross-framework tables below are historical matched snapshots from a local benchmark workspace that is not checked into this repository. Their runner, competitor fixtures, and raw arrays are unavailable in the current checkout, so they are not current 0.7.12 measurements and cannot be reproduced by CI. Architecture differences are stated with each table.</span></div>
    <h3>Tracked Worker fixture</h3>
    <CodeBlock language="shell" code={`npm run benchmark
CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \\
  node --test --test-name-pattern="bundles relative TypeScript Workers" test/framework.test.mjs`} />
    <p>At commit <code>05e5cc2</code> on Apple M3, macOS 26.5.2, and Node 25.6.1, one warm-up plus seven clean builds measured 404.2, 401.3, 408.2, 404.4, 399.9, 408.8, and 402.0 ms, with a 404.2 ms median. The Worker graph measured 907 B raw / 475 B gzip and the complete dashboard window graph measured 11,960 B raw / 5,365 B aggregate gzip. Chrome 150.0.7871.187 passed throughput, cadence, bounded-history, stale-write, and 30-cycle lifecycle checks.</p>
    <h3>Current 1,000-row keyed local state</h3>
    <BenchmarkTable columns={["Target", "Initial rows", "JS gzip", "Build", "Edit", "Reverse", "Remove", "Re-add"]} rows={[
      ["Kudzu", "Yes", "8,610 B", "238 ms", "0.5 ms", "4.2 ms", "1.3 ms", "1.9 ms"],
      ["Vue CSR", "No", "24,018 B", "199 ms", "0.9 ms", "3.8 ms", "1.3 ms", "0.9 ms"],
      ["Svelte CSR", "No", "13,686 B", "279 ms", "0.8 ms", "20.1 ms", "1.6 ms", "1.3 ms"],
      ["React CSR", "No", "59,564 B", "186 ms", "2.1 ms", "7.5 ms", "2.4 ms", "1.9 ms"]
    ]} />
    <p>This corrected 0.7.12 rerun used 31 rotating unthrottled fresh Chrome 150 profiles per target and in-page <code>MutationObserver</code> completion timing. All 124 profiles passed row/input identity and removal/re-add reset checks. Kudzu led edit, tied Vue on remove, beat React and Svelte on reverse, and trailed Vue by 0.4 ms on reverse. A separate seven-profile 4x run measured Kudzu at 2.3/17.3/5.9/8.6 ms for edit/reverse/remove/re-add. The discarded external-CDP polling method added roughly 42–49 ms to reverse and unstable phase delay to short operations. Kudzu and the CSR targets have different initial-delivery architectures, so JavaScript, total output, and build values are not equivalent loading comparisons. The <a href="https://github.com/kudzujs/kudzu/blob/main/PERFORMANCE.md">raw performance record</a> contains environment, versions, methodology, caveats, and corrected distributions.</p>
    <h3>Historical matched snapshots</h3>
    <p>The historical Goal A fixture covers a matched six-route commerce journey with complete initial HTML, shared layout state, product options, optimistic cart success and rejection, accessible rollback, and product-to-cart navigation. Browser medians used seven rotating fresh Chrome profiles per target with 4x CPU slowdown, 100 ms latency, and 200 KiB/s throughput.</p>
    <h3>Desktop commerce</h3>
    <BenchmarkTable columns={["Target", "JS gzip", "Cold transfer", "Cold LCP", "Warm LCP", "Startup", "Heap", "Interaction", "Product → cart"]} rows={[
      ["Kudzu", "7,334 B", "35,260 B", "332 ms", "156 ms", "122.6 ms", "650,708 B", "4.8 ms", "5.6 ms"],
      ["React + Vite", "61,464 B", "202,842 B", "332 ms", "264 ms", "179.9 ms", "1,062,520 B", "10.2 ms", "9.9 ms"],
      ["Next.js", "190,090 B", "547,615 B", "324 ms", "176 ms", "434.4 ms", "2,168,412 B", "14.0 ms", "30.0 ms"],
      ["Nuxt", "67,620 B", "195,953 B", "324 ms", "224 ms", "247.9 ms", "1,721,348 B", "4.5 ms", "29.6 ms"],
      ["SvelteKit", "32,474 B", "90,939 B", "376 ms", "184 ms", "143.8 ms", "999,496 B", "6.3 ms", "21.8 ms"]
    ]} />
    <p>The recorded fixture emitted 35,355 deploy bytes. Its 7,334 B gzip product graph included the 2,425 B navigation capability. Validated near-viewport document prefetch reduced the recorded 128.7 ms product-to-cart transition to 5.6 ms without removing complete documents or native fallback.</p>
    <h3>Desktop and mobile behavior</h3>
    <BenchmarkTable columns={["Profile", "Cold LCP", "Warm LCP", "Interaction", "Product → cart", "Reject feedback", "Rollback/error", "CLS"]} rows={[
      ["Desktop", "332 ms", "156 ms", "4.8 ms", "5.6 ms", "4.0 ms", "112.1 ms", "0"],
      ["Mobile", "420 ms", "220 ms", "5.6 ms", "8.7 ms", "4.1 ms", "158 ms", "0"]
    ]} />
    <p>The mobile row is retained from the previous matched run using a 390x844 viewport, 6x CPU slowdown, 150 ms latency, and 150 KiB/s throughput. Both profiles recorded zero cold and warm layout shift.</p>
    <h3>Build startup</h3>
    <p>The recorded seven-run matched commerce build measured Kudzu at 486.8 ms and React at 545.4 ms, making Kudzu 10.7% faster in that historical run. It recorded 88.1% less product JavaScript, 52.9% faster interaction, and 43.4% faster product-to-cart navigation than React. The excluded workspace also found byte-for-byte output with the module cache disabled.</p>
    <h3>1,000-row keyed effect</h3>
    <BenchmarkTable columns={["Target", "Initial rows", "JS gzip", "Build", "Selected update", "Unrelated update", "Reverse"]} rows={[
      ["Astro native", "Yes", "381 B", "998 ms", "0.4 ms", "0.2 ms", "5.7 ms"],
      ["Kudzu", "Yes", "8,264 B", "426 ms", "3.6 ms", "2.4 ms", "8.8 ms"],
      ["Vue CSR", "No", "25,091 B", "935 ms", "5.8 ms", "2.4 ms", "10.5 ms"],
      ["Svelte CSR", "No", "12,848 B", "1,040 ms", "5.7 ms", "4.1 ms", "58.1 ms"],
      ["React CSR", "No", "60,921 B", "1,198 ms", "9.8 ms", "5.9 ms", "16.8 ms"]
    ]} />
    <p>Each row owns one effect depending on its name. Browser timing starts only after every target has 1,000 rows and effects ready. Kudzu's targeted changed-root update measures 3.6 ms, versus Vue at 5.8 ms, Svelte at 5.7 ms, and React at 9.8 ms. List reconciliation remains O(n); Kudzu and Vue both measure 2.4 ms on the unrelated detail update. Kudzu and Astro emit the initial rows while the other targets are CSR; JavaScript, output, and build values therefore are not architecture-equivalent comparisons.</p>
    <h3>1,000-row nested child components</h3>
    <BenchmarkTable columns={["Target", "Initial rows", "Initial JS gzip", "Build", "Child update + condition", "Child reverse", "Parent reverse", "Parent remove"]} rows={[
      ["Astro native", "Yes", "287 B", "1,030 ms", "0.5 ms", "0.4 ms", "3.9 ms", "0.2 ms"],
      ["Kudzu", "Yes", "7.0 KB", "477 ms", "1.3 ms", "0.4 ms", "5.0 ms", "0.7 ms"],
      ["Svelte CSR", "No", "13.1 KB", "1,050 ms", "2.7 ms", "1.2 ms", "6.7 ms", "1.3 ms"],
      ["Vue CSR", "No", "24.6 KB", "940 ms", "4.9 ms", "2.5 ms", "6.1 ms", "2.2 ms"],
      ["React CSR", "No", "59.5 KB", "1,211 ms", "11.8 ms", "5.0 ms", "8.2 ms", "4.4 ms"]
    ]} />
    <p>The fixture renders 100 keyed parents with 10 keyed child components each. The selected update changes child text and flips its condition while preserving the child root; reverse and removal operations also require child and parent identity. Kudzu beats Svelte, Vue, and React on all four operations. Astro remains the hand-written native lower bound.</p>
    <div className="docs-callout"><strong>Shared nested output</strong><span>One child row prototype supplies inert branches and patch descriptors to every parent. The final fixture emits 339,601 B HTML and 359,271 B total raw output; the compressed-file sum is 24,173 B.</span></div>
    <p>Ordinary flat-list output remains byte-for-byte equal to the pre-feature build because nested ownership and prototypes are capability-gated. Kudzu and Astro emit initial rows; the CSR targets do not, so output sizes are not architecture-equivalent.</p>
    <p>These results describe one matched fixture on one machine, not framework ecosystem size or every rendering mode. Prefetch improves eligible application transitions; direct loads still transfer and render complete standalone documents.</p>
  </section>
}

export function LimitsSection() {
  return <section className="docs-section" id="limits">
    <div className="docs-heading"><span>12</span><div><p>REFERENCE</p><h2>Current limits</h2></div></div>
    <ul className="docs-limits">
      <li>Repeated ordinary same-file and relative-imported child components own independent state IDs and effect records. Direct JSON-safe primitive parent state passed to a destructured child prop remains reactive in child DOM bindings and effect dependencies. A direct setter may cross one boundary when invoked once by a direct intrinsic event handler; inline/simple <code>const</code> setter callbacks may use that adapter shape or direct forwarding, and the child may own directly serializable <code>useState()</code>, direct primitive prop <code>.toString()</code> string-state initialization, <code>useId()</code>, supported effects, and <code>null</code>-initialized object refs. Nested same-file and relative-imported components recursively specialize, including hooks on unconditional or statically truthy paths. A parent-owned object ref may cross the same boundary. Reactive conditional branches drop handlers and refs with removed DOM, delete child state, and clean up effects, then recreate ownership on re-entry. Dynamic nested hook paths, setter forwarding through another boundary, other dynamic state initializers, derived props, arbitrary callbacks, callback refs, multiple callback uses, captures, and dynamic calls remain unsupported.</li>
      <li>Reactive JSX text and attributes may reference recursively chained top-level immutable locals derived through supported pure primitive expressions from direct state. Kudzu substitutes the expressions and subscribes each source state. Fixed-locale <code>new Intl.NumberFormat("literal").format(Math.round(expression))</code> display chains are supported; dynamic locales/options, arbitrary calls, mutation, cycles, shadowed or block-local declarations, and structural JSX locals remain unsupported.</li>
      <li><code>forwardRef()</code> must directly initialize one top-level <code>const</code> component with one inline synchronous <code>(props, ref)</code> render function. The object ref must appear exactly once as the direct intrinsic root's <code>ref</code>. Indirect render functions, callback/composed refs, fragments, component roots, nested or repeated forwarding, imperative handles, and <code>memo(forwardRef(...))</code> are not supported.</li>
      <li><code>useId()</code> must initialize one top-level <code>const</code> identifier in an ordinary component and accepts no arguments. Values are deterministic within the rendered document and add no browser JavaScript. Keyed rows reject <code>useId()</code> because cloned row templates cannot safely duplicate HTML IDs.</li>
      <li>Object refs initialize directly with <code>null</code>, including refs declared by keyed row components. Callback refs, mutable value refs, non-<code>null</code> initializers, and reactive <code>dangerouslySetInnerHTML</code> are not supported.</li>
      <li><code>useReducer</code> requires a pure synchronous two-parameter default or named reducer imported from a relative TypeScript module. An optional inline, same-file, or relative-imported synchronous one-parameter initializer may derive a directly serializable literal only from a directly serializable initial argument. Dispatch may cross one direct prop boundary into a specialized same-file or relative-imported synchronous component, including a keyed row with latest-item handlers and the ordinary keyed-row state/effect/ref capabilities. That component may pass one dispatch-containing callback, optionally wrapped in React <code>useCallback</code>, into one relative-imported synchronous intrinsic child. These specializations accept directly serializable primitive, plain-object, or array literal defaults and one final rest binding forwarded exactly once to a direct intrinsic root. Computed defaults, indirect rest use, non-keyed local state inside reducer-dispatch-specialized components, dynamic initializer calls or captures, package, namespace, local, async, and generator reducers, package imports or child imports outside handlers, further forwarding, and dispatch through context are not supported.</li>
      <li>Reduced Zustand migration stores require one exported <code>create(set =&gt; ({`{ data, ...actions }`}))</code> store with one serializable data property, direct property selectors, and synchronous capture-free merge-form actions. A shared layout must initialize the store outside keyed rows. Derived selectors, multiple data properties, middleware, <code>get</code>, subscriptions, equality functions, persist/devtools wrappers, async actions, helper captures, replacement updates, and indirect action forwarding are not supported.</li>
      <li>Reactive conditionals and flat intrinsic keyed lists are supported inside SVG and preserve the SVG namespace for inserted nodes. Keyed SVG points may use focus, keyboard, and click handlers to update parent state for an external accessible HTML tooltip; retained handlers read the latest item after list updates. Keyed-item conditions, nested SVG keyed lists, reactive MathML structures, and namespaced SVG attributes such as <code>xlinkHref</code> are not yet supported.</li>
      <li>Keyed lists require a local array-state anchor and intrinsic roots or specialized same-file/relative row components. Directly exported same-file rows may be reused at static and keyed JSX sites. Immutable local collection aliases may compose inline pure <code>filter</code>, direct-property <code>flatMap</code>, <code>Array.from</code>, immutable <code>slice(start, end?)</code>, and expression-bodied <code>toSorted</code> selectors and feed multiple keyed list sites when every reference is an analyzable collection source. Direct primitive state may drive pure string search predicates, slice bounds, and comparator expressions. A relative-imported named or default synchronous function may accept one supported collection and directly return one such pipeline. Captures, additional statements, arbitrary bounds or comparators, package/namespace transforms, mutating <code>sort()</code>, and async functions remain unsupported. Map callbacks accept <code>(item)</code> or <code>(item, index)</code>; field keys own item identity and index keys own positional identity.</li>
      <li>A keyed row may contain multiple sibling maps over direct parent-item array properties recursively without a numeric depth limit. A block-bodied keyed <code>map</code> callback may declare one top-level direct-child collection <code>const</code> through a supported pure selector and use it once as a nested keyed list source before its final JSX return. Intrinsic, same-file, directly exported same-file, or relative-imported rows support recursive specialization, analyzable prop spreads, directly serializable literal prop defaults, direct intrinsic rest forwarding, forwarded JSX children, nested conditions, latest-item handlers, multiple directly serializable state slots, supported effects, and <code>null</code>-initialized object refs.</li>
      <li>Multiple or mixed-use computed child collection locals, parent capture in child rows, component cycles, package or namespace row imports, export-list/default aliases, non-JSX component references, dynamic/computed prop spreads or defaults, indirect/repeated rest use, rest-forwarded children, derived-expression captures, dynamic row state, non-<code>null</code> refs, and arbitrary or asynchronous collection callbacks remain unsupported.</li>
      <li>Reactive statement control flow supports terminal returns and adjacent exhaustive JSX assignment; effectful branches, loops, <code>switch</code>, <code>try</code>, and later reassignment remain unsupported.</li>
      <li><code>useEffect</code> supports inline block-bodied callbacks, one same-component top-level simple <code>const</code> setup function, directly returned inline or simple <code>const</code> cleanup, DOM ownership in ordinary conditional children and supported keyed rows, and literal dependency arrays. Arrays may contain multiple direct JSON-safe primitive state/runtime parameters or destructured child props passed directly from parent state; every value is compared with <code>Object.is</code>, and same-turn changes cause one cleanup and rerun. One top-level immutable local derived through a supported pure primitive expression from direct state may also be a dependency, with latest setup/cleanup evaluation. Keyed rows accept direct <code>item.&lt;field&gt;</code> primitive properties. Whole-item, nested, prototype-sensitive, object, spread, arbitrary-call, dynamic or indirect callbacks, callback/cleanup parameters or generators, cross-component functions, and other return forms are not supported.</li>
      <li>Direct async handlers and directly returned relative custom-hook callbacks may call native <code>navigator.clipboard.writeText()</code>; applications own permission errors and feedback state. Effect-owned debounce uses <code>setTimeout()</code> plus directly returned <code>clearTimeout()</code> cleanup. Private timer refs, unowned delayed event writes, intervals, and arbitrary timed callback graphs are not supported ownership forms.</li>
      <li>Relative TypeScript Workers are limited to unshadowed <code>new Worker(new URL("../name.worker.ts", import.meta.url), {`{ type: "module" }`})</code> directly inside an inline effect. Worker graphs allow relative TypeScript ESM runtime imports only; JSX, package runtime imports, import-equals declarations, dynamic imports, <code>require()</code>, outside-source paths, ordinary runtime imports of Worker source, event handlers, imported helpers, and imported keyed-row effects are rejected.</li>
      <li>React Router migration input supports a named or aliased <code>Link</code> used directly in JSX with exactly one static root-relative <code>to</code> and native anchor props. It supports a direct zero-argument <code>useParams()</code> call on a <code>runtimeParams</code> bracket route, one top-level <code>const [params]</code> or <code>const [params, setParams]</code> <code>useSearchParams()</code> binding with direct static <code>get()</code> locals and synchronous inline setter updaters, and one top-level <code>useNavigate()</code> binding called directly from nested browser callbacks with safe static root-relative destinations. Kudzu applies <code>base</code>, redirects path/query reads to route-specific capabilities, lowers search writes to native push history or exactly <code>{`{ replace: true }`}</code> to replace history, lowers navigation to <code>location.assign()</code> or <code>location.replace()</code>, and erases the package import. Dynamic destinations, <code>NavLink</code>, direct-value query setters, dynamic outer query methods, aliases, render-time writes/navigation, other options, other router hooks, router-only props, spreads, conflicting <code>href</code>, and default/namespace imports are not supported. Build-known <code>getStaticPaths()</code> routes use props.</li>
      <li><code>runtimeParams = true</code> requires full bracket segments, cannot be combined with <code>getStaticPaths()</code>, and requires an exact-file-first fallback rewrite on the production host. Catch-all runtime parameters are not supported.</li>
      <li>There is no request-time SSR, server actions, default/general router, HMR, or DevTools. Opt-in navigation supports independent emitted exact/runtime groups with one shared layout per group; cross-group path domains cannot overlap. Conditional and keyed effects follow their layout or route lifetime.</li>
      <li>Imported client helpers require relative TypeScript modules; package runtime imports, dynamic imports, JSX helpers, and non-serializable captures are rejected.</li>
      <li>Compilation follows relative runtime imports and re-exports from page entries, plus validated Worker references. Unreachable TypeScript files are excluded. A direct map over an imported exported JSON-safe immutable array folds to static rows. A synchronous relative calculation may initialize one top-level immutable result whose direct static primitive fields feed reactive JSX; state arguments use build values initially and route binding ESM reevaluates the helper after commits. One direct array field may feed a keyed intrinsic map through a compiler-owned array anchor, preserving retained DOM and SVG keys. The field must remain a JSON-safe array; indirect result aliases, dynamic fields, and nested calculated SVG lists are unsupported.</li>
      <li>Package imports may be referenced directly inside intrinsic JSX event-handler callbacks only. They are removed from build-time modules and bundled into route handler ESM. Render-time, effect, helper-indirect, mixed, side-effect, and dynamic package imports are rejected.</li>
    </ul>
  </section>
}
