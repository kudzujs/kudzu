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
    ├── kudzu-binding.js (when used)
    ├── params/ (when runtimeParams is used)
    ├── handlers/ (evaluators and imported helpers)
    ├── kudzu-list.js (when used)
    ├── kudzu-native.js (when used)
    ├── kudzu-serialization.js (when used)
    └── handlers/`} />
    <p>Static pages ship no JavaScript. Interactive pages receive only the command runtime and external handler or binding modules they use. Runtime bracket pages emit one fallback HTML file plus a route-specific parameter matcher. Ordered host rewrites are written to <code>.kudzu/kudzu-plan.json</code> and passed to <code>afterBuild()</code>.</p>
  </section>
}

export function BenchmarksSection() {
  return <section className="docs-section" id="benchmarks">
    <div className="docs-heading"><span>11</span><div><p>REFERENCE</p><h2>Benchmarks</h2></div></div>
    <p>Production builds ran after one warm-up in seven rotating rounds on Node 24.14.0 and an Intel i5-9500. Browser list operations are medians from seven fresh headless Chrome runs, measured when a DOM observer sees each expected result rather than at the next animation frame.</p>
    <h3>Interactive counter</h3>
    <BenchmarkTable columns={["Framework", "Initial HTML", "JS gzip", "Output", "Build"]} rows={[
      ["Kudzu", "Yes", "1.8 KB", "4.0 KB", "445 ms"],
      ["Astro", "Yes", "158 B", "365 B", "975 ms"],
      ["Qwik CSR", "No", "20.6 KB", "57.8 KB", "706 ms"],
      ["Vue CSR", "No", "24.0 KB", "60.3 KB", "874 ms"],
      ["Svelte CSR", "No", "10.5 KB", "26.9 KB", "982 ms"],
      ["React CSR", "No", "59.2 KB", "189.0 KB", "1181 ms"],
      ["Next.js", "Yes", "182.1 KB", "652.2 KB", "3503 ms"]
    ]} />
    <h3>Context object cost</h3>
    <BenchmarkTable columns={["Kudzu variant", "JS gzip", "Output", "Build", "Click"]} rows={[
      ["Local native state", "1.9 KB", "4.0 KB", "472 ms", "4.38 µs"],
      ["Context object", "4.9 KB", "12.6 KB", "494 ms", "6.94 µs"]
    ]} />
    <p>The Context fixture uses live object properties in derived text and handlers. Recursive state/setter capture and generic binding add about 3.0 KB gzip and 2.56 µs per update only when used, while preserving immediate logical reads and one batched DOM commit per synchronous turn. Capability specialization removes these branches from pages that do not use them.</p>
    <h3>Runtime path parameters</h3>
    <BenchmarkTable columns={["Fixture", "Initial JS gzip", "Matcher gzip", "Build"]} rows={[
      ["Two params + bindings + effect + event", "6.3 KB", "702 B", "411 ms"]
    ]} />
    <h3>Static journal</h3>
    <BenchmarkTable columns={["Framework", "Initial HTML", "JS gzip", "Output", "Build"]} rows={[
      ["Kudzu", "Yes", "0 B", "3.2 KB", "422 ms"],
      ["Astro", "Yes", "0 B", "3.0 KB", "1081 ms"],
      ["Qwik CSR", "No", "20.2 KB", "59.6 KB", "633 ms"],
      ["Vue CSR", "No", "24.2 KB", "62.3 KB", "810 ms"],
      ["Svelte CSR", "No", "10.2 KB", "27.2 KB", "902 ms"],
      ["React CSR", "No", "59.8 KB", "192.3 KB", "1110 ms"],
      ["Next.js", "Yes", "182.6 KB", "663.6 KB", "3126 ms"]
    ]} />
    <h3>123-page newsletter build</h3>
    <BenchmarkTable columns={["Build model", "TSX files", "Pages", "JS gzip", "Output", "Build"]} rows={[
      ["Generated workaround", "123", "123", "0 B", "52.0 KB", "882 ms"],
      ["getStaticPaths", "1", "123", "0 B", "52.0 KB", "454 ms"]
    ]} />
    <p>One dynamic page module removes 122 generated source files and reduces clean build time by 48.5% while emitting the same static pages, CSS, base-prefixed URLs, post-build feed, and zero browser JavaScript.</p>
    <h3>1,000-item keyed list</h3>
    <BenchmarkTable columns={["Framework", "JS gzip", "Output", "Build", "Update", "Reverse", "Remove", "Add", "Total"]} rows={[
      ["Astro", "324 B", "43.6 KB", "834 ms", "4.3 ms", "3.8 ms", "1.3 ms", "3.1 ms", "12.5 ms"],
      ["Kudzu", "5.1 KB", "60.3 KB", "438 ms", "7.5 ms", "7.0 ms", "1.8 ms", "6.9 ms", "23.2 ms"],
      ["Next.js", "182.2 KB", "695.2 KB", "2983 ms", "7.0 ms", "12.0 ms", "3.9 ms", "6.7 ms", "29.6 ms"],
      ["React CSR", "59.3 KB", "189.4 KB", "1020 ms", "9.5 ms", "11.7 ms", "3.8 ms", "5.3 ms", "30.3 ms"],
      ["Vue CSR", "24.3 KB", "61.3 KB", "773 ms", "11.4 ms", "9.5 ms", "4.1 ms", "6.6 ms", "31.6 ms"],
      ["Svelte CSR", "12.9 KB", "33.1 KB", "828 ms", "5.8 ms", "38.9 ms", "4.0 ms", "5.9 ms", "54.6 ms"],
      ["Qwik CSR", "22.2 KB", "64.1 KB", "594 ms", "9.1 ms", "22.2 ms", "30.8 ms", "19.0 ms", "81.1 ms"]
    ]} />
    <p>An intrinsic-root versus projected-prop row-component A/B build emitted byte-for-byte identical HTML and JavaScript. Seven clean-build medians were 467 ms and 455 ms; browser operation totals were 23.7 ms and 23.9 ms. Since no component code remains in <code>dist</code>, the browser difference is measurement variance rather than runtime overhead.</p>
    <p>Astro is the hand-authored native DOM baseline for interactive fixtures. Kudzu and Astro emit initial HTML; React, Vue, Svelte, and Qwik use client-rendered fixtures. These numbers describe the selected fixtures, not complete framework capability.</p>
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
      <li><code>useEffect</code> supports inline block-bodied mount-only callbacks with a literal empty dependency array; dependencies and cleanup or other return values are not yet supported.</li>
      <li><code>runtimeParams = true</code> requires full bracket segments, cannot be combined with <code>getStaticPaths()</code>, and requires an exact-file-first fallback rewrite on the production host. Catch-all runtime parameters are not supported.</li>
      <li>There is no request-time SSR, server actions, router, HMR, or DevTools.</li>
      <li>Imported client helpers require relative TypeScript modules; package runtime imports, dynamic imports, JSX helpers, and non-serializable captures are rejected.</li>
    </ul>
  </section>
}
