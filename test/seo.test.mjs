import assert from "node:assert/strict"
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import config from "../kudzu.config.mjs"

test("generates canonical SEO output for Cloudflare static assets", async () => {
  const outDir = await mkdtemp(join(tmpdir(), "kudzu-seo-"))
  const routes = ["/", "/docs", "/example", "/releases/0.8.2", "/releases/0.8.15", "/releases/0.8.16", "/example/blog/personal", "/example/blog/personal/demo", "/example/blog/personal/demo/a-room-made-for-reading"]
  try {
    for (const route of routes) {
      const directory = route === "/" ? outDir : join(outDir, route.slice(1))
      await mkdir(directory, { recursive: true })
      await writeFile(join(directory, "index.html"), "<!doctype html><html><head><title>Old</title><meta name=\"description\" content=\"Old\"></head><body></body></html>")
    }
    await config.afterBuild({ outDir, routes })

    const sitemap = await readFile(join(outDir, "sitemap.xml"), "utf8")
    assert.match(sitemap, /https:\/\/kudzujs\.cloud\/example\/blog\/personal\/<\/loc>/)
    assert.match(sitemap, /https:\/\/kudzujs\.cloud\/releases\/0\.8\.2\/<\/loc>/)
    assert.match(sitemap, /https:\/\/kudzujs\.cloud\/releases\/0\.8\.15\/<\/loc>/)
    assert.match(sitemap, /https:\/\/kudzujs\.cloud\/releases\/0\.8\.16\/<\/loc>/)
    assert.doesNotMatch(sitemap, /\/demo/)

    const showcase = await readFile(join(outDir, "example/blog/personal/index.html"), "utf8")
    assert.match(showcase, /<title>Personal Blog Example and Source \| Kudzu<\/title>/)
    assert.match(showcase, /rel="canonical" href="https:\/\/kudzujs\.cloud\/example\/blog\/personal\/"/)
    assert.doesNotMatch(showcase, /noindex/)

    const demo = await readFile(join(outDir, "example/blog/personal/demo/index.html"), "utf8")
    assert.match(demo, /name="robots" content="noindex,follow"/)
    assert.match(demo, /rel="canonical" href="https:\/\/kudzujs\.cloud\/example\/blog\/personal\/"/)
    assert.match(demo, /application\/ld\+json/)
  } finally {
    await rm(outDir, { recursive: true, force: true })
  }
})
