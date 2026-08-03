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
