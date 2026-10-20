import { build } from "vite"

await build({
  root: import.meta.dirname,
  logLevel: "silent",
  esbuild: { jsx: "automatic", jsxImportSource: "react" },
  build: { outDir: "dist", emptyOutDir: true, minify: true, sourcemap: false }
})
