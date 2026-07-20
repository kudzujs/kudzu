# Kudzu Project Rules

- Use Kudzu TSX, not React or Next.js.
- Import framework APIs from `@kudzujs/core`.
- Use function components, props, and children for composition.
- Declare local primitive state exactly like React: `const [value, setValue] = useState(initial)`.
- Event handlers use normal synchronous or async JavaScript. State setters update logical state immediately and DOM writes batch at synchronous-turn boundaries.
- Command-only setter and `console.log(label, state)` handlers use the optimized behavior path; other handlers compile to external ESM.
- Native handlers may capture serializable component locals and destructured props; imported functions and non-serializable helpers remain unsupported.
- Put routes in `src/pages`; `index.tsx` maps to `/`.
- Do not add a router, VDOM, state library, or client runtime.
- Run `npm run check` and `npm test` after changes.
