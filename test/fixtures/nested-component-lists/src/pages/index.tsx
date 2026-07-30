import { useState } from "@kudzujs/core"
import ImportedItem from "../ImportedItem"

type Item = { id: string; title: string; available: boolean }
type Category = { id: string; title: string; items: Item[] }

function LocalItem({ item, onSelect }: { item: Item; onSelect: () => void }) {
  const label = item.title.toUpperCase()
  return <li data-local-item={item.id} title={item.title}>
    <span data-direct>{item.title}</span>
    <p data-range>{item.id}: {item.title}</p>
    <span data-label>{label}</span>
    {item.available && <strong data-status title={item.title}><span data-branch>{item.title}</span>Available</strong>}
    <button data-select onClick={() => onSelect()}>Select</button>
  </li>
}

export default function NestedComponentListsPage() {
  const [categories, setCategories] = useState<Category[]>([{
    id: "c1",
    title: "Spa",
    items: [
      { id: "a1", title: "Sauna", available: true },
      { id: "a2", title: "Massage", available: false }
    ]
  }])

  return <main>
    <button data-action="update" onClick={() => setCategories(categories.map(category => ({
      ...category,
      items: category.items.map(item => item.id === "a1" ? { ...item, title: "Sauna Plus", available: false } : item)
    })))}>Update</button>
    <button data-action="restore" onClick={() => setCategories(categories.map(category => ({
      ...category,
      items: category.items.map(item => item.id === "a1" ? { ...item, title: "Sauna Restored", available: true } : item)
    })))}>Restore</button>
    <button data-action="reverse" onClick={() => setCategories(categories.map(category => ({ ...category, items: [...category.items].reverse() })))}>Reverse</button>
    <button data-action="add" onClick={() => setCategories(categories.map(category => ({ ...category, items: [...category.items, { id: "a3", title: "Facial", available: true }] })))}>Add</button>
    <button data-action="hide-added" onClick={() => setCategories(categories.map(category => ({
      ...category,
      items: category.items.map(item => item.id === "a3" ? { ...item, available: false } : item)
    })))}>Hide added</button>

    <div data-local-categories>{categories.map(category => <section key={category.id} data-category={category.id}>
      <h2>{category.title}</h2>
      <ul>{category.items.map(item => <LocalItem key={item.id} item={item} onSelect={() => { document.body.dataset.localSelected = item.title }} />)}</ul>
    </section>)}</div>

    <div data-imported-categories>{categories.map(category => <section key={category.id} data-category={category.id}>
      <h2>{category.title}</h2>
      <ul>{category.items.map(item => <ImportedItem key={item.id} item={item} onSelect={() => { document.body.dataset.importedSelected = item.title }} onStatus={(label) => { document.body.dataset.importedStatus = label }} />)}</ul>
    </section>)}</div>
  </main>
}
