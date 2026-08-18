import { useState } from "react"
import { Dropdown } from "../Dropdown"

export default function Page() {
  const [selectedItems, setSelectedItems] = useState(["Solar"])
  return <Dropdown selectedItems={selectedItems} setSelectedItems={setSelectedItems} />
}
