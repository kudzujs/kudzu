import { resolve } from "node:path"
import { defineConfig } from "vite"

const routes = [
  "index.html",
  "articles/index.html",
  "articles/designing-for-failure/index.html",
  "articles/shipping-less-javascript/index.html",
  "articles/content-that-lasts/index.html",
  "articles/accessible-by-default/index.html",
  "articles/measuring-what-matters/index.html",
  "articles/calm-release-notes/index.html",
  "topics/performance/index.html",
  "about/index.html",
  "static/index.html"
]

export default defineConfig({
  build: {
    rollupOptions: {
      input: Object.fromEntries(routes.map(route => [route, resolve(import.meta.dirname, route)]))
    }
  }
})
