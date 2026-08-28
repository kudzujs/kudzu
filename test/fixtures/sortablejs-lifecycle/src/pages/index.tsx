import Sortable, { type SortableEvent } from "sortablejs"
import { useEffect, useRef, useState } from "react"

type Card = { id: string; label: string }

function SortableBoard() {
  const [cards, setCards] = useState<Card[]>([
    { id: "a", label: "Alpha" },
    { id: "b", label: "Beta" },
    { id: "c", label: "Gamma" },
  ])
  const [sortingActive, setSortingActive] = useState(false)
  const [status, setStatus] = useState("Sorting off")
  const grid = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const list = grid.current
    if (!sortingActive || !list) return
    const onEnd = ({ item, from, oldIndex, newIndex }: SortableEvent) => {
      if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return
      const rows = Array.from(from.children).filter(child => child instanceof HTMLElement && child.dataset.cardId)
      from.removeChild(item)
      const anchor = rows.filter(row => row !== item)[oldIndex] ?? null
      from.insertBefore(item, anchor)
      const draggedId = item.dataset.cardId
      if (!draggedId) {
        setStatus("Reorder failed; original order restored")
        return
      }
      setCards(previous => {
        const next = previous.filter(card => card.id !== draggedId)
        next.splice(newIndex, 0, previous.find(card => card.id === draggedId)!)
        return next
      })
      setStatus("Order updated")
    }
    const sortable = Sortable.create(list, {
      animation: 0,
      draggable: "[data-card-id]",
      forceFallback: true,
      fallbackTolerance: 0,
      onEnd,
    })
    ;(globalThis as any).__sortableEnd = onEnd
    document.body.dataset.sortableMounts = String(Number(document.body.dataset.sortableMounts || "0") + 1)
    return () => {
      delete (globalThis as any).__sortableEnd
      sortable.destroy()
      document.body.dataset.sortableDisposals = String(Number(document.body.dataset.sortableDisposals || "0") + 1)
    }
  }, [sortingActive])

  return <section>
    <button data-toggle-sorting aria-pressed={sortingActive} onClick={() => {
      setSortingActive(!sortingActive)
      setStatus(sortingActive ? "Sorting off" : "Sorting on")
    }}>Toggle sorting</button>
    <button data-keyboard-reorder onClick={() => {
      setCards([cards[2], cards[0], cards[1]])
      setStatus("Order updated by keyboard")
    }}>Move last card first</button>
    <button data-reset-order onClick={() => {
      setCards([{ id: "a", label: "Alpha" }, { id: "b", label: "Beta" }, { id: "c", label: "Gamma" }])
      setStatus("Order reset")
    }}>Reset order</button>
    <output aria-live="polite" data-sort-status>{status}</output>
    <ul data-sortable-grid ref={grid}>
      {cards.map(card => <li key={card.id} data-card-id={card.id}>
        <span>{card.label}</span>
        <input data-card-draft aria-label={`${card.label} draft`} />
      </li>)}
    </ul>
  </section>
}

export default function Page() {
  const [visible, setVisible] = useState(true)
  return <main>
    <h1>Device cards</h1>
    <button data-toggle-board onClick={() => setVisible(!visible)}>Toggle board</button>
    {visible && <SortableBoard />}
  </main>
}
