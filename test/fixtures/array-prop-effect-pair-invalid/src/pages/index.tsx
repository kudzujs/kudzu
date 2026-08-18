import { useState } from "react"
import { Dropdown } from "../Dropdown"

export default function Page() {
  const [selectedItems] = useState(["Solar"])
  const [otherItems, setOtherItems] = useState(["Wind"])
  return <Dropdown selectedItems={selectedItems} setSelectedItems={setOtherItems} />
}
