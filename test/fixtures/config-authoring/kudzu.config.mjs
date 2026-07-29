export default {
  publicDir: "static",
  styles: [{
    source: "theme/source.css",
    output: "/assets/app.css",
    transform: css => css.replace("brand-color", "rebeccapurple")
  }],
  metadata: ({ props }) => ({ lang: props.locale, manifest: "/manifest.json" })
}
