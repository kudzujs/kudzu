import { writeFile } from "node:fs/promises"
import { join } from "node:path"

export default {
  navigation: {
    routes: ["/app/projects", "/app/projects/alpha"]
  },
  async afterBuild({ outDir, rewrites }) {
    await writeFile(join(outDir, "rewrites.json"), JSON.stringify(rewrites))
  }
}
