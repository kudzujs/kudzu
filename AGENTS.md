# Kudzu Project Rules

## Product Direction

- Kudzu's primary product goal is AI-assisted migration of ordinary React-shaped TSX to static deploy artifacts.
- Preserve familiar function components, props, children, JSX, hooks, and event-handler syntax where Kudzu can compile them safely.
- The output remains pre-rendered HTML, CSS, and only the route-specific ESM capabilities actually used. Static pages must ship no JavaScript.
- React, a VDOM, hydration, and a retained browser component tree remain forbidden.
- A small compiler-generated capability module is not a general client runtime. Route-specific effects and runtime path-parameter readers are allowed when the browser is the only place the value can exist.
- Native document navigation is the default. Do not add an SPA router unless a real migration fixture proves it necessary and the user explicitly approves it.
- Before planning migration-related framework work, read `MIGRATION_ROADMAP.md`. Follow its order and acceptance criteria instead of inventing a new architecture.

- Use Kudzu TSX, not React or Next.js.
- Import framework APIs from `@kudzujs/core`.
- Use function components, props, and children for composition.
- Declare local state exactly like React with `useState`; reduced `useReducer` support requires a synchronous two-parameter reducer imported from a relative TypeScript module.
- Event handlers use normal synchronous or async JavaScript. State setters update logical state immediately and DOM writes batch at synchronous-turn boundaries.
- Command-only setter and `console.log(label, state)` handlers use the optimized behavior path; other handlers compile to external ESM.
- Native handlers may capture serializable component locals and destructured props. Relative imported helpers and supported reducer imports compile into handler ESM; non-serializable captures remain unsupported.
- Put routes in `src/pages`; `index.tsx` maps to `/`.
- Do not add a VDOM, hydration, state library, general component runtime, or default SPA router.
- Run `npm run check` and `npm test` after changes.
