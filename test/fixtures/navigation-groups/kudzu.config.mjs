export default {
  base: "/app",
  navigation: { groups: [
    { routes: ["/alpha", "/items/[id]"] },
    { routes: ["/beta", "/gamma"] }
  ] }
}
