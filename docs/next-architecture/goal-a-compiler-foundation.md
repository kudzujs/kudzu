# Goal A: Compiler Foundation

## Status

Goal A is complete in `0.8.23`. The no-write source compiler, ModuleIR source seams, RouteIR v1, CapabilityIR v1, focused runtime generators, and the architecture/output baseline preserve accepted React-shaped syntax, diagnostics, complete HTML, emitted capability behavior, and current public APIs.

## Target Boundaries

```text
project/build session
  -> normalized source result
  -> analyzed source result + transformed build module
  -> rendered route plan
  -> pure capability/artifact plan
  -> generated artifact sources
  -> filesystem emission
```

Each arrow needs a concrete input/output contract. A file split without a reduced dependency surface does not count.

## Minimum Kudzu IR

Goal A adds only the representation missing between normalized TypeScript AST and generated Kudzu core calls. It does not duplicate the existing serializable route plan or model a component tree.

```js
{
  version: 1,
  file: "src/pages/counter.tsx",
  signals: [],
  handlers: [],
  bindings: [],
  derived: [],
  effects: [],
  keyedBlocks: [],
  clientImports: [],
  sourceLocations: []
}
```

The active IR boundary must be JSON-safe. No `ts.Node`, `Map`, `Set`, `WeakMap`, function, closure, or Symbol crosses from analysis into optimization/codegen. Temporary AST identity remains an analyzer implementation detail until a feature receives an explicit result.

Existing representations are promoted rather than copied:

| Required concept | Canonical direction |
|---|---|
| `KudzuProgram` | Module, route, capability, and reference closure assembled only after the parts are explicit. |
| `RouteIR` | Version the existing `renderPage().plan`; do not add a second route plan. |
| `SignalIR` | Type the existing state descriptor and add an internal numeric slot plus readable debug metadata. |
| `HandlerIR` | Plain command data or a stable generated-module export reference. |
| `BindingIR` | Promote existing binding descriptors. |
| `DerivedIR` | Reuse the existing tagged Collection Expression IR. |
| `EffectIR` | Records setup HandlerIR, cleanup, ordered signal/DerivedIR dependencies and subscriptions, component/keyed ownership, source provenance, and Worker edges. |
| `KeyedBlockIR` | Promote the existing list descriptor after ownership analysis is explicit. |
| `CapabilityIR` | Reuse the current pure route capability manifest. |

A JSX tree, VDOM, component IR, retained component identity, or general expression VM is not part of Goal A.

## First Vertical Slice

The existing command fixture is the first real `TSX -> IR -> optimization -> existing codegen` path:

```tsx
const [count, setCount] = useState(0)
return <button onClick={() => setCount(count + 1)}>{count}</button>
```

Analysis produces plain data:

```js
{
  signals: [{ slot: 0, key: "state:0:count", debugName: "count" }],
  handlers: [{
    slot: 0,
    kind: "commands",
    commands: [{ operation: "add", signal: 0, value: 1 }]
  }]
}
```

The completed source result contains deterministic command, component, HandlerIR, BindingIR, DerivedIR, KeyedBlockIR, and EffectIR records. Source-local AST analysis is consumed during lowering and does not cross this boundary. Final route/layout/conditional/keyed IDs and lifetime allocation remain authoritative in `core.mjs`; no component tree or duplicate route plan exists.

Source codegen lowers that data through the existing build ABI:

```js
__kBehavior([["add", count, 1]])
```

`core.mjs` remains responsible for final route/layout state IDs, complete HTML, `data-k-*` descriptors, and the route plan. The generated HTML, command runtime, plan, and asset set must remain byte-identical. The command route must not gain handler, native, effect, binding, list, or serialization modules.

### Source Result

`compileSource()` returns one JSON-safe source-local result containing the project-relative build module, component analysis, sparse ModuleIR, optional generated handler/effect/binding/list evaluator module, and imported assets. It writes no files. Worker ownership is recorded as EffectIR edges; AST-bearing data is consumed inside analysis/lowering and does not become IR or cross-build state.

### Route Result

`renderPage()` remains the build-time authority for complete HTML and ownership IDs. Its existing plan is RouteIR v1, the behavioral source for states, events, effects, bindings, conditions, lists, parameters, and search parameters. Each state has a route-local numeric `slot`, its unchanged browser/DOM `id`, and readable `name` metadata used by development restoration. RouteIR slots are not ModuleIR signal slots or persistent browser identities. Route-level facts such as navigability and dependency-runtime selection accompany rather than mutate the plan.

### Artifact Plan

CapabilityIR v1 determines shared runtime families and optional branches. Rendered RouteIR descriptors and ModuleIR references independently retain route entries, handler modules, and Worker reachability. Runtime, list, parameter, effect, and handler generators consume those explicit results; they do not rediscover TSX semantics or inspect application AST.

## Generator Strategy

Use the smallest generator that removes fragile source surgery:

- Keep authored browser capability modules as readable JavaScript.
- Give each generated artifact one focused generator function with an explicit manifest subset and deterministic output.
- Prefer composing imports, constants, and named source sections over a general template engine or code-generation IR.
- Move existing specialization in behavior-preserving slices; do not rewrite all runtimes at once.
- Let esbuild perform syntax lowering, dead-code elimination, bundling, defines, and minification after Kudzu chooses the capability branches.
- Preserve stable path names where they are public output behavior; preserve content-hashed Worker/chunk naming.
- Assert that requested source sections exist before replacing/removing them during transition. The end state must not depend on incidental whitespace or entire function-body string matches.

No generator may analyze TSX, invent runtime component abstractions, or broaden the capability contract.

## Execution Rules

- One patch, one boundary, with no migration feature mixed in.
- Extract only code whose callers and outputs are understood.
- Replace AST side tables only when an explicit feature result can preserve ownership and source diagnostics.
- Keep `build()` as orchestration; do not replace it with a service container or plugin framework.
- Preserve current runtime files until their corresponding generator has artifact parity.
- Treat deterministic byte changes as review items even when tests pass.

## Acceptance Record

- `build.mjs` decreased from 3,999 to 744 lines and coordinates discovery, JSON-safe source results, RouteIR rendering, CapabilityIR projection, generation, and writing without TSX feature analysis.
- Source normalization, semantic analysis, ModuleIR and build-module generation, RouteIR rendering, CapabilityIR projection, generation, and writing have explicit ownership without a broad context object.
- RouteIR and CapabilityIR reject unsupported versions; required runtime source anchors fail closed.
- Static routes retain complete HTML and zero JavaScript; deploy output across the complete site and representative binding, list, effect, Worker, parameter, navigation, config, and package-handler fixtures is byte-identical to `v0.8.22`.
- Interactive and navigation routes preserve capability selection, ownership, stale-write, and cleanup behavior; unreachable handlers, effects, package helpers, and Workers remain absent.
- Diagnostics retain source file and location, and [`performance-gates.md`](./performance-gates.md) records no build or artifact-size regression.

## Non-Goals

- New React compatibility, hooks, routing, state, resource, or Worker forms.
- A compiler plugin API, full JSX/component-tree IR, template framework, or dependency-injection layer.
- Rewriting `framework/core.mjs` into a browser renderer.
- Optimizing browser hot paths before Goal A establishes a comparable baseline.
- React islands, hydration, or component serialization.

## Continuation Checklist

- [ ] Confirm the next planned version in [`versioning.md`](./versioning.md).
- [ ] Write down the current producer, consumer, and artifact before changing the boundary.
- [ ] Add or retain the smallest parity check that catches descriptor/plan/output drift.
- [ ] Compare representative static, command, binding, list, effect, Worker, runtime-parameter, and navigation outputs.
- [ ] Record raw/gzip and build measurements under the protocol in [`performance-gates.md`](./performance-gates.md).
- [ ] Mark a patch complete only after behavior and output gates pass.
- [ ] Delete the previous AST-valued representation when an IR path lands; never maintain both indefinitely.
- [ ] Preserve descriptor allocation order and final state IDs unless a versioned output change is explicitly approved.
