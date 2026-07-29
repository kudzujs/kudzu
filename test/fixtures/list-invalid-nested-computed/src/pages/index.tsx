import { useState } from "@kudzujs/core"

export default function InvalidComputedNestedListPage() {
  const [categories, setCategories] = useState([{ id: "c1", field: "items" as const, items: [{ id: "a1", title: "Sauna" }] }])
  return <main>{categories.map(category => <section key={category.id}>
    {category[category.field].map(item => <span key={item.id}>{item.title}</span>)}
  </section>)}</main>
}
