import { useEffect } from "react"

export default function LocaleEntryPage() {
  useEffect(() => {
    const stored = localStorage.getItem("locale")
    const locale = stored === "ko" || stored === "en"
      ? stored
      : navigator.languages.some(language => language.toLowerCase().startsWith("en")) ? "en" : "ko"
    location.replace(`/${locale}${location.search}${location.hash}`)
  }, [])

  return <main><p>Choosing your language...</p><a href="/ko">Continue in Korean</a></main>
}
