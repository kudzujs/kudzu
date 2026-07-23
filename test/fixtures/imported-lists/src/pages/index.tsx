import { useState } from "@kudzujs/core"
import DefaultRow from "../components/DefaultRow"
import { NamedRow as AliasedRow } from "../components/NamedRow"
import { BarrelRow } from "../components"

export default function Page() {
  const [items, setItems] = useState([{ id: 1, name: "Oak" }, { id: 2, name: "Pine" }])
  return <main>
    <ul data-default-list>{items.map(item => <DefaultRow key={item.id} item={item} onRemove={() => setItems(items.filter(entry => entry.id !== item.id))} />)}</ul>
    <ul data-aliased-list>{items.map(item => <AliasedRow key={item.id} item={item} />)}</ul>
    <ul data-barrel-list>{items.map(item => <BarrelRow key={item.id} item={item} />)}</ul>
  </main>
}
