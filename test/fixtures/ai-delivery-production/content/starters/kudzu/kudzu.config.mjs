const routeTitles = {
  "/articles": "Articles",
  "/topics/performance": "Performance",
  "/about": "About",
  "/static": "Static edition"
}

export default {
  styles: [{ source: "src/styles.css", output: "/assets/styles.css" }],
  metadata: ({ route, props }) => ({
    title: props.title ? `${props.title} | Field Notes` : route === "/" ? "Field Notes" : `${routeTitles[route] ?? "Field Notes"} | Field Notes`,
    description: "Practical notes on resilient interfaces, accessible systems, and responsible performance.",
    lang: "en"
  })
}
