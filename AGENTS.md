# Kudzu Project Rules

## Product Direction

- Kudzu's primary product goal is AI-assisted migration of ordinary React-shaped TSX to static deploy artifacts.
- Ordinary common React-shaped TSX should migrate with minimal source restructuring. Prefer compiler specialization over asking applications to replace declarative components, collections, hooks, or conditions with imperative DOM code; this direction is product-wide, not tied to Stay or any other application.
- Preserve familiar function components, props, children, JSX, hooks, and event-handler syntax where Kudzu can compile them safely.
- The output remains pre-rendered HTML, CSS, and only the route-specific ESM capabilities actually used. Static pages must ship no JavaScript.
- React, a VDOM, hydration, and a retained browser component tree remain forbidden.
- A small compiler-generated capability module is not a general client runtime. Route-specific effects and runtime path-parameter readers are allowed when the browser is the only place the value can exist.
- Native document navigation is the default. Do not add an SPA router unless a real migration fixture proves it necessary and the user explicitly approves it.
- Before planning migration-related framework work, read `MIGRATION_ROADMAP.md`. Follow its order and acceptance criteria instead of inventing a new architecture.

- New Kudzu source imports framework APIs from `@kudzujs/core`. Migration input may retain supported named hook imports from `react` plus default, namespace, or named `Fragment`; the compiler must erase those React module references and must never emit or execute React.
- Use function components, props, and children for composition.
- Declare local state exactly like React with `useState`; reduced `useReducer` support requires a pure synchronous two-parameter reducer imported from a relative TypeScript module. Dispatch may cross one direct prop boundary into a specialized same-file or relative-imported synchronous component, including a direct keyed row, and one inline or simple `const` callback containing dispatch may cross one additional relative-imported intrinsic component boundary. These reducer specializations accept destructured primitive literal prop defaults.
- Event handlers use normal synchronous or async JavaScript. State setters update logical state immediately and DOM writes batch at synchronous-turn boundaries.
- Command-only setter and `console.log(label, state)` handlers use the optimized behavior path; other handlers compile to external ESM.
- Native handlers may capture serializable component locals and destructured props. Relative imported helpers and supported reducer imports compile into handler ESM; non-serializable captures remain unsupported.
- A keyed row may contain multiple keyed maps over direct parent-item array properties at any nesting depth. Intrinsic, same-file, or relative-imported rows support recursive component specialization, nested item conditions, latest-item handlers, multiple directly serializable `useState` values, effects, and object refs initialized with `null`; key paths own hook state across updates/reorder and release it on removal.
- Put routes in `src/pages`; `index.tsx` maps to `/`.
- Do not add a VDOM, hydration, state library, general component runtime, or default SPA router.
- Run `npm run check` and `npm test` after changes.
