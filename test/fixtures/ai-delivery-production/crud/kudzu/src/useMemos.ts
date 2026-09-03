import { useContext } from "@kudzujs/core"
import { MemosContext } from "./memos"

export function useMemos() {
  return useContext(MemosContext)
}
