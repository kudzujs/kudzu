import { useEffect } from "@kudzujs/core"
import styles from "./DefaultRow.module.css"
import icon from "./row.svg?url"

type Props = { item: { id: number; name: string }; onRemove: () => void }

export default function DefaultRow({ item, onRemove }: Props) {
  const label = item.name.toUpperCase()
  useEffect(() => {
    console.log("row-icon", icon)
  }, [])
  return <li className={styles.row} data-default={item.id} data-icon={icon}>{label}<button onClick={onRemove}>Remove</button></li>
}
