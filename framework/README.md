# Framework Internals

- `build.mjs`: TSX compilation, file routes, behavior extraction, static HTML output, and the development server.
- `core.mjs`: server-side JSX rendering, state slots, behavior metadata, and serializable capture validation.
- `jsx-runtime.mjs`: automatic JSX runtime used by TypeScript.
- `runtime.js`: command-only browser runtime for direct state-to-text patches.
- `native-runtime.js`: optional runtime for normal synchronous and asynchronous ESM handlers.
- `*.d.ts`: public TypeScript and JSX declarations.

Static routes do not receive either browser runtime. Command-only routes receive `runtime.js`; native handlers add `native-runtime.js` and generated modules under `dist/assets/handlers/`.

Page `metadata` can emit description, canonical, favicon, manifest, Open Graph, and Twitter Card tags without a client runtime.
