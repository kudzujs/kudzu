import React from "react"

function FeatureCard({ title, copy }: { title: string; copy: string }) {
  return <article>
    <h3>{title}</h3>
    <p>{copy}</p>
  </article>
}

export function Hero() {
  return <section data-hero>
    <h1>Ship a faster landing page</h1>
    <p>Static HTML with interaction only where needed.</p>
    <a href="#features">Explore features</a>
  </section>
}

export function FeatureGrid() {
  return <React.Fragment>
    <section id="features" data-features>
      <FeatureCard title="Static first" copy="Complete HTML at first load." />
      <FeatureCard title="Small runtime" copy="Only menu behavior ships." />
    </section>
    <section id="contact"><a href="mailto:hello@example.com">Contact</a></section>
  </React.Fragment>
}

export function Footer() {
  return <footer>Built for the web</footer>
}
