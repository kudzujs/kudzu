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
