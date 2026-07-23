import { writeFile } from "node:fs/promises"
import { join } from "node:path"

export default {
  base: "/%ED%8F%AC%ED%84%B8",
  async afterBuild({ outDir, rewrites, base }) {
    await writeFile(join(outDir, "rewrites.json"), JSON.stringify({ rewrites, base }))
  }
}
