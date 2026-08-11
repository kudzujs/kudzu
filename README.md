<p align="center">
  <img src="https://raw.githubusercontent.com/kudzujs/kudzu/main/public/icon-128.png" width="96" alt="Kudzu logo">
</p>

# Kudzu

HTML-first TSX framework with synchronous state semantics and no virtual DOM.

Kudzu compiles ordinary React-shaped TypeScript and TSX into complete static HTML, CSS, and only the route-specific ESM capabilities actually used. Static pages ship zero JavaScript. React, hydration, a VDOM, and a retained browser component tree are not part of the output.

[![Watch the 22-second Kudzu compiler overview](https://raw.githubusercontent.com/kudzujs/kudzu/main/media/kudzu-demo-cover.png)](https://github.com/kudzujs/kudzu/blob/main/media/kudzu-demo.mp4)

*Watch: React-shaped TSX to static HTML and route-specific ESM in 22 seconds.*

> Experimental `0.8.x`: the compiler API and supported TSX surface may change.

**Latest release: 0.8.33 - Project-scoped compilation.** Every build now owns its root, source graph, source maps, compiler paths, and Worker compiler in an explicit ProjectSession, so independent projects compile safely in one Node process while the CLI keeps its current-directory behavior. Read the [release notes](./RELEASES.md#0833---project-scoped-compilation), open the [release page](https://github.com/kudzujs/kudzu/releases/tag/v0.8.33), or follow the [architecture packet](./docs/next-architecture/README.md).

- [Documentation](https://kudzujs.cloud/docs)
- [Installation guide](https://kudzujs.cloud/docs#install)
- [Components and migration support](https://kudzujs.cloud/docs#components)
- [Current limits](https://kudzujs.cloud/docs#limits)
- [Benchmarks](https://kudzujs.cloud/docs#benchmarks)
- [Raw performance records](https://github.com/kudzujs/kudzu/blob/main/PERFORMANCE.md)
- [React migration roadmap](https://github.com/kudzujs/kudzu/blob/main/MIGRATION_ROADMAP.md)
- [Release history](./RELEASES.md)

## Quick Start

Kudzu requires Node.js 22 or newer.

```bash
npm create kudzu@latest my-app
cd my-app
npm run dev
```

The generated project includes reusable components, an interactive state example, a zero-JavaScript static route, metadata, and responsive CSS.

To add Kudzu to an existing project:

```bash
npm install @kudzujs/core typescript
```

Add the Kudzu commands to `package.json`:

```json
{
  "scripts": {
    "dev": "kudzu dev",
    "build": "kudzu build",
    "check": "tsc --noEmit && kudzu build"
  }
}
```

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "jsxImportSource": "@kudzujs/core",
    "strict": true
  }
}
```

Put routes in `src/pages`; `src/pages/index.tsx` maps to `/`.

```tsx
import { useState } from "@kudzujs/core"

export default function HomePage() {
  const [count, setCount] = useState(0)

  return <button onClick={() => setCount(count + 1)}>
    Grown {count} times
  </button>
}
```

```bash
npm run dev
npm run build
```

## How It Works

```text
ordinary React-shaped TSX
  -> Kudzu compiler specialization
  -> complete HTML + CSS + capability-specific ESM
```

- Function components execute at build time and do not survive as browser components.
- `useState` and reduced `useReducer`, including directly serializable lazy initialization, compile to synchronous logical state and batched direct DOM writes; top-level `useId` and direct intrinsic `forwardRef` authoring erase to static HTML without a component runtime.
- Conditions, keyed collections, attributes, events, refs, effects, and supported component boundaries compile to route-specific capabilities. A direct setter may cross one ordinary component boundary through one value-adapter event call; inline or simple `const` setter callbacks and object refs may cross the same direct intrinsic boundary.
- Build-known data and routes become complete HTML through async components and `getStaticPaths()`.
- Native document navigation is the default; static routes do not load a client runtime.
- A named or aliased React Router `Link` with a static root-relative `to` erases to a base-aware native anchor; no router package or runtime is emitted.
- A direct named or aliased React Router `useParams()` call on a `runtimeParams` bracket route reuses Kudzu's route-specific pathname reader.
- React Router `useSearchParams()` supports direct static `get("name")` locals and inline setter updaters, lowering reads and history writes to one route-specific query capability.
- Only TypeScript modules reachable from pages are compiled. Imported immutable direct maps can fold to static HTML, while direct fields from relative structured calculations reevaluate through route binding ESM.
- Package imports used directly inside JSX event callbacks are removed from build modules and retained only in bundled route handler ESM.
- A named or aliased React Router `useNavigate()` top-level binding lowers direct nested-callback calls with safe static root-relative destinations to native `location.assign()` or `location.replace()` navigation.
- Unsupported nearby patterns fail during the build with a source location and actionable boundary.

Migration input may retain supported imports from `react`; Kudzu erases those references and never emits or executes React. New Kudzu source should import framework APIs from `@kudzujs/core`.

See the [complete guide](https://kudzujs.cloud/docs), [interactive features](https://kudzujs.cloud/docs#state), and [current limits](https://kudzujs.cloud/docs#limits) instead of relying on this README as an API reference.

## Architecture

Kudzu treats React-shaped TSX as compiler input rather than as a browser runtime programming model:

```text
React-shaped TypeScript/TSX
  -> ordered AST normalization passes
  -> state/effect/handler/binding/list analysis
  -> complete HTML + route-specific capability ESM
```

- `framework/compiler/normalization-pipeline.mjs` owns pass order and repairs AST parent pointers after structurally changed transforms.
- Focused passes own React, React Router, browser-signal, animation-frame, timer, render-control, and Worker validation.
- The main transformer produces descriptors; effect and handler codegen modules turn them into route-specific ESM.
- Unsupported nearby syntax fails with source-located diagnostics instead of falling back to React or a generic runtime.

Kudzu intentionally does not provide:

- React runtime compatibility
- Virtual DOM or hydration
- Retained browser component instances
- A default SPA router
- Request-time SSR or server actions
- A general client state or effect runtime

Browser code is a compiler-generated capability module, included only when a route uses that capability. Kudzu does not eliminate every runtime; it eliminates unused runtime.

## Packages

- [`@kudzujs/core`](https://www.npmjs.com/package/@kudzujs/core): compiler, CLI, JSX runtime, and framework APIs
- [`create-kudzu`](https://www.npmjs.com/package/create-kudzu): project generator and working showcase

## Development

```bash
npm run check
npm test
```

Read [AGENTS.md](https://github.com/kudzujs/kudzu/blob/main/AGENTS.md) and the [migration roadmap](https://github.com/kudzujs/kudzu/blob/main/MIGRATION_ROADMAP.md) before extending migration syntax or browser capabilities.

## License

MIT
