import { useEffect, useState } from "react"

export function Dropdown({ selectedItems, setSelectedItems }: { selectedItems: string[]; setSelectedItems: (items: string[]) => void }) {
  const [items] = useState(selectedItems)
  useEffect(() => {
    setSelectedItems([...items])
  }, [items, setSelectedItems])
  return <p>Invalid</p>
}
