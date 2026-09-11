# Astro public task context

Astro pages use `.astro` components, props, slots, build-time frontmatter and
native HTML. Routes live under `src/pages`; `index.astro` maps to `/`.
Static paths can be generated with `getStaticPaths`. Browser interactions use
page scripts and native DOM events; no client framework is required.
Build and check types with `npm run build`. Prefer normal Astro composition
and native browser behavior. Unrelated static pages should not acquire scripts.
