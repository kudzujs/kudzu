import { gsap } from "gsap"
import { useEffect, useRef, useState } from "react"
import { Shell } from "../Shell"

export const layout = Shell

function LandingHero() {
  const root = useRef<HTMLElement>(null)
  const [offset, setOffset] = useState(18)

  useEffect(() => {
    const host = root.current
    if (!host) return
    const targets = host.querySelectorAll("[data-reveal]")
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const context = gsap.context(() => {
      if (reduced) gsap.set(targets, { clearProps: "opacity,transform,visibility" })
      else gsap.fromTo(targets, { autoAlpha: 0, y: offset }, { autoAlpha: 1, y: 0, duration: 0.01, stagger: 0 })
    }, host)
    host.dataset.animationMode = reduced ? "reduced" : "animated"
    host.dataset.animationOffset = String(offset)
    document.body.dataset.gsapMounts = String(Number(document.body.dataset.gsapMounts || "0") + 1)
    return () => {
      context.revert()
      host.dataset.disposed = "true"
      document.body.dataset.gsapDisposals = String(Number(document.body.dataset.gsapDisposals || "0") + 1)
    }
  }, [offset])

  return <section data-hero ref={root}>
    <p data-reveal>Animation lifecycle</p>
    <h1 data-reveal>Build expressive interfaces without surrendering ownership.</h1>
    <button data-change-animation onClick={() => setOffset(offset + 6)}>Change entrance</button>
  </section>
}

export default function Page() {
  const [visible, setVisible] = useState(true)
  return <main data-route="animation">
    <button data-toggle-hero onClick={() => setVisible(!visible)}>Toggle hero</button>
    {visible && <LandingHero />}
  </main>
}
