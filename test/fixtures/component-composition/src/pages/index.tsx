import { useState } from "react"
import { Layout } from "../Layout"

type Feature = { id: number; title: string; copy: string }

function FeatureRow({ feature, children }: { feature: Feature; children: unknown }) {
  return <li data-feature={feature.id}><strong>{feature.title}</strong>{children}</li>
}

function FeatureGrid({ features, heading }: { features: Feature[]; heading: string }) {
  return <section><h2>{heading}</h2><ul>{features.map(feature =>
    <FeatureRow key={feature.id} feature={feature}><span>{feature.copy}</span> Compiled <small>directly</small></FeatureRow>
  )}</ul></section>
}

export default function LandingPage() {
  const [features, setFeatures] = useState<Feature[]>([
    { id: 1, title: "Static first", copy: "Complete HTML at first load." },
    { id: 2, title: "Direct updates", copy: "Only used behavior ships." }
  ])
  const gridProps = { heading: "Overridden heading" }

  return <Layout>
    <h1>Compose an ordinary landing page</h1>
    <button onClick={() => setFeatures(features.slice(0, 1))}>Keep one</button>
    <FeatureGrid features={features} {...gridProps} {...{ heading: "Kudzu capabilities" }} />
  </Layout>
}
