import { useEffect, useRef } from "react"
import { LocaleLink } from "../../components/LocaleLink"
import { CopyBlock, Tabs } from "../../components/MdxComponents"
import { compiledArticleHtml } from "../../content"

type Locale = "ko" | "en"

export function getStaticPaths() {
  return (["ko", "en"] as Locale[]).map(locale => ({ params: { locale }, props: { locale } }))
}

export default function BlogPage({ locale }: { locale: Locale }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const alternateLocale: Locale = locale === "ko" ? "en" : "ko"

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext("2d")
    if (!context) return
    let frame = 0
    let visible = true
    let x = 20

    const draw = () => {
      const width = canvas.getBoundingClientRect().width
      context.clearRect(0, 0, width, 80)
      context.fillRect(x, 30, 20, 20)
      context.fillText(String(Math.round(performance.now())), 4, 12)
    }
    const tick = () => {
      if (visible) draw()
      frame = requestAnimationFrame(tick)
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    })
    const move = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") x += 8
      if (event.key === "ArrowLeft") x -= 8
    }
    const choose = (event: MouseEvent) => {
      x = event.clientX - canvas.getBoundingClientRect().left
    }

    observer.observe(canvas)
    window.addEventListener("keydown", move)
    canvas.addEventListener("click", choose)
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener("keydown", move)
      canvas.removeEventListener("click", choose)
    }
  }, [])

  return <main>
    <nav aria-label="Language">
      <LocaleLink locale={locale} href="/">Home</LocaleLink>
      <LocaleLink locale={locale} href="/posts?tag=JavaScript">Posts</LocaleLink>
      <LocaleLink locale={alternateLocale} href="/posts/math-for-development">Switch language</LocaleLink>
    </nav>
    <article lang={locale} dangerouslySetInnerHTML={{ __html: compiledArticleHtml }} />
    <CopyBlock />
    <Tabs />
    <canvas ref={canvasRef} width="640" height="80" role="img" aria-label="Walking dog animation">Walking dog animation</canvas>
  </main>
}
