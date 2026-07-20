import React from "react"
import { createRoot } from "react-dom/client"
import "./style.css"

function App() {
  return <><main className="shell"><header className="site-header"><a className="brand" href="/">KUDZU<span>/</span>JOURNAL</a><nav aria-label="Primary navigation"><a href="#notes">Notes</a><a href="#about">About</a><a href="https://github.com/kudzujs/kudzu">GitHub</a></nav></header><section className="hero" id="about"><p className="eyebrow">WEB PLATFORM · FIELD NOTES</p><h1>웹을 만들며 배운 것을 기록합니다.</h1><p className="intro">Kudzu 프레임워크의 렌더링, 상태, 성능 실험을 같은 조건에서 기록합니다.</p></section><section className="notes" id="notes" aria-label="Notes"><article><span>01 / STATE</span><h2>동기적인 상태는 코드를 얼마나 읽기 쉽게 만드는가</h2></article><article><span>02 / REALTIME</span><h2>실시간 대시보드를 설계할 때 먼저 정할 것들</h2></article><article><span>03 / FUNDAMENTALS</span><h2>프론트엔드 기본기를 다시 시험하는 방법</h2></article></section></main><footer>HTML과 JavaScript의 경계를 실험하고 기록합니다.</footer></>
}

createRoot(document.getElementById("root")).render(<App />)
