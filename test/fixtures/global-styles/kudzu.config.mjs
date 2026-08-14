import { writeFile } from "node:fs/promises"
import { join } from "node:path"

export default {
  base: "/guide",
  styles: [{ source: "src/base.css", output: "/assets/base.css" }, "/assets/base.css", "/assets/generated.css", "HTTPS://cdn.example.test/theme.css"],
  async afterBuild({ outDir }) {
    await writeFile(join(outDir, "assets/generated.css"), "main { color: rebeccapurple; }")
  }
}
