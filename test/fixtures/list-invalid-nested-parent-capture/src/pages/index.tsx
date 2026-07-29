import { useState } from "@kudzujs/core"

export default function InvalidNestedParentCapturePage() {
  const [categories, setCategories] = useState([{ id: "c1", title: "Spa", items: [{ id: "a1", title: "Sauna" }] }])
  return <main>{categories.map(category => <section key={category.id}>
    {category.items.map(item => <button key={item.id} onClick={() => console.log(category.title, item.title)}>{item.title}</button>)}
  </section>)}</main>
}
