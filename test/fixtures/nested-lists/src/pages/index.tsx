import { useEffect, useState } from "@kudzujs/core"

type Option = { id: string; title: string }
type Group = { id: string; title: string; options: Option[] }
type Badge = { id: string; title: string }
type Item = { id: string; title: string; price: number; groups: Group[]; badges: Badge[] }
type Category = { id: string; title: string; items: Item[] }

const spa: Category = {
  id: "c1",
  title: "Spa",
  items: [
    { id: "a1", title: "Sauna", price: 20, groups: [{ id: "g1", title: "Morning", options: [{ id: "o1", title: "Tea" }] }], badges: [{ id: "b1", title: "Hot" }, { id: "b2", title: "Quiet" }] },
    { id: "a2", title: "Massage", price: 30, groups: [{ id: "g2", title: "Evening", options: [{ id: "o2", title: "Oil" }] }], badges: [{ id: "b3", title: "Calm" }] }
  ]
}

function OptionRow({ option }: { option: Option }) {
  return <button data-option={option.id} onClick={() => { document.body.dataset.option = option.title }}>{option.title}</button>
}

function GroupRow({ group }: { group: Group }) {
  return <div data-group={group.id}>
    <button data-group-select onClick={() => { document.body.dataset.group = group.title }}><span data-group-title>{group.title}</span></button>
    <div data-options>{group.options.map(option => <OptionRow key={option.id} option={option} />)}</div>
  </div>
}

export default function NestedListsPage() {
  const [categories, setCategories] = useState<Category[]>([spa])

  useEffect(() => {
    setCategories([...categories, { id: "c2", title: "Dining", items: [{ id: "b1", title: "Breakfast", price: 10, groups: [{ id: "g3", title: "Buffet", options: [{ id: "o3", title: "Coffee" }] }], badges: [{ id: "b4", title: "Early" }] }] }])
  }, [])

  return <main>
    <button data-action="update" onClick={() => setCategories(categories.map(category => category.id === "c1" ? {
      ...category,
      title: "Wellness",
      items: category.items.map(item => item.id === "a1" ? { ...item, title: "Sauna Plus", price: 25, groups: item.groups.map(group => group.id === "g1" ? { ...group, title: "Late Morning", options: group.options.map(option => option.id === "o1" ? { ...option, title: "Green Tea" } : option) } : group) } : item)
    } : category))}>Update</button>
    <button data-action="parent-reorder" onClick={() => setCategories([...categories].reverse())}>Reorder categories</button>
    <button data-action="child-reorder" onClick={() => setCategories(categories.map(category => category.id === "c1" ? { ...category, items: [...category.items].reverse() } : category))}>Reorder items</button>
    <button data-action="child-remove" onClick={() => setCategories(categories.map(category => category.id === "c1" ? { ...category, items: category.items.filter(item => item.id !== "a2") } : category))}>Remove item</button>
    <button data-action="child-readd" onClick={() => setCategories(categories.map(category => category.id === "c1" ? { ...category, items: [...category.items, { id: "a2", title: "Massage Re-added", price: 35, groups: [{ id: "g2", title: "Evening Re-added", options: [{ id: "o2", title: "Oil Re-added" }] }], badges: [{ id: "b3", title: "Calm Re-added" }] }] } : category))}>Re-add item</button>
    <button data-action="group-add" onClick={() => setCategories(categories.map(category => category.id === "c1" ? { ...category, items: category.items.map(item => item.id === "a1" ? { ...item, groups: [...item.groups, { id: "g4", title: "Weekend", options: [{ id: "o4", title: "Herbal Tea" }] }] } : item) } : category))}>Add group</button>
    <button data-action="group-reorder" onClick={() => setCategories(categories.map(category => category.id === "c1" ? { ...category, items: category.items.map(item => item.id === "a1" ? { ...item, groups: [...item.groups].reverse() } : item) } : category))}>Reorder groups</button>
    <button data-action="option-add" onClick={() => setCategories(categories.map(category => category.id === "c1" ? { ...category, items: category.items.map(item => item.id === "a1" ? { ...item, groups: item.groups.map(group => group.id === "g1" ? { ...group, options: [...group.options, { id: "o5", title: "Water" }] } : group) } : item) } : category))}>Add option</button>
    <button data-action="option-reorder" onClick={() => setCategories(categories.map(category => category.id === "c1" ? { ...category, items: category.items.map(item => item.id === "a1" ? { ...item, groups: item.groups.map(group => group.id === "g1" ? { ...group, options: [...group.options].reverse() } : group) } : item) } : category))}>Reorder options</button>
    <button data-action="badge-update" onClick={() => setCategories(categories.map(category => category.id === "c1" ? { ...category, items: category.items.map(item => item.id === "a1" ? { ...item, badges: item.badges.map(badge => badge.id === "b1" ? { ...badge, title: "Very Hot" } : badge) } : item) } : category))}>Update badge</button>
    <button data-action="badge-add" onClick={() => setCategories(categories.map(category => category.id === "c1" ? { ...category, items: category.items.map(item => item.id === "a1" ? { ...item, badges: [...item.badges, { id: "b5", title: "Dry" }] } : item) } : category))}>Add badge</button>
    <button data-action="badge-reorder" onClick={() => setCategories(categories.map(category => category.id === "c1" ? { ...category, items: category.items.map(item => item.id === "a1" ? { ...item, badges: [...item.badges].reverse() } : item) } : category))}>Reorder badges</button>
    <button data-action="parent-remove" onClick={() => setCategories(categories.filter(category => category.id !== "c1"))}>Remove category</button>
    <button data-action="parent-readd" onClick={() => setCategories([...categories, { ...spa, title: "Spa Re-added", items: [{ id: "a3", title: "Facial", price: 40, groups: [{ id: "g5", title: "Anytime", options: [{ id: "o6", title: "Mask" }] }], badges: [{ id: "b6", title: "New" }] }] }])}>Re-add category</button>

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
            <div data-groups>{item.groups.map(group => <GroupRow key={group.id} group={group} />)}</div>
            <div data-badges>{item.badges.map(badge => <span key={badge.id} data-badge={badge.id}>{badge.title}</span>)}</div>
            <div data-badge-copy>{item.badges.map(badge => <em key={badge.id} data-badge-copy={badge.id}>{badge.title}</em>)}</div>
          </li>)}
        </ul>
        <footer>{item.title}</footer>
      </section>)}
    </div>
  </main>
}
