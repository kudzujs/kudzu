# Performance Records

## 0.8.23 Source Compiler Boundary

Measured UTC 2026-08-09 on Apple M3, 8 logical CPUs, 8 GiB RAM, macOS 26.5.2 / Darwin 25.5.0, Node 22.23.2, and npm 11.18.0. Baseline tag `v0.8.22` at `60b9bff` and the current `0.8.23` compiler candidate used the same local volume and identical installed dependencies.

The candidate implementation patch over `v0.8.22` had SHA-256 `cfa25426f630f3d5d75a788f9ef8c63c48531c74ffc58727437890c47c511945`, produced by:

```bash
git diff --binary v0.8.22 -- framework/build.mjs framework/compiler/source-compiler.mjs framework/compiler/source-graph.mjs framework/compiler/path-helpers.mjs framework/compiler/worker-compiler.mjs framework/dev-server.mjs test/compiler-passes.test.mjs test/framework.test.mjs | shasum -a 256
```

Both targets received one warm-up followed by seven clean `worker-effects` production builds in alternating round-robin order. Cleanup remained outside timing. The ranges overlap; the 0.24% lower candidate median does not establish a material change.

| Target | Build median | Worker raw / gzip | Window raw / gzip |
|---|---:|---:|---:|
| 0.8.22 baseline | 287.7 ms | 907 B / 477 B | 12,148 B / 5,411 B |
| 0.8.23 candidate | 287.0 ms | 907 B / 477 B | 12,148 B / 5,411 B |

```text
0.8.22: [287.3,288.1,287.7,289.3,285.7,286.8,289.1]
0.8.23: [289.2,283.7,287.4,287.0,293.8,287.0,285.4]
```

Before release-content updates, the complete 135-page site and the `bindings`, `keyed-row-hooks`, `effect-dependencies`, `worker-effects`, `runtime-params`, `navigation`, `config-authoring`, and `event-package` deploy trees had identical file lists and bytes. Their `.kudzu` trees also matched after replacing only each checkout root in existing source-location strings. The invalid-reducer fixture retained the same source file, line, column, and diagnostic text. `build.mjs` decreased from 3,732 to 744 lines; this source-organization metric is not a runtime performance claim.

## 0.8.22 Versioned Compiler Foundation

Measured UTC 2026-08-09 on Apple M3, 8 logical CPUs, 8 GiB RAM, macOS 26.5.2 / Darwin 25.5.0, Node 25.6.1, and npm 11.18.0. Baseline tag `v0.8.21` at `ff38092` and the current `0.8.22` compiler candidate used the same local volume and identical installed dependencies.

The candidate implementation patch over `v0.8.21` had SHA-256 `e1d89c97dd8dfb60d41ae9c14ac64dfbb50466e024f80076f430ae9e725fb28f`, produced by:

```bash
git diff --binary v0.8.21 -- framework/build.mjs framework/compiler/list-runtime-codegen.mjs framework/compiler/param-codegen.mjs framework/compiler/route-capability-planner.mjs framework/compiler/runtime-codegen.mjs framework/core.mjs framework/core.d.ts | shasum -a 256
```

Both targets received one warm-up followed by seven clean `worker-effects` production builds in alternating round-robin order. Cleanup remained outside timing. Both medians were exactly 250.1 ms; the distributions overlap and establish no material change.

| Target | Build median | Worker raw / gzip | Window raw / gzip |
|---|---:|---:|---:|
| 0.8.21 baseline | 250.1 ms | 907 B / 475 B | 12,148 B / 5,427 B |
| 0.8.22 candidate | 250.1 ms | 907 B / 475 B | 12,148 B / 5,427 B |

```text
0.8.21: [249.7,252.0,250.1,251.2,250.0,254.8,249.1]
0.8.22: [250.1,247.3,255.1,249.3,253.1,250.3,248.7]
```

Before release-content updates, the complete 135-page site and the `bindings`, `keyed-row-hooks`, `effect-dependencies`, `worker-effects`, `runtime-params`, and `navigation` deploy trees had identical file lists and bytes. Their build plans were equivalent after removing the intentional additive RouteIR `version` and state `slot` fields. Every measured Worker/window artifact name, raw byte count, and gzip byte count was identical. `build.mjs` decreased from 3,999 to 3,732 lines; this source-organization metric is not a runtime performance claim.

## 0.8.21 Explicit Effect Ownership

Measured UTC 2026-08-09 on Apple M3, 8 logical CPUs, 8 GiB RAM, macOS 26.5.2 / Darwin 25.5.0, Node 25.6.1, and npm 11.18.0. Baseline tag `v0.8.20` at `7fb6e37` and the current `0.8.21` compiler candidate used the same local volume and identical installed dependencies.

The candidate implementation patch over `v0.8.20` had SHA-256 `ac0b1921bbbfb72f45d9b53338bec96bf9ab3d1680446148dfd8548b871bcbe4`, produced by:

```bash
git diff --binary v0.8.20 -- framework/build.mjs framework/compiler/descriptor-session.mjs framework/compiler/effect-analysis.mjs framework/compiler/ir/module-ir.mjs framework/compiler/worker-compiler.mjs framework/core.d.ts | shasum -a 256
```

Both targets received one warm-up followed by seven clean `worker-effects` production builds in alternating round-robin order. Cleanup remained outside timing. The distributions overlap; the 1.02% lower candidate median does not establish a material change.

| Target | Build median | Worker raw / gzip | Window raw / gzip |
|---|---:|---:|---:|
| 0.8.20 baseline | 255.6 ms | 907 B / 475 B | 12,148 B / 5,427 B |
| 0.8.21 candidate | 253.0 ms | 907 B / 475 B | 12,148 B / 5,427 B |

```text
0.8.20: [253.2,263.4,276.5,255.6,251.3,252.1,266.1]
0.8.21: [253.7,249.7,260.4,253.0,251.1,250.1,265.7]
```

The complete site `dist` and the `effect-dependencies`, `keyed-effects`, and `worker-effects` fixture output trees had identical file lists and bytes before release-content updates. The Worker graph and every window graph file were byte-identical, including the content-hashed Worker name. This measurement covers compiler clean-build startup and generated artifact size; lifecycle behavior remains covered by the complete effect, Worker, conditional, keyed, and navigation integration tests.

## 0.8.20 Explicit Keyed Ownership

Measured UTC 2026-08-09 on Apple M3, 8 logical CPUs, 8 GiB RAM, macOS 26.5.2 / Darwin 25.5.0, Node 25.6.1, and npm 11.18.0. Baseline `0.8.19` commit `c516173` and the current `0.8.20` compiler candidate used the same local volume and identical installed dependencies.

The candidate implementation patch over `c516173` had SHA-256 `137f68090f6024374077f46cb61767f48dff27a193d33c9e92409b8dd7bb7d21`, produced by:

```bash
git diff --binary c516173 -- framework/build.mjs framework/compiler/descriptor-session.mjs framework/compiler/ir/module-ir.mjs framework/core.d.ts | shasum -a 256
```

Both targets received one warm-up followed by 21 clean `keyed-row-hooks` production builds in round-robin alternating order. Cleanup remained outside timing. The distributions overlap; the candidate median was 0.52% lower and does not establish a material change.

| Target | Build median | List runtime raw / gzip |
|---|---:|---:|
| 0.8.19 baseline | 266.8 ms | 21,831 B / 6,930 B |
| 0.8.20 candidate | 265.4 ms | 21,831 B / 6,930 B |

```text
0.8.19: [272.5,269.7,262.6,267.3,262.9,265.2,268.0,264.7,262.0,268.3,267.1,262.5,263.7,266.8,263.2,267.5,263.3,268.8,266.7,266.9,271.4]
0.8.20: [262.5,267.4,266.2,261.7,265.1,262.9,269.9,264.1,275.0,268.2,263.4,263.7,265.4,268.7,263.8,266.1,265.4,265.3,267.2,270.1,263.2]
```

The recorded cleanup, warm-up, timing, median, and runtime-size measurement is reproducible with:

```bash
BASELINE_ROOT="/var/folders/bt/3r_ntp5x65j81brs6_p93rl00000gn/T/opencode/kudzu-0820-baseline" CANDIDATE_ROOT="/Users/songchibong/Documents/GitHub/kudzu" node --input-type=module -e 'import { spawnSync } from "node:child_process"; import { rmSync,readFileSync } from "node:fs"; import { gzipSync } from "node:zlib"; import { performance } from "node:perf_hooks"; import { resolve } from "node:path"; const roots={baseline:process.env.BASELINE_ROOT,candidate:process.env.CANDIDATE_ROOT}; const runs={baseline:[],candidate:[]}; const fixture="keyed-row-hooks"; const build=name=>{const root=roots[name],cwd=resolve(root,"test/fixtures",fixture); rmSync(resolve(cwd,"dist"),{recursive:true,force:true}); rmSync(resolve(cwd,".kudzu"),{recursive:true,force:true}); const start=performance.now(); const result=spawnSync(process.execPath,[resolve(root,"bin/kudzu.mjs"),"build"],{cwd,encoding:"utf8"}); if(result.status) throw new Error(result.stderr||result.stdout); return Number((performance.now()-start).toFixed(1));}; build("baseline"); build("candidate"); for(let index=0;index<21;index++) for(const name of index%2?["candidate","baseline"]:["baseline","candidate"]) runs[name].push(build(name)); const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)]; const sizes={}; for(const [name,root] of Object.entries(roots)){const file=readFileSync(resolve(root,"test/fixtures",fixture,"dist/assets/kudzu-list.js")); sizes[name]=[file.length,gzipSync(file).length];} console.log(JSON.stringify({runs,medians:{baseline:median(runs.baseline),candidate:median(runs.candidate)},sizes}));'
```

Before release-content updates, the complete site `dist` was byte-identical. Seven representative keyed fixtures retained identical file lists and SHA-256 content; `.kudzu` comparison replaced only each worktree's absolute root in existing source-location strings. The complete compared lists were:

```text
lists: dist/assets/handlers/pages/index.js, dist/assets/kudzu-list.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu-style.js, dist/assets/kudzu.js, dist/assets/native/index.js, dist/index.html, .kudzu/kudzu-plan.json, .kudzu/pages/index.mjs
nested-lists: dist/assets/effects/index.js, dist/assets/handlers/pages/index.js, dist/assets/kudzu-effect.js, dist/assets/kudzu-list.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu.js, dist/assets/native/index.js, dist/index.html, .kudzu/kudzu-plan.json, .kudzu/pages/index.mjs
keyed-row-hooks: dist/assets/effects/index.js, dist/assets/handlers/pages/index.js, dist/assets/kudzu-binding.js, dist/assets/kudzu-effect.js, dist/assets/kudzu-list.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu-style.js, dist/assets/kudzu.js, dist/assets/native/index.js, dist/index.html, .kudzu/HookRow.mjs, .kudzu/kudzu-plan.json, .kudzu/pages/index.mjs
svg-structures: dist/assets/handlers/pages/index.js, dist/assets/kudzu-binding.js, dist/assets/kudzu-list.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu-style.js, dist/assets/kudzu.js, dist/assets/native/index.js, dist/index.html, .kudzu/kudzu-plan.json, .kudzu/pages/index.mjs
calculated-collections: dist/assets/handlers/pages/index.js, dist/assets/handlers/pages/ordinary.js, dist/assets/kudzu-binding.js, dist/assets/kudzu-list.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu-style.js, dist/assets/kudzu.js, dist/assets/native/index.js, dist/assets/native/ordinary/index.js, dist/index.html, dist/ordinary/index.html, dist/static/index.html, .kudzu/calculate.mjs, .kudzu/kudzu-plan.json, .kudzu/pages/index.mjs, .kudzu/pages/ordinary.mjs, .kudzu/pages/static.mjs
rendered-collections: dist/assets/handlers/pages/index.js, dist/assets/kudzu-list.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu.js, dist/assets/native/index.js, dist/index.html, .kudzu/kudzu-plan.json, .kudzu/pages/index.mjs, .kudzu/selectVisible.mjs
keyed-effects: dist/assets/effects/index.js, dist/assets/effects/item-only/index.js, dist/assets/effects/state-only/index.js, dist/assets/handlers/pages/index.js, dist/assets/handlers/pages/item-only.js, dist/assets/handlers/pages/state-only.js, dist/assets/kudzu-binding.js, dist/assets/kudzu-effect.js, dist/assets/kudzu-list.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu-style.js, dist/assets/kudzu.js, dist/assets/native/index.js, dist/index.html, dist/item-only/index.html, dist/state-only/index.html, .kudzu/EffectRow.mjs, .kudzu/kudzu-plan.json, .kudzu/pages/index.mjs, .kudzu/pages/item-only.mjs, .kudzu/pages/state-only.mjs
```

This measurement covers compiler clean-build startup and generated list-runtime size, not browser reconciliation latency. Browser behavior remains covered by the existing insert/update/reorder/remove/nested/SVG/state/effect/ref integration checks.

## 0.8.19 Handler, Binding, And Derived IR

Measured UTC 2026-08-08 on Apple M3, 8 logical CPUs, 8 GiB RAM, macOS 26.5.2 / Darwin 25.5.0, Node 25.6.1, and npm 11.18.0. Baseline `0.8.18` tag `3598be0` and the `0.8.19` compiler-only candidate used detached worktrees on the same temporary volume with identical installed dependencies.

The candidate compiler patch over `3598be0` had SHA-256 `7b2afc4c9a0d1963c8d3ccacfb1e95152136d77cc7afc250d17b1986ca329fb3`, produced by:

```bash
git diff --binary 3598be0 -- framework/build.mjs framework/compiler/descriptor-session.mjs framework/compiler/handler-codegen.mjs framework/compiler/handler-lowering.mjs framework/compiler/ir/module-ir.mjs | shasum -a 256
```

Both targets received one warm-up followed by 21 clean `worker-effects` production builds in round-robin alternating order. Cleanup remained outside timing. The distributions overlap; the candidate median was 0.32% lower and does not establish a material change.

| Target | Build median | Worker raw / gzip | Window raw / gzip |
|---|---:|---:|---:|
| 0.8.18 baseline | 253.4 ms | 907 B / 475 B | 12,148 B / 5,427 B |
| 0.8.19 candidate | 252.6 ms | 907 B / 475 B | 12,148 B / 5,427 B |

```text
0.8.18: [252.3,254.5,251.0,254.8,254.3,253.8,253.4,251.6,255.4,252.4,249.6,254.2,251.0,253.7,256.0,250.4,251.0,255.4,253.3,253.6,250.5]
0.8.19: [252.3,251.7,252.9,251.9,251.5,253.0,252.3,251.3,253.0,252.1,254.3,258.4,249.8,251.6,256.2,253.7,253.5,252.6,252.9,252.5,255.9]
```

Before release-content updates, the complete site `dist` was byte-identical. Representative fixture builds retained identical file lists and SHA-256 content; `.kudzu` comparisons replaced only each detached worktree's absolute root in existing source-location strings. The complete fixture lists were:

```text
bindings: dist/assets/handlers/pages/index.js, dist/assets/kudzu-binding.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu-style.js, dist/assets/kudzu.js, dist/index.html, .kudzu/kudzu-plan.json, .kudzu/pages/index.mjs
native: dist/assets/handlers/pages/index.js, dist/assets/handlers/pages/other/index.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu.js, dist/assets/native/index.js, dist/assets/native/other/index.js, dist/index.html, dist/other/index.html, .kudzu/helpers.mjs, .kudzu/kudzu-plan.json, .kudzu/math.mjs, .kudzu/pages/index.mjs, .kudzu/pages/other/index.mjs
reducer: dist/assets/handlers/pages/index.js, dist/assets/handlers/pages/lazy.js, dist/assets/kudzu-binding.js, dist/assets/kudzu-list.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu-style.js, dist/assets/kudzu.js, dist/assets/native/index.js, dist/index.html, dist/lazy/index.html, .kudzu/ImportedControls.mjs, .kudzu/ImportedInput.mjs, .kudzu/ImportedItem.mjs, .kudzu/kudzu-plan.json, .kudzu/pages/index.mjs, .kudzu/pages/lazy.mjs, .kudzu/todoReducer.mjs, .kudzu/todoSupport.mjs
context-actions: dist/assets/handlers/pages/index.js, dist/assets/kudzu-list.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu.js, dist/assets/native/index.js, dist/index.html, dist/static/index.html, .kudzu/kudzu-plan.json, .kudzu/notes.mjs, .kudzu/pages/index.mjs, .kudzu/pages/static.mjs, .kudzu/useNotes.mjs
zustand-migration: dist/assets/handlers/Shell.js, dist/assets/handlers/pages/cart.js, dist/assets/handlers/pages/index.js, dist/assets/kudzu-binding.js, dist/assets/kudzu-native.js, dist/assets/kudzu-navigation.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu-style.js, dist/assets/kudzu.js, dist/assets/native/cart/index.js, dist/assets/native/index.js, dist/cart/index.html, dist/index.html, .kudzu/Shell.mjs, .kudzu/kudzu-plan.json, .kudzu/pages/cart.mjs, .kudzu/pages/index.mjs, .kudzu/store.mjs
event-package: dist/assets/handlers/pages/index.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu.js, dist/assets/native/index.js, dist/index.html, .kudzu/kudzu-plan.json, .kudzu/pages/index.mjs
list-expressions: dist/assets/handlers/pages/index.js, dist/assets/kudzu-list.js, dist/assets/kudzu.js, dist/index.html, .kudzu/kudzu-plan.json, .kudzu/pages/index.mjs
effect-dependencies: dist/assets/effects/index.js, dist/assets/handlers/pages/index.js, dist/assets/kudzu-collection-selector.js, dist/assets/kudzu-deps.js, dist/assets/kudzu-effect.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu.js, dist/command/index.html, dist/index.html, .kudzu/kudzu-plan.json, .kudzu/pages/command.mjs, .kudzu/pages/index.mjs
landing-page-migration: dist/assets/assets/badge.png, dist/assets/assets/hero.svg, dist/assets/assets/landing.woff2, dist/assets/assets/module-mark.svg, dist/assets/assets/preview.webp, dist/assets/handlers/pages/index.js, dist/assets/kudzu-binding.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu-style.js, dist/assets/kudzu.js, dist/assets/native/index.js, dist/assets/styles/Hero.module.css, dist/assets/styles/landing.css, dist/index.html, dist/static/index.html, .kudzu/LandingSections.mjs, .kudzu/kudzu-plan.json, .kudzu/pages/index.mjs, .kudzu/pages/static.mjs
```

This measurement covers compiler clean-build startup and artifact size, not browser interaction latency or cross-framework performance.

The recorded cleanup, warm-up, and alternating 21-run loop is reproducible with:

```bash
BASELINE_ROOT="/private/var/folders/bt/3r_ntp5x65j81brs6_p93rl00000gn/T/opencode/kudzu-0819-baseline" CANDIDATE_ROOT="/var/folders/bt/3r_ntp5x65j81brs6_p93rl00000gn/T/opencode/kudzu-0.8.19-candidate" node --input-type=module -e 'import { spawnSync } from "node:child_process"; import { rmSync } from "node:fs"; import { performance } from "node:perf_hooks"; import { resolve } from "node:path"; const roots={baseline:process.env.BASELINE_ROOT,candidate:process.env.CANDIDATE_ROOT}; const runs={baseline:[],candidate:[]}; const build=name=>{const root=roots[name],fixture=resolve(root,"test/fixtures/worker-effects"); rmSync(resolve(fixture,"dist"),{recursive:true,force:true}); rmSync(resolve(fixture,".kudzu"),{recursive:true,force:true}); const start=performance.now(); const result=spawnSync(process.execPath,[resolve(root,"bin/kudzu.mjs"),"build"],{cwd:fixture,encoding:"utf8"}); if(result.status!==0) throw new Error(result.stderr||result.stdout); return Number((performance.now()-start).toFixed(1));}; build("baseline"); build("candidate"); for(let index=0;index<21;index++) for(const name of index%2?["candidate","baseline"]:["baseline","candidate"]) runs[name].push(build(name)); console.log(JSON.stringify(runs));'
```

The complete `worker-effects` benchmark list was: `dist/assets/effects/dashboard/index.js`, `dist/assets/handlers/pages/dashboard.js`, `dist/assets/kudzu-effect.js`, `dist/assets/kudzu-navigation.js`, `dist/assets/kudzu.js`, `dist/assets/workers/telemetry.worker-BVG2SA55.js`, `dist/dashboard/index.html`, `dist/plain/index.html`, `dist/static/index.html`, `.kudzu/Shell.mjs`, `.kudzu/chart.mjs`, `.kudzu/kudzu-plan.json`, `.kudzu/pages/dashboard.mjs`, `.kudzu/pages/plain.mjs`, `.kudzu/pages/static.mjs`, `.kudzu/telemetry/downsample.mjs`, and `.kudzu/telemetry/ring.mjs`.

## 0.8.18 Explicit Component Ownership

Measured UTC 2026-08-08 on Apple M3, 8 logical CPUs, 8 GiB RAM, macOS 26.5.2 / Darwin 25.5.0, Node 25.6.1, and npm 11.18.0. Baseline `0.8.17` tag `d48f0cf` and the `0.8.18` compiler-only candidate used detached worktrees on the same temporary volume with identical installed dependencies.

Both targets received one warm-up followed by 21 clean `worker-effects` production builds in round-robin alternating order. Cleanup remained outside timing. The distributions overlap; the 2.43% candidate median difference remains below the 5% architecture gate and does not establish a material regression.

| Target | Build median | Worker raw / gzip | Window raw / gzip |
|---|---:|---:|---:|
| 0.8.17 baseline | 770.9 ms | 907 B / 475 B | 12,148 B / 5,427 B |
| 0.8.18 candidate | 789.6 ms | 907 B / 475 B | 12,148 B / 5,427 B |

```text
0.8.17: [770.9,705.6,817.1,768.5,760.2,839.8,758.3,756.1,960.7,834.6,707.9,706.5,582.9,463.5,625.5,1004.2,846.9,821.3,837.5,876.9,810.8]
0.8.18: [753.9,726.4,879.3,851.5,942.8,949.3,758.4,761.3,794.3,782.2,620.6,622.9,610.8,726.8,732.3,833.0,789.6,816.3,845.2,811.3,825.0]
```

Before release-content updates, the complete `dist` and `.kudzu` trees were byte-identical. The Worker and window graphs remain byte-identical. This measurement covers compiler clean-build startup and artifact size, not browser interaction latency or cross-framework performance.

Representative fixture builds also retained identical file lists and SHA-256 content against `v0.8.17`. Deploy `dist` bytes matched exactly; `.kudzu` hashes matched after replacing only each detached worktree's absolute root in existing source-location strings. The complete compared lists were:

```text
bindings: dist/assets/handlers/pages/index.js, dist/assets/kudzu-binding.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu-style.js, dist/assets/kudzu.js, dist/index.html, .kudzu/kudzu-plan.json, .kudzu/pages/index.mjs
conditionals: dist/assets/handlers/pages/index.js, dist/assets/kudzu-binding.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu-style.js, dist/assets/kudzu.js, dist/assets/native/index.js, dist/index.html, .kudzu/kudzu-plan.json, .kudzu/pages/index.mjs
nested-component-lists: dist/assets/effects/index.js, dist/assets/handlers/pages/index.js, dist/assets/kudzu-effect.js, dist/assets/kudzu-list.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu.js, dist/assets/native/index.js, dist/index.html, .kudzu/ImportedItem.mjs, .kudzu/ImportedShell.mjs, .kudzu/kudzu-plan.json, .kudzu/label.mjs, .kudzu/pages/index.mjs
effects: dist/api/items.json, dist/assets/effects/index.js, dist/assets/effects/oak/index.js, dist/assets/effects/only/index.js, dist/assets/handlers/pages/[slug].js, dist/assets/handlers/pages/index.js, dist/assets/handlers/pages/only.js, dist/assets/kudzu-binding.js, dist/assets/kudzu-effect.js, dist/assets/kudzu-list.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu-style.js, dist/assets/kudzu.js, dist/index.html, dist/oak/index.html, dist/only/index.html, dist/static/index.html, .kudzu/kudzu-plan.json, .kudzu/pages/[slug].mjs, .kudzu/pages/index.mjs, .kudzu/pages/only.mjs, .kudzu/pages/static.mjs
worker-effects: dist/assets/effects/dashboard/index.js, dist/assets/handlers/pages/dashboard.js, dist/assets/kudzu-effect.js, dist/assets/kudzu-navigation.js, dist/assets/kudzu.js, dist/assets/workers/telemetry.worker-BVG2SA55.js, dist/dashboard/index.html, dist/plain/index.html, dist/static/index.html, .kudzu/Shell.mjs, .kudzu/chart.mjs, .kudzu/kudzu-plan.json, .kudzu/pages/dashboard.mjs, .kudzu/pages/plain.mjs, .kudzu/pages/static.mjs, .kudzu/telemetry/downsample.mjs, .kudzu/telemetry/ring.mjs
runtime-params: dist/assets/effects/orgs/[org]/items/[id]/index.js, dist/assets/handlers/pages/orgs/[org]/items/[id].js, dist/assets/kudzu-binding.js, dist/assets/kudzu-effect.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu-style.js, dist/assets/kudzu.js, dist/assets/native/orgs/[org]/items/[id]/index.js, dist/assets/params/orgs/[org]/items/[id]/index.js, dist/orgs/[org]/items/[id]/index.html, dist/orgs/acme/items/new/index.html, dist/rewrites.json, .kudzu/kudzu-plan.json, .kudzu/pages/orgs/[org]/items/[id].mjs, .kudzu/pages/orgs/acme/items/new.mjs
navigation: dist/[section]/[id]/index.html, dist/assets/effects/[section]/[id]/index.js, dist/assets/effects/broken/index.js, dist/assets/effects/cart/index.js, dist/assets/effects/chart/index.js, dist/assets/effects/items/[id]/index.js, dist/assets/effects/items/new/index.js, dist/assets/effects/product/index.js, dist/assets/handlers/Shell.js, dist/assets/handlers/chunks/chunk-VIS4MAAV.js, dist/assets/handlers/pages/cart.js, dist/assets/handlers/pages/chart.js, dist/assets/handlers/pages/items/[id].js, dist/assets/handlers/pages/product.js, dist/assets/kudzu-binding.js, dist/assets/kudzu-effect.js, dist/assets/kudzu-list.js, dist/assets/kudzu-native.js, dist/assets/kudzu-navigation.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu-style.js, dist/assets/kudzu.js, dist/assets/native/items/[id]/index.js, dist/assets/native/product/index.js, dist/assets/params/[section]/[id]/index.js, dist/assets/params/items/[id]/index.js, dist/broken/index.html, dist/browser-test.js, dist/cart/index.html, dist/chart/index.html, dist/items/[id]/index.html, dist/items/new/index.html, dist/outside/index.html, dist/product/index.html, .kudzu/Shell.mjs, .kudzu/chart.mjs, .kudzu/kudzu-plan.json, .kudzu/pages/[section]/[id].mjs, .kudzu/pages/broken.mjs, .kudzu/pages/cart.mjs, .kudzu/pages/chart.mjs, .kudzu/pages/items/[id].mjs, .kudzu/pages/items/new.mjs, .kudzu/pages/outside.mjs, .kudzu/pages/product.mjs
callback-ref-ownership: dist/assets/effects/index.js, dist/assets/handlers/pages/index.js, dist/assets/kudzu-binding.js, dist/assets/kudzu-effect.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu-style.js, dist/assets/kudzu.js, dist/assets/native/index.js, dist/index.html, .kudzu/ImportedAgeInput.mjs, .kudzu/ImportedButton.mjs, .kudzu/ImportedSearch.mjs, .kudzu/ImportedTooltip.mjs, .kudzu/kudzu-plan.json, .kudzu/pages/index.mjs
context-actions: dist/assets/handlers/pages/index.js, dist/assets/kudzu-list.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu.js, dist/assets/native/index.js, dist/index.html, dist/static/index.html, .kudzu/kudzu-plan.json, .kudzu/notes.mjs, .kudzu/pages/index.mjs, .kudzu/pages/static.mjs, .kudzu/useNotes.mjs
reducer: dist/assets/handlers/pages/index.js, dist/assets/handlers/pages/lazy.js, dist/assets/kudzu-binding.js, dist/assets/kudzu-list.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu-style.js, dist/assets/kudzu.js, dist/assets/native/index.js, dist/index.html, dist/lazy/index.html, .kudzu/ImportedControls.mjs, .kudzu/ImportedInput.mjs, .kudzu/ImportedItem.mjs, .kudzu/kudzu-plan.json, .kudzu/pages/index.mjs, .kudzu/pages/lazy.mjs, .kudzu/todoReducer.mjs, .kudzu/todoSupport.mjs
```

## 0.8.17 Command ModuleIR

Measured UTC 2026-08-08 on Apple M3, 8 logical CPUs, 8 GiB RAM, macOS 26.5.2 / Darwin 25.5.0, Node 25.6.1, and npm 11.18.0. Baseline `0.8.16` tag `98a4ad9` and the `0.8.17` release candidate used detached worktrees on the same temporary volume with identical installed dependencies.

Both targets received two warm-ups followed by 21 clean `worker-effects` production builds in round-robin alternating order. Cleanup remained outside timing. The distributions overlap; the 1.76% candidate median difference remains below the 5% architecture gate and does not establish a material regression.

| Target | Build median | Worker raw / gzip | Window raw / gzip |
|---|---:|---:|---:|
| 0.8.16 baseline | 782.0 ms | 907 B / 475 B | 12,148 B / 5,427 B |
| 0.8.17 candidate | 795.8 ms | 907 B / 475 B | 12,148 B / 5,427 B |

```text
0.8.16: [775.9,787.9,846.8,702.3,782.0,712.5,665.1,702.9,835.0,743.2,780.6,931.7,894.1,1004.0,849.8,1031.1,829.7,768.8,718.5,842.9,763.0]
0.8.17: [696.0,721.9,778.8,850.4,846.1,835.2,710.4,711.6,836.1,766.9,822.6,945.0,838.2,991.5,858.6,803.4,706.3,760.8,773.8,764.3,795.8]
```

Before release-content updates, the unchanged source site, Counter build module, route plan, and command runtime were byte-identical. The final Worker and window graphs remain byte-identical. This measurement covers compiler clean-build startup and artifact size, not browser interaction latency or cross-framework performance.

## 0.8.16 Compiler Analysis Boundaries

Measured UTC 2026-08-08 on Apple M3, 8 logical CPUs, 8 GiB RAM, macOS 26.5.2 / Darwin 25.5.0, Node 25.6.1, and npm 11.18.0. Baseline `0.8.15` commit `8405d29` and the `0.8.16` release candidate used detached worktrees on the same temporary volume with identical installed dependencies.

The tracked `worker-effects` fixture received two warm-ups per target followed by 21 clean production builds in round-robin alternating order. Cleanup remained outside timing. The measured distributions overlap; the 3.75% median difference remains below the 5% architecture gate and does not establish a material regression.

| Target | Build median | Worker raw / gzip | Window raw / gzip |
|---|---:|---:|---:|
| 0.8.15 baseline | 787.0 ms | 907 B / 475 B | 12,148 B / 5,427 B |
| 0.8.16 candidate | 816.5 ms | 907 B / 475 B | 12,148 B / 5,427 B |

```text
0.8.15: [762.5,793.7,937.8,820.7,775.9,766.4,807.2,742.7,772.0,757.6,823.0,752.7,814.2,827.2,917.4,787.0,755.1,798.5,742.1,806.8,785.8]
0.8.16: [893.1,653.9,915.2,816.5,800.1,747.1,801.5,749.8,951.8,830.3,723.5,780.4,904.4,821.6,957.0,757.9,918.0,809.5,739.3,844.6,950.9]
```

The artifact comparison is exact for both graphs. It measures compiler clean-build startup plus the existing Worker fixture, not browser update latency or cross-framework performance.

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
