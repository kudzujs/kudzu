import React from "react"
import "./styles/landing.css"
import styles from "./styles/Hero.module.css"
import heroImage from "./assets/hero.svg"
import previewImage from "./assets/preview.webp?url"
import badgeImage from "./assets/badge.png"

function FeatureCard({ title, copy }: { title: string; copy: string }) {
  return <article>
    <h3>{title}</h3>
    <p>{copy}</p>
  </article>
}

export function Hero() {
  return <section className={styles.hero} data-hero>
    <img src={heroImage} alt="Kudzu leaves" />
    <h1>Ship a faster landing page</h1>
    <p>Static HTML with interaction only where needed.</p>
    <a href="#features">Explore features</a>
  </section>
}

export function FeatureGrid() {
  return <React.Fragment>
    <section id="features" data-features>
      <img src={previewImage} alt="Migration preview" />
      <img src={badgeImage} alt="Static asset badge" />
      <FeatureCard title="Static first" copy="Complete HTML at first load." />
      <FeatureCard title="Small runtime" copy="Only menu behavior ships." />
    </section>
    <section id="contact"><a href="mailto:hello@example.com">Contact</a></section>
  </React.Fragment>
}

export function Footer() {
  return <footer>Built for the web</footer>
}
