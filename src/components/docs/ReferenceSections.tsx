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
    ├── kudzu-navigation.js (when navigation is configured)
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
      ["Kudzu", "7,215 B", "34,809 B", "324 ms", "140 ms", "103.3 ms", "648,844 B", "3.7 ms", "5.7 ms"],
      ["React + Vite", "61,464 B", "202,842 B", "324 ms", "232 ms", "160.0 ms", "1,062,520 B", "10.5 ms", "8.3 ms"],
      ["Next.js", "190,090 B", "546,581 B", "316 ms", "156 ms", "357.7 ms", "2,157,020 B", "11.4 ms", "26.9 ms"],
      ["Nuxt", "67,620 B", "195,953 B", "320 ms", "204 ms", "205.1 ms", "1,721,348 B", "3.9 ms", "33.0 ms"],
      ["SvelteKit", "32,473 B", "90,929 B", "340 ms", "172 ms", "125.8 ms", "999,496 B", "4.7 ms", "20.3 ms"]
    ]} />
    <p>Kudzu emits 34,879 deploy bytes. Its product graph includes the 2,306 B gzip navigation capability. Validated near-viewport document prefetch reduced the measured product-to-cart median from 128.7 ms to 5.7 ms without removing complete documents or native fallback.</p>
    <h3>Desktop and mobile behavior</h3>
    <BenchmarkTable columns={["Profile", "Cold LCP", "Warm LCP", "Interaction", "Product → cart", "Reject feedback", "Rollback/error", "CLS"]} rows={[
      ["Desktop", "324 ms", "140 ms", "3.7 ms", "5.7 ms", "3.3 ms", "110.8 ms", "0"],
      ["Mobile", "420 ms", "220 ms", "5.6 ms", "8.7 ms", "4.1 ms", "158 ms", "0"]
    ]} />
    <p>The mobile profile uses a 390x844 viewport, 6x CPU slowdown, 150 ms latency, and 150 KiB/s throughput. Both profiles recorded zero cold and warm layout shift.</p>
    <h3>Build tradeoff</h3>
    <p>Seven rotating clean production builds measured Kudzu at 460.8 ms and React at 429.5 ms. A separate 21-run interleaved check measured 578.6 ms and 542.5 ms. The repeatable 6–7% small-project difference is primarily TypeScript ESM/compiler startup. Generated-handler lowering and shared-Program experiments did not improve the combined median, so neither was retained.</p>
    <p>These results describe one matched fixture on one machine, not framework ecosystem size or every rendering mode. Prefetch improves eligible application transitions; direct loads still transfer and render complete standalone documents.</p>
  </section>
}

export function LimitsSection() {
  return <section className="docs-section" id="limits">
    <div className="docs-heading"><span>12</span><div><p>REFERENCE</p><h2>Current limits</h2></div></div>
    <ul className="docs-limits">
      <li>Callback refs, mutable value refs, keyed-list refs, and reactive <code>dangerouslySetInnerHTML</code> are not supported.</li>
      <li>Reactive conditional DOM is limited to the HTML namespace and is rejected inside SVG or MathML.</li>
      <li>Keyed lists require local-state maps and intrinsic roots or top-level local or relative-imported row components; package and namespace row imports, reusable aliases, nested dynamic JSX, prop spreads, and derived-expression captures remain unsupported.</li>
      <li>Reactive statement control flow supports terminal returns and adjacent exhaustive JSX assignment; effectful branches, loops, <code>switch</code>, <code>try</code>, and later reassignment remain unsupported.</li>
      <li><code>useEffect</code> supports inline block-bodied callbacks, directly returned inline cleanup, DOM ownership in conditional and supported keyed rows, and literal arrays of direct JSON-safe primitive state or runtime parameter identifiers. Keyed item-property dependencies, dependency expressions, properties, ordinary locals, objects, spreads, dynamic arrays, named or dynamic cleanup functions, cleanup parameters or generators, async effects returning cleanup, and other return values are not supported.</li>
      <li><code>runtimeParams = true</code> requires full bracket segments, cannot be combined with <code>getStaticPaths()</code>, and requires an exact-file-first fallback rewrite on the production host. Catch-all runtime parameters are not supported.</li>
      <li>There is no request-time SSR, server actions, default/general router, HMR, or DevTools. Opt-in navigation supports one exact static route group with a shared layout; runtime bracket routes, multiple groups, and conditional or keyed effects in that group are not supported.</li>
      <li>Imported client helpers require relative TypeScript modules; package runtime imports, dynamic imports, JSX helpers, and non-serializable captures are rejected.</li>
    </ul>
  </section>
}
