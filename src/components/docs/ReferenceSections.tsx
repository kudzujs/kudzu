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
    <p>The Goal A fixture covers a matched six-route commerce journey with complete initial HTML, shared layout state, product options, optimistic cart success and rejection, accessible rollback, and product-to-cart navigation. Browser medians use seven rotating fresh Chrome profiles per target with 4x CPU slowdown, 100 ms latency, and 200 KiB/s throughput.</p>
    <h3>Desktop commerce</h3>
    <BenchmarkTable columns={["Target", "JS gzip", "Cold transfer", "Cold LCP", "Warm LCP", "Startup", "Heap", "Interaction", "Product → cart"]} rows={[
      ["Kudzu", "7,334 B", "35,260 B", "332 ms", "156 ms", "122.6 ms", "650,708 B", "4.8 ms", "5.6 ms"],
      ["React + Vite", "61,464 B", "202,842 B", "332 ms", "264 ms", "179.9 ms", "1,062,520 B", "10.2 ms", "9.9 ms"],
      ["Next.js", "190,090 B", "547,615 B", "324 ms", "176 ms", "434.4 ms", "2,168,412 B", "14.0 ms", "30.0 ms"],
      ["Nuxt", "67,620 B", "195,953 B", "324 ms", "224 ms", "247.9 ms", "1,721,348 B", "4.5 ms", "29.6 ms"],
      ["SvelteKit", "32,474 B", "90,939 B", "376 ms", "184 ms", "143.8 ms", "999,496 B", "6.3 ms", "21.8 ms"]
    ]} />
    <p>Kudzu emits 35,355 deploy bytes. Its 7,334 B gzip product graph includes the 2,425 B navigation capability; all three sizes are unchanged because this top-level-only fixture retains the smaller specialized path. Validated near-viewport document prefetch reduced the original 128.7 ms product-to-cart transition to 5.6 ms in the current run without removing complete documents or native fallback.</p>
    <h3>Desktop and mobile behavior</h3>
    <BenchmarkTable columns={["Profile", "Cold LCP", "Warm LCP", "Interaction", "Product → cart", "Reject feedback", "Rollback/error", "CLS"]} rows={[
      ["Desktop", "332 ms", "156 ms", "4.8 ms", "5.6 ms", "4.0 ms", "112.1 ms", "0"],
      ["Mobile", "420 ms", "220 ms", "5.6 ms", "8.7 ms", "4.1 ms", "158 ms", "0"]
    ]} />
    <p>The mobile row is retained from the previous matched run using a 390x844 viewport, 6x CPU slowdown, 150 ms latency, and 150 KiB/s throughput. Both profiles recorded zero cold and warm layout shift.</p>
    <h3>Build startup</h3>
    <p>Initial runs found a repeatable 6–7% small-build loss from TypeScript and esbuild module startup. Kudzu now enables Node's native module compile cache before lazily loading the compiler. The current seven-run matched commerce build measured Kudzu at 486.8 ms and React at 545.4 ms, making Kudzu 10.7% faster in that run. Kudzu shipped 88.1% less product JavaScript and measured 52.9% faster interaction and 43.4% faster product-to-cart navigation than React. Disabling the cache preserves byte-for-byte output. Generated-handler lowering and shared-Program experiments did not improve the combined median and were not retained.</p>
    <h3>1,000-row keyed effect</h3>
    <BenchmarkTable columns={["Target", "Initial rows", "JS gzip", "Build", "Selected update", "Unrelated update", "Reverse"]} rows={[
      ["Astro native", "Yes", "381 B", "998 ms", "0.4 ms", "0.2 ms", "5.7 ms"],
      ["Kudzu", "Yes", "8,264 B", "426 ms", "3.6 ms", "2.4 ms", "8.8 ms"],
      ["Vue CSR", "No", "25,091 B", "935 ms", "5.8 ms", "2.4 ms", "10.5 ms"],
      ["Svelte CSR", "No", "12,848 B", "1,040 ms", "5.7 ms", "4.1 ms", "58.1 ms"],
      ["React CSR", "No", "60,921 B", "1,198 ms", "9.8 ms", "5.9 ms", "16.8 ms"]
    ]} />
    <p>Each row owns one effect depending on its name. Browser timing starts only after every target has 1,000 rows and effects ready. Kudzu's targeted changed-root update measures 3.6 ms, versus Vue at 5.8 ms, Svelte at 5.7 ms, and React at 9.8 ms. List reconciliation remains O(n); Kudzu and Vue both measure 2.4 ms on the unrelated detail update. Kudzu and Astro emit the initial rows while the other targets are CSR; JavaScript, output, and build values therefore are not architecture-equivalent comparisons.</p>
    <h3>1,000-row keyed local state</h3>
    <BenchmarkTable columns={["Target", "Initial rows", "JS gzip", "Build", "Edit", "Reverse", "Remove", "Re-add"]} rows={[
      ["Astro native", "Yes", "373 B", "903 ms", "1.6 ms", "5.7 ms", "1.2 ms", "1.3 ms"],
      ["Kudzu", "Yes", "9.2 KB", "434 ms", "2.7 ms", "10.8 ms", "3.0 ms", "3.7 ms"],
      ["Vue CSR", "No", "24.4 KB", "793 ms", "3.0 ms", "12.1 ms", "4.2 ms", "4.1 ms"],
      ["Svelte CSR", "No", "13.1 KB", "911 ms", "2.8 ms", "50.4 ms", "4.6 ms", "5.9 ms"],
      ["React CSR", "No", "59.4 KB", "1,054 ms", "6.2 ms", "25.8 ms", "9.1 ms", "6.7 ms"]
    ]} />
    <p>Row 500 enters edit state, survives reverse with the same row and input DOM nodes, then removal and re-add must create fresh non-editing state. Thirty-one rotating fresh-profile runs give Kudzu the lowest framework median for every operation; the 0.1 ms displayed edit lead over Svelte is not statistically significant, while every other framework comparison is significant. Astro is the hand-written native lower bound from a separate seven-profile run. Kudzu and Astro emit all initial rows; the other targets are CSR, so artifact sizes and loading architecture are not equivalent.</p>
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
      <li>Object refs initialize directly with <code>null</code>, including refs declared by keyed row components. Callback refs, mutable value refs, non-<code>null</code> initializers, and reactive <code>dangerouslySetInnerHTML</code> are not supported.</li>
      <li><code>useReducer</code> requires a pure synchronous two-parameter default or named reducer imported from a relative TypeScript module. Dispatch may cross one direct prop boundary into a specialized same-file or relative-imported synchronous component, including a keyed row with latest-item handlers and the ordinary keyed-row state/effect/ref capabilities. That component may pass one dispatch-containing callback, optionally wrapped in React <code>useCallback</code>, into one relative-imported synchronous intrinsic child. These specializations accept directly serializable primitive, plain-object, or array literal defaults and one final rest binding forwarded exactly once to a direct intrinsic root. Computed defaults, indirect rest use, non-keyed specialized local state, lazy state or reducer initialization, package, namespace, local, async, and generator reducers, package imports or child imports outside handlers, further forwarding, and dispatch through context are not supported.</li>
      <li>Reduced Zustand migration stores require one exported <code>create(set =&gt; ({`{ data, ...actions }`}))</code> store with one serializable data property, direct property selectors, and synchronous capture-free merge-form actions. A shared layout must initialize the store outside keyed rows. Derived selectors, multiple data properties, middleware, <code>get</code>, subscriptions, equality functions, persist/devtools wrappers, async actions, helper captures, replacement updates, and indirect action forwarding are not supported.</li>
      <li>Reactive conditional DOM and keyed-list boundaries are limited to the HTML namespace and are rejected inside SVG or MathML. Namespaced SVG attributes such as <code>xlinkHref</code> are not yet supported.</li>
      <li>Keyed lists require a local array-state anchor and intrinsic roots or specialized same-file/relative row components. One-use aliases may compose inline pure <code>filter</code>, direct-property <code>flatMap</code>, and <code>Array.from</code> selectors. Callbacks accept <code>(item)</code> or <code>(item, index)</code>; field keys own item identity and index keys own positional identity.</li>
      <li>A keyed row may contain multiple sibling maps over direct parent-item array properties recursively without a numeric depth limit. Intrinsic, same-file, or relative-imported rows support recursive specialization, analyzable prop spreads, directly serializable literal prop defaults, direct intrinsic rest forwarding, forwarded JSX children, nested conditions, latest-item handlers, multiple directly serializable state slots, supported effects, and <code>null</code>-initialized object refs.</li>
      <li>Computed child collections, parent capture in child rows, component cycles, package or namespace row imports, reusable aliases, dynamic/computed prop spreads or defaults, indirect/repeated rest use, rest-forwarded children, derived-expression captures, lazy/dynamic row state, non-<code>null</code> refs, and arbitrary or asynchronous collection callbacks remain unsupported.</li>
      <li>Reactive statement control flow supports terminal returns and adjacent exhaustive JSX assignment; effectful branches, loops, <code>switch</code>, <code>try</code>, and later reassignment remain unsupported.</li>
      <li><code>useEffect</code> supports inline block-bodied callbacks, directly returned inline cleanup, DOM ownership in conditional and supported keyed rows, and literal arrays of direct JSON-safe primitive state or runtime parameter identifiers. Keyed rows also accept direct <code>item.&lt;field&gt;</code> properties whose values remain JSON-safe primitives. Whole-item, computed, nested, derived, prototype-sensitive, non-item property, ordinary local, object, spread, dynamic, named or dynamic cleanup, cleanup parameter or generator, async-cleanup, and other return forms are not supported.</li>
      <li>Relative TypeScript Workers are limited to unshadowed <code>new Worker(new URL("../name.worker.ts", import.meta.url), {`{ type: "module" }`})</code> directly inside an inline effect. Worker graphs allow relative TypeScript ESM runtime imports only; JSX, package runtime imports, import-equals declarations, dynamic imports, <code>require()</code>, outside-source paths, ordinary runtime imports of Worker source, event handlers, imported helpers, and imported keyed-row effects are rejected.</li>
      <li><code>runtimeParams = true</code> requires full bracket segments, cannot be combined with <code>getStaticPaths()</code>, and requires an exact-file-first fallback rewrite on the production host. Catch-all runtime parameters are not supported.</li>
      <li>There is no request-time SSR, server actions, default/general router, HMR, or DevTools. Opt-in navigation supports independent emitted exact/runtime groups with one shared layout per group; cross-group path domains cannot overlap. Conditional and keyed effects follow their layout or route lifetime.</li>
      <li>Imported client helpers require relative TypeScript modules; package runtime imports, dynamic imports, JSX helpers, and non-serializable captures are rejected.</li>
    </ul>
  </section>
}
