import { Layout } from "../Layout"

const cardProps = { className: "static-card", "data-kind": "static" }

export default function StaticPage() {
  return <Layout><article {...cardProps}><h1>Static composition</h1></article></Layout>
}
