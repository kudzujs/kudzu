export function getStaticPaths() {
  return [{ params: { slug: "../escape" } }]
}

export default function InvalidDynamicPage() {
  return <main>Invalid</main>
}
