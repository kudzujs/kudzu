# Kudzu public task context

Kudzu uses ordinary TypeScript function components, props, children, JSX,
`useState`, `useEffect`, refs, native events, and keyed `.map()` collections.
Routes live under `src/pages`; `index.tsx` maps to `/`. Build with
`npm run build`. Prefer declarative TSX and native browser behavior. Static
pages emit complete HTML and should not acquire JavaScript from an unrelated
interactive route.
