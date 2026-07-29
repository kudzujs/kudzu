import { useEffect, useState } from "@kudzujs/core"

type Item = { id: string; title: string; price: number }
type Category = { id: string; title: string; items: Item[] }

const spa: Category = {
  id: "c1",
  title: "Spa",
  items: [
    { id: "a1", title: "Sauna", price: 20 },
    { id: "a2", title: "Massage", price: 30 }
  ]
}

export default function NestedListsPage() {
  const [categories, setCategories] = useState<Category[]>([spa])

  useEffect(() => {
    setCategories([...categories, { id: "c2", title: "Dining", items: [{ id: "b1", title: "Breakfast", price: 10 }] }])
  }, [])

  return <main>
    <button data-action="update" onClick={() => setCategories(categories.map(category => category.id === "c1" ? {
      ...category,
      title: "Wellness",
      items: category.items.map(item => item.id === "a1" ? { ...item, title: "Sauna Plus", price: 25 } : item)
    } : category))}>Update</button>
    <button data-action="parent-reorder" onClick={() => setCategories([...categories].reverse())}>Reorder categories</button>
    <button data-action="child-reorder" onClick={() => setCategories(categories.map(category => category.id === "c1" ? { ...category, items: [...category.items].reverse() } : category))}>Reorder items</button>
    <button data-action="child-remove" onClick={() => setCategories(categories.map(category => category.id === "c1" ? { ...category, items: category.items.filter(item => item.id !== "a2") } : category))}>Remove item</button>
    <button data-action="child-readd" onClick={() => setCategories(categories.map(category => category.id === "c1" ? { ...category, items: [...category.items, { id: "a2", title: "Massage Re-added", price: 35 }] } : category))}>Re-add item</button>
    <button data-action="parent-remove" onClick={() => setCategories(categories.filter(category => category.id !== "c1"))}>Remove category</button>
    <button data-action="parent-readd" onClick={() => setCategories([...categories, { ...spa, title: "Spa Re-added", items: [{ id: "a3", title: "Facial", price: 40 }] }])}>Re-add category</button>

    <div data-categories>
      {categories.map(item => <section key={item.id} data-category={item.id}>
        <h2>{item.title}</h2>
        {item.title === "Spa" ? <b data-kind>Spa kind</b> : <i data-kind>Other kind</i>}
        <ul data-items>
          {item.items.map(item => <li key={item.id} data-item={item.id}>
            <span data-title>{item.title}</span>
            <span data-price>{item.price}</span>
            <input data-uncontrolled />
            <button data-select onClick={() => { document.body.dataset.selected = `${item.title}|${item.price}` }}>Select</button>
          </li>)}
        </ul>
        <footer>{item.title}</footer>
      </section>)}
    </div>
  </main>
}
