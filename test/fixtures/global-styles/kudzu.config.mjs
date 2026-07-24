import { writeFile } from "node:fs/promises"
import { join } from "node:path"

export default {
  base: "/guide",
  styles: ["/assets/generated.css", "HTTPS://cdn.example.test/theme.css"],
  async afterBuild({ outDir }) {
    await writeFile(join(outDir, "assets/generated.css"), "main { color: rebeccapurple; }")
  }
}
