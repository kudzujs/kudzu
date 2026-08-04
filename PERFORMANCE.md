# Performance Records

## 0.7.12 Keyed Local State

Measured UTC 2026-08-02 on Apple M3, 8 logical CPUs, 8 GiB RAM, macOS 26.5.2 / Darwin 25.5.0, Node 25.6.1, npm 11.18.0, and Chrome 150.0.7871.187.

Targets were Kudzu 0.7.12 at commit `05e5cc248d425b0f30549cd0649df99291c5aa38`, React/React DOM 19.2.8, Vue 3.5.40, Svelte 5.56.8, and Vite 8.2.0. The Vite plugins were React 6.0.5, Vue 6.0.8, and Svelte 7.2.0.

### Fixture

- 1,000 keyed rows with matching visible content and controls.
- Each row owns local editing state and conditionally creates a read-only input.
- Operations run in order: edit row 500, reverse, remove row 500, re-add row 500.
- Edit and reverse retain row 500 DOM identity; reverse also retains its input and editing state.
- Removal disconnects the old row and input; re-add creates fresh non-editing DOM and state.
- All 28 measured browser profiles passed content, order, identity, and reset checks.

Kudzu emitted pre-rendered HTML plus capability ESM. React, Vue, and Svelte used Vite production CSR from an empty shell. Browser operation timing started only after each target had 1,000 rows, so it excludes initial rendering. Total output and JavaScript sizes are not architecture-equivalent comparisons.

### Method

- Builds: one clean warm-up per target, then seven clean measured builds in round-robin rotated order; cleanup remained outside timing.
- Browser: 31 round-robin rotated unthrottled runs per target, each in a fresh Chrome profile. A separate seven-profile run used 4x CDP CPU throttling.
- Timing: one in-page promise installs a <code>MutationObserver</code>, records <code>performance.now()</code>, dispatches the click, and resolves only after terminal DOM and identity predicates pass.
- Initial JavaScript: unique external module-script/static-import closure plus inline module bodies. Raw size is summed bytes; gzip is one deterministic compression over path-sorted concatenated bytes.
- Total output: sum of all regular production files.

### Medians

| Target | Initial rows | JS raw | JS gzip | Total output | Build | Edit | Reverse | Remove | Re-add |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Kudzu | Yes | 26,117 B | 8,610 B | 940,710 B | 238.051 ms | 0.5 ms | 4.2 ms | 1.3 ms | 1.9 ms |
| React CSR | No | 191,163 B | 59,564 B | 191,260 B | 185.665 ms | 2.1 ms | 7.5 ms | 2.4 ms | 1.9 ms |
| Vue CSR | No | 61,652 B | 24,018 B | 61,749 B | 198.550 ms | 0.9 ms | 3.8 ms | 1.3 ms | 0.9 ms |
| Svelte CSR | No | 35,208 B | 13,686 B | 35,305 B | 279.240 ms | 0.8 ms | 20.1 ms | 1.6 ms | 1.3 ms |

### Raw Build Times

```text
Kudzu: [235.435, 238.051, 237.118, 250.086, 254.562, 251.422, 237.609]
React: [187.010, 185.665, 186.299, 185.506, 183.472, 186.375, 184.815]
Vue:   [200.253, 198.494, 197.007, 203.240, 198.550, 197.475, 200.469]
Svelte:[281.211, 285.172, 278.421, 279.240, 277.810, 279.036, 281.426]
```

### Corrected Browser Distributions

The first seven-profile run used external CDP polling and was discarded: protocol roundtrips added roughly 42–49 ms to reverse and produced unstable 4–10 ms bands for short operations. The corrected run measures completion entirely in-page. Values below are min / median / max across 31 fresh profiles.

| Target | Edit | Reverse | Remove | Re-add |
|---|---:|---:|---:|---:|
| Kudzu | 0.3 / 0.5 / 0.6 | 3.7 / 4.2 / 4.8 | 0.9 / 1.3 / 1.8 | 1.7 / 1.9 / 3.0 |
| React CSR | 1.9 / 2.1 / 2.4 | 7.1 / 7.5 / 8.3 | 2.0 / 2.4 / 3.4 | 1.7 / 1.9 / 2.7 |
| Vue CSR | 0.7 / 0.9 / 1.0 | 3.5 / 3.8 / 4.1 | 1.1 / 1.3 / 1.6 | 0.8 / 0.9 / 1.2 |
| Svelte CSR | 0.6 / 0.8 / 1.2 | 19.2 / 20.1 / 21.6 | 1.4 / 1.6 / 1.8 | 1.2 / 1.3 / 1.5 |

### Corrected 4x CPU Medians

| Target | Edit | Reverse | Remove | Re-add |
|---|---:|---:|---:|---:|
| Kudzu | 2.3 ms | 17.3 ms | 5.9 ms | 8.6 ms |
| React CSR | 8.5 ms | 30.3 ms | 10.5 ms | 8.4 ms |
| Vue CSR | 3.2 ms | 14.8 ms | 5.4 ms | 4.1 ms |
| Svelte CSR | 3.5 ms | 78.6 ms | 6.3 ms | 6.1 ms |

The observer validates DOM mutation completion, not paint or compositor presentation. Synthetic clicks exclude hardware input latency, and 0.1 ms timer quantization matters for sub-millisecond edits. The fixture measures one keyed local-state workload, not general framework performance.

## 2026-08-03 Structural SVG And Link Lowering

Measured on Intel Core i5-9500 (6 cores), 32 GB RAM, Linux 6.17.0-19-generic, Node 24.14.0, npm 11.9.0, and Chrome 142.0.7444.175. The worktree was based on Kudzu 0.7.21 with the unreleased structural SVG and React Router `Link` changes.

The structural fixture rendered 1,000 keyed rows plus one reactive conditional. SVG and HTML targets used the same state and operation sequence: conditional toggle, row 500 update, reverse, row 500 removal, and one append. All 31 fresh profiles per target passed content, namespace, and retained reverse-identity checks. Builds received one clean warm-up followed by seven clean round-robin runs; cleanup was outside timing. Browser targets alternated order across 31 fresh profiles each, with completion measured in-page by `MutationObserver`.

### Medians

| Target | Build | JS raw | JS gzip | Total output | Conditional | Update | Reverse | Remove | Add |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SVG | 404.291 ms | 23,989 B | 8,079 B | 149,500 B | 0.8 ms | 1.9 ms | 8.3 ms | 2.4 ms | 3.5 ms |
| HTML control | 391.427 ms | 23,656 B | 8,000 B | 144,894 B | 0.7 ms | 1.8 ms | 8.3 ms | 2.5 ms | 3.6 ms |

SVG added 333 B raw / 79 B aggregate gzip JavaScript to this matched capability graph. Its build median was 3.29% higher. Browser medians differed by +0.1 ms conditional, +0.1 ms update, 0.0 ms reverse, -0.1 ms remove, and -0.1 ms add. The sub-millisecond differences are within timer quantization and overlapping fresh-profile ranges; no material SVG browser regression was established.

The static `Link` fixture and an already base-prefixed native-anchor control emitted byte-identical 248 B HTML, zero JavaScript, and no other files. Their clean build medians were 269.386 ms and 267.514 ms respectively, a 0.70% difference within the observed run variation.

### Raw Build Times

```text
SVG:   [379.646, 389.564, 435.431, 429.248, 423.114, 395.475, 404.291]
HTML:  [373.381, 379.176, 420.158, 431.850, 401.762, 391.427, 381.916]
Link:  [255.944, 276.585, 262.099, 322.057, 269.386, 259.338, 302.837]
Anchor:[262.150, 267.514, 262.529, 272.420, 270.237, 261.387, 279.634]
```

### Raw Browser Times

```text
SVG conditional: [0.8,0.8,0.7,0.8,0.7,1.5,1.0,0.8,0.9,0.8,0.8,0.7,0.8,1.1,0.6,0.6,0.7,0.9,0.7,0.8,0.9,1.5,0.9,0.8,0.8,0.8,0.7,1.0,0.7,0.6,0.9]
SVG update:      [1.9,1.7,1.8,1.5,1.7,2.2,2.2,2.8,2.0,1.9,1.7,2.9,1.7,1.9,1.7,1.6,1.9,1.9,1.9,1.8,3.8,3.3,2.1,3.3,1.8,1.7,1.7,1.8,1.9,1.7,1.9]
SVG reverse:     [9.1,7.9,8.3,7.4,7.9,12.7,12.5,10.2,12.8,8.0,7.9,10.0,7.9,8.4,7.7,7.5,7.3,9.1,8.6,9.0,9.8,9.1,9.2,9.9,8.0,8.2,7.7,7.9,7.8,8.4,7.6]
SVG remove:      [2.4,2.1,2.5,2.2,2.3,3.4,3.3,4.1,8.9,2.7,2.2,2.7,2.3,2.6,3.2,2.3,2.1,3.0,2.3,2.6,3.6,4.1,6.3,2.4,2.5,2.1,2.3,2.2,2.3,2.1,2.3]
SVG add:         [3.4,3.3,4.4,2.9,3.1,8.1,5.3,13.0,4.1,6.0,3.2,4.0,3.4,3.6,4.4,3.1,3.0,4.0,3.6,4.0,6.4,4.3,4.9,3.5,3.3,2.9,3.3,2.9,3.4,3.1,3.2]
HTML conditional:[0.6,0.6,0.6,0.5,0.8,0.8,2.0,4.1,0.8,0.7,2.6,0.7,0.6,0.6,0.7,0.6,0.6,0.6,1.0,0.7,0.7,0.7,1.1,0.8,0.9,0.9,0.7,0.7,0.7,1.5,0.7]
HTML update:     [1.9,1.7,1.8,1.7,2.2,2.8,2.2,1.8,1.8,2.0,1.9,1.8,1.7,1.8,1.7,1.6,1.5,1.4,1.9,2.2,2.6,5.1,2.0,2.8,2.1,1.9,1.7,1.8,1.7,1.8,1.9]
HTML reverse:    [7.4,6.4,6.9,7.3,10.6,10.3,15.3,27.8,8.4,11.6,7.2,8.8,7.1,6.9,6.6,6.5,6.2,6.2,10.3,11.6,8.2,10.6,14.2,11.3,8.5,8.4,7.0,8.6,8.3,6.7,7.0]
HTML remove:     [2.6,2.1,2.2,2.3,3.6,3.7,6.1,10.2,2.4,3.4,2.4,4.7,2.0,2.2,2.0,2.3,2.1,2.1,3.0,3.7,2.3,3.0,2.8,7.0,5.1,2.8,2.3,2.2,2.6,2.5,2.2]
HTML add:        [3.7,3.2,3.1,3.7,4.2,6.6,11.7,8.8,3.3,6.7,3.3,5.5,3.1,3.0,3.0,3.3,2.9,2.9,8.7,7.9,3.3,5.6,4.2,6.0,3.8,7.0,3.3,3.3,3.2,3.3,3.6]
```

The browser ranges were SVG conditional 0.6–1.5 ms, update 1.5–3.8 ms, reverse 7.3–12.8 ms, remove 2.1–8.9 ms, add 2.9–13.0 ms; HTML conditional 0.5–4.1 ms, update 1.4–5.1 ms, reverse 6.2–27.8 ms, remove 2.0–10.2 ms, add 2.9–11.7 ms. Measurements cover DOM mutation completion, not paint/compositing, and use unthrottled synthetic clicks. The SVG and HTML markup is behavior-matched but not byte-identical, so total HTML/output differences are not attributed solely to namespace support.

The maintained Worker benchmark also passed on this worktree: build runs `[874.5, 778.5, 757.3, 880.3, 713.7, 672.8, 515.3]` ms, median 757.3 ms; Worker graph 907 B raw / 477 B gzip; window graph 11,960 B raw / 5,353 B gzip. Its historical M3 build timings are not comparable to this Linux machine.

## 2026-08-04 Large React Migration

Measured on Intel Core i5-9500, Linux 6.17.0-19-generic, Node 24.14.0, npm 11.9.0, and Chrome 142.0.7444.175. The worktree was based on Kudzu 0.7.25 with unreleased React-compatible JSX typing, setter-adapter component specialization, and TypeScript-only collection-wrapper unwrapping.

The generated Trailboard fixture contains 2,000 imported records, 500 initially rendered keyed cards, one reactive search reducing the list to one card, one keyed row-local state update, and 53 routes including 50 report pages. React/Vite has 60 source files, 2,561 lines, and 279,966 bytes; Kudzu has 58 source files, 2,440 lines, and 273,752 bytes because file routes replace the React root/router entries.

Builds received one warm-up followed by seven alternating clean TypeScript-check plus production-build runs. Browser targets alternated across seven runs, each with a new Chrome profile and warm local server. An in-page async evaluation measured navigation start to the expected 500-card DOM, event dispatch to the one-card filtered DOM, and click dispatch to the row-local state attribute update.

### Medians

| Metric | React/Vite | Kudzu | Kudzu difference |
|---|---:|---:|---:|
| Clean typecheck + build | 3,188.27 ms | 2,759.69 ms | -13.44% |
| Initial 500-card DOM | 261.80 ms | 280.10 ms | +6.99% |
| Filter 500 cards to one | 13.90 ms | 28.30 ms | +103.60% |
| Toggle keyed row state | 5.80 ms | 5.30 ms | -8.62% |
| JavaScript gzip | 97,885 B | 12,191 B | -87.55% |

Kudzu's filter path is the clear loss in this fixture and is the next measured optimization candidate. Initial readiness and row-local state are in overlapping fresh-profile ranges, while the build and JavaScript-size wins are material.

### Selector Optimization Follow-up

The collection evaluator was changed to cache selector state reads for one execution and avoid recursive rest-array allocation, `slice()`, and `map()` in hot expression nodes. A second seven-run alternating fresh-profile measurement used the same fixture and method.

| Metric | Baseline | Optimized | Change |
|---|---:|---:|---:|
| Kudzu filter 500 cards to one | 28.30 ms | 22.00 ms | -22.26% |
| React filter control | 13.90 ms | 13.60 ms | -2.16% |
| Kudzu gap versus React | +103.60% | +61.76% | -41.84 points |
| Kudzu JavaScript gzip | 12,191 B | 12,310 B | +0.98% |

The allocation/state-cache change materially improves the path without changing list ownership or cleanup semantics. The remaining gap is concentrated in generic keyed reconciliation and per-row ownership cleanup when 499 mounted rows are removed at once. An attempted detached batch cleanup was discarded because it broke the remove-all/add-new-key transition; it is not part of the retained change.

```text
Optimized Kudzu filter: [22.8, 22.5, 20.8, 19.2, 22.0, 22.5, 20.7]
Optimized React filter: [14.9, 14.9, 15.6, 12.9, 13.6, 13.4, 12.9]
```

### Indexed Row Release Follow-up

Profiling separated selector evaluation, which took about 3 ms, from the remaining per-row lifecycle work. The compiler now marks keyed rows for direct state-indexed release only when they have row-local state but no row effects, nested lists, or shared text targets. Binding and condition registrations are released by state ID; all other row shapes retain the existing DOM-owned unmount path.

Because the seven-run ranges overlapped, the final isolated measurement used one warm-up and 21 alternating samples:

| Metric | React/Vite | Kudzu | Kudzu difference |
|---|---:|---:|---:|
| Clean typecheck + build | 3,024.33 ms | 2,664.58 ms | -11.90% |
| Initial 500-card DOM | 256.90 ms | 256.00 ms | -0.35% |
| Filter 500 cards to one | 13.90 ms | 13.50 ms | -2.88% |
| Toggle keyed row state | 5.70 ms | 5.30 ms | -7.02% |
| JavaScript gzip | 97,885 B | 12,442 B | -87.29% |

The final Kudzu filter median is 52.30% below the preserved 28.30 ms baseline and 2.88% faster than React on the matched operation. The fast path adds 132 B gzip over the selector-only follow-up. Raw 21-run arrays and generated reports are stored in the benchmark fixture.

### Artifacts

| Target | HTML raw / gzip | CSS raw / gzip | JS raw / gzip |
|---|---:|---:|---:|
| React/Vite | 168 / 143 B | 3,649 / 1,365 B | 465,830 / 97,885 B |
| Kudzu | 702,854 / 65,355 B | 4,225 / 1,442 B | 30,175 / 12,191 B |

React/Vite emits one CSR shell, while Kudzu's HTML total includes 53 complete documents. The initial-readiness comparison therefore measures the product delivery difference rather than equivalent markup. Gzip totals sum files independently; clients do not download all 53 Kudzu documents for one route.

### Raw Build Times

```text
React: [3156.83, 3190.33, 3155.66, 3188.27, 3115.12, 3201.29, 3268.69]
Kudzu: [2777.83, 2792.51, 2659.28, 2655.26, 2706.48, 2759.69, 2812.61]
```

### Raw Browser Times

```text
React initial: [293.3, 230.8, 272.6, 292.0, 261.8, 261.8, 235.7]
Kudzu initial: [277.3, 280.6, 287.9, 292.4, 276.1, 254.8, 280.1]
React filter:  [13.9, 15.5, 15.3, 14.4, 13.0, 13.5, 13.8]
Kudzu filter:  [28.3, 31.7, 29.1, 28.9, 26.4, 24.4, 24.1]
React toggle:  [5.7, 6.1, 5.8, 5.8, 5.6, 5.8, 5.7]
Kudzu toggle:  [5.2, 5.4, 5.3, 5.6, 5.3, 5.2, 5.3]
```

The reproducible fixture, benchmark harness, environment record, and JSON results are under `/home/kft/Documents/etc/demo/large-benchmark`.
