import "./style.css"

export const metadata = { title: "Kudzu Journal" }

export default function Layout({ children }) {
  return <html lang="ko"><body>{children}</body></html>
}
