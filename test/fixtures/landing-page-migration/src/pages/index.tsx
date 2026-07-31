import React, { useState } from "react"
import { FeatureGrid, Footer, Hero } from "../LandingSections"

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return <header>
    <a href="/" aria-label="Home">Kudzu</a>
    <button
      id="menu-toggle"
      aria-controls="mobile-menu"
      aria-expanded={menuOpen}
      onClick={() => setMenuOpen(!menuOpen)}
    >
      {menuOpen ? "Close menu" : "Open menu"}
    </button>
    {menuOpen && <nav id="mobile-menu" aria-label="Mobile navigation">
      <a href="#features">Features</a>
      <a href="#contact">Contact</a>
    </nav>}
  </header>
}

export default function LandingPage() {
  return <React.Fragment>
    <Header />
    <main><Hero /><FeatureGrid /></main>
    <Footer />
  </React.Fragment>
}
