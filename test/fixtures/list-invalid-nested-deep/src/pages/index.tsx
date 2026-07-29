import { useState } from "@kudzujs/core"

export default function InvalidDeepNestedListPage() {
  const [categories, setCategories] = useState([{ id: "c1", items: [{ id: "a1", options: [{ id: "o1", title: "Morning" }] }] }])
  return <main>{categories.map(category => <section key={category.id}>
    {category.items.map(item => <div key={item.id}>
      {item.options.map(option => <span key={option.id}>{option.title}</span>)}
    </div>)}
  </section>)}</main>
}
