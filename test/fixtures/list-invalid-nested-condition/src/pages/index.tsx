import { useState } from "@kudzujs/core"

export default function InvalidNestedConditionPage() {
  const [categories, setCategories] = useState([{ id: "c1", items: [{ id: "a1", title: "Sauna", active: true }] }])
  return <main>{categories.map(category => <section key={category.id}>{category.items.map(item => <p key={item.id}>{item.active && <strong>{item.title}</strong>}</p>)}</section>)}</main>
}
