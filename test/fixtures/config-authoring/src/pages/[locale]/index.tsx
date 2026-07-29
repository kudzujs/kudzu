type Locale = "ko" | "en"

export function getStaticPaths() {
  return (["ko", "en"] as Locale[]).map(locale => ({ params: { locale }, props: { locale } }))
}

export function metadata({ props }: { props: { locale: Locale } }) {
  return { title: `${props.locale.toUpperCase()} page` }
}

export default function LocalePage({ locale }: { locale: Locale }) {
  return <main>{locale}</main>
}
