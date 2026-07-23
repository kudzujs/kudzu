# Framework Internals

- `build.mjs`: TSX compilation, static and `getStaticPaths` routes, base paths, CSS collection, post-build hooks, behavior extraction, static HTML output, and the development server.
- `core.mjs`: server-side JSX rendering, state slots, context providers, behavior metadata, and serializable capture validation.
- `jsx-runtime.mjs`: automatic JSX runtime used by TypeScript.
- `runtime.js`: command-only runtime for direct state-to-text patches.
- `shared-runtime.js`: command runtime with capability commit and DOM lifecycle hooks, emitted only when needed.
- `binding-runtime.js`: optional generic attributes, form properties, comment-bounded text patches, and conditional range patches.
- `list-runtime.js`: optional keyed list validation, external item-expression evaluation, item-local conditional ranges, dynamic styles and item-handler scopes, moves, and cleanup.
- `serialization.js`: capture deserialization shared by binding and native handlers.
- `native-runtime.js`: optional runtime for normal synchronous and asynchronous ESM handlers.
- `dev-state.js`: dev-only, short-lived logical-state snapshot validation and restoration.
- `*.d.ts`: public TypeScript and JSX declarations.

Static routes receive no browser runtime. Command routes receive `runtime.js`; reactive attributes and conditions add `binding-runtime.js`; keyed lists add `list-runtime.js`; native handlers add `native-runtime.js`. Capability runtimes share state and lifecycle hooks through `shared-runtime.js`. Generated evaluators and their bundled relative TypeScript helpers live under `dist/assets/handlers/`; shared helper chunks are emitted only when multiple handler entries need them. The dev server derives stable state identities from route-unique state variable names in each route plan; every state sharing a duplicate name is omitted. It then injects its SSE reload, short-lived full-URL-scoped logical-state snapshot, and build-error client into responses only, never into `dist/`. Snapshots are consumed even when the next page is static or broken. Reload restoration covers compatible framework state, not uncontrolled DOM state, focus, selection, or imperative mutations.

Page `metadata` can emit description, canonical, favicon, manifest, Open Graph, and Twitter Card tags without a client runtime.
