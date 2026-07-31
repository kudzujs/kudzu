import { Fragment } from "react"
import { FeatureGrid, Footer, Hero } from "../LandingSections"

export default function StaticLandingPage() {
  return <Fragment>
    <main><Hero /><FeatureGrid /></main>
    <Footer />
  </Fragment>
}
