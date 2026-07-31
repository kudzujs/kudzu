import { useState } from "@kudzujs/core"
import ItemRow from "../ItemRow"

type Item = { id: string; label: string; visible: boolean; featured: boolean }
type Board = { id: string; title: string; primary: Item[]; secondary: Item[] }

function BoardRow({ board }: { board: Board }) {
  return <section data-board={board.id}>
    <h2>{board.title}</h2>
    <ul data-primary>{board.primary.map(item => <ItemRow key={item.id} item={item} />)}</ul>
    <ul data-secondary>{board.secondary.map(item => <li key={item.id} data-secondary-item={item.id}>{item.label}</li>)}</ul>
  </section>
}

const initialBoards: Board[] = [{
  id: "board",
  title: "Work",
  primary: [
    { id: "a", label: "Alpha", visible: true, featured: true },
    { id: "b", label: "Beta", visible: false, featured: false },
    { id: "c", label: "Gamma", visible: true, featured: true }
  ],
  secondary: [
    { id: "x", label: "Extra", visible: true, featured: false },
    { id: "y", label: "Yield", visible: true, featured: false }
  ]
}]

export default function ReactShapedIntegrationPage() {
  const [boards, setBoards] = useState(initialBoards)
  const visible = boards.flatMap(board => board.primary).filter((item, index) => item.visible && index >= 0)

  return <main>
    <button data-action="show" onClick={() => setBoards(boards.map(board => ({ ...board, primary: board.primary.map(item => item.id === "b" ? { ...item, visible: true } : item) })))}>Show beta</button>
    <button data-action="reverse" onClick={() => setBoards(boards.map(board => ({ ...board, primary: [...board.primary].reverse() })))}>Reverse</button>
    <button data-action="branch" onClick={() => setBoards(boards.map(board => ({ ...board, primary: board.primary.map(item => item.id === "a" ? { ...item, featured: !item.featured } : item) })))}>Toggle branch</button>
    <button data-action="rename" onClick={() => setBoards(boards.map(board => ({ ...board, primary: board.primary.map(item => item.id === "a" ? { ...item, label: "Alpha latest" } : item) })))}>Rename alpha</button>
    <button data-action="remove" onClick={() => setBoards(boards.map(board => ({ ...board, primary: board.primary.filter(item => item.id !== "a") })))}>Remove alpha</button>
    <button data-action="readd" onClick={() => setBoards(boards.map(board => ({ ...board, primary: [...board.primary, { id: "a", label: "Alpha readded", visible: true, featured: true }] })))}>Re-add alpha</button>

    <ul data-stable>{visible.map((item, index) => <li key={item.id} data-projection={item.id}>{index}:{item.label}</li>)}</ul>
    <ol data-positional>{boards.flatMap(board => board.primary).filter(item => item.visible).map((item, index) => <li key={index} data-projection={item.id}>{index}:{item.label}</li>)}</ol>
    <div data-boards>{boards.map(board => <BoardRow key={board.id} board={board} />)}</div>
  </main>
}
