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
      ["Astro native", "Yes", "381 B", "1,022 ms", "0.4 ms", "0.2 ms", "5.5 ms"],
      ["Kudzu", "Yes", "7,070 B", "437 ms", "3.4 ms", "2.9 ms", "7.8 ms"],
      ["Vue CSR", "No", "25,091 B", "893 ms", "4.7 ms", "2.3 ms", "10.1 ms"],
      ["Svelte CSR", "No", "12,848 B", "1,012 ms", "5.2 ms", "3.0 ms", "48.1 ms"],
      ["React CSR", "No", "60,921 B", "1,132 ms", "12.3 ms", "6.8 ms", "19.0 ms"]
    ]} />
    <p>Each row owns one effect depending on its name. Browser timing starts only after every target has 1,000 rows and effects ready. Targeted changed-root notification reduced Kudzu's selected update from 6.2 to 3.4 ms, versus Vue at 4.7 ms, Svelte at 5.2 ms, and React at 12.3 ms. It adds 126 B gzip to Kudzu's initial graph. List reconciliation remains O(n), so Vue is faster on the unrelated detail update. Kudzu and Astro emit the initial rows while the other targets are CSR; JavaScript, output, and build values therefore are not architecture-equivalent comparisons.</p>
    <p>These results describe one matched fixture on one machine, not framework ecosystem size or every rendering mode. Prefetch improves eligible application transitions; direct loads still transfer and render complete standalone documents.</p>
  </section>
}

export function LimitsSection() {
  return <section className="docs-section" id="limits">
    <div className="docs-heading"><span>12</span><div><p>REFERENCE</p><h2>Current limits</h2></div></div>
    <ul className="docs-limits">
      <li>Callback refs, mutable value refs, keyed-list refs, and reactive <code>dangerouslySetInnerHTML</code> are not supported.</li>
      <li><code>useReducer</code> requires a synchronous two-parameter default or named reducer imported from a relative TypeScript module. Dispatch may cross one direct prop boundary into a specialized same-file or relative-imported synchronous component with an intrinsic root and compiled handler; relative TypeScript imports used inside that handler are bundled. Lazy initialization, package, namespace, local, async, and generator reducers, package imports or child imports outside handlers, second-hop forwarding, effects, and dispatch through context are not supported.</li>
      <li>Reactive conditional DOM and keyed-list boundaries are limited to the HTML namespace and are rejected inside SVG or MathML. Namespaced SVG attributes such as <code>xlinkHref</code> are not yet supported.</li>
      <li>Keyed lists require local-state maps and intrinsic roots or top-level local or relative-imported row components. Same-file or relative default, named/aliased, and direct named re-export wrappers may receive the state identifier directly and render the map under an intrinsic root. Package, namespace, and star-export wrappers, package and namespace row imports, reusable aliases, nested dynamic JSX, prop spreads, and derived-expression captures remain unsupported.</li>
      <li>Reactive statement control flow supports terminal returns and adjacent exhaustive JSX assignment; effectful branches, loops, <code>switch</code>, <code>try</code>, and later reassignment remain unsupported.</li>
      <li><code>useEffect</code> supports inline block-bodied callbacks, directly returned inline cleanup, DOM ownership in conditional and supported keyed rows, and literal arrays of direct JSON-safe primitive state or runtime parameter identifiers. Keyed rows also accept direct <code>item.&lt;field&gt;</code> properties whose values remain JSON-safe primitives. Whole-item, computed, nested, derived, prototype-sensitive, non-item property, ordinary local, object, spread, dynamic, named or dynamic cleanup, cleanup parameter or generator, async-cleanup, and other return forms are not supported.</li>
      <li>Relative TypeScript Workers are limited to unshadowed <code>new Worker(new URL("../name.worker.ts", import.meta.url), {`{ type: "module" }`})</code> directly inside an inline effect. Worker graphs allow relative TypeScript ESM runtime imports only; JSX, package runtime imports, import-equals declarations, dynamic imports, <code>require()</code>, outside-source paths, ordinary runtime imports of Worker source, event handlers, imported helpers, and imported keyed-row effects are rejected.</li>
      <li><code>runtimeParams = true</code> requires full bracket segments, cannot be combined with <code>getStaticPaths()</code>, and requires an exact-file-first fallback rewrite on the production host. Catch-all runtime parameters are not supported.</li>
      <li>There is no request-time SSR, server actions, default/general router, HMR, or DevTools. Opt-in navigation supports independent emitted exact/runtime groups with one shared layout per group; cross-group path domains cannot overlap. Conditional and keyed effects follow their layout or route lifetime.</li>
      <li>Imported client helpers require relative TypeScript modules; package runtime imports, dynamic imports, JSX helpers, and non-serializable captures are rejected.</li>
    </ul>
  </section>
}
