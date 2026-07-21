# Framework Internals

- `build.mjs`: TSX compilation, file routes, behavior extraction, static HTML output, and the development server.
- `core.mjs`: server-side JSX rendering, state slots, behavior metadata, and serializable capture validation.
- `jsx-runtime.mjs`: automatic JSX runtime used by TypeScript.
- `runtime.js`: command-only runtime for direct state-to-text patches.
- `binding-runtime.js`: optional reactive `className`, `disabled`, and `value` patches.
- `serialization.js`: capture deserialization shared by binding and native handlers.
- `native-runtime.js`: optional runtime for normal synchronous and asynchronous ESM handlers.
- `*.d.ts`: public TypeScript and JSX declarations.

Static routes receive no browser runtime. Command routes receive `runtime.js`; reactive attributes add `binding-runtime.js`; native handlers add `native-runtime.js`. Generated evaluators live under `dist/assets/handlers/`.

Page `metadata` can emit description, canonical, favicon, manifest, Open Graph, and Twitter Card tags without a client runtime.
