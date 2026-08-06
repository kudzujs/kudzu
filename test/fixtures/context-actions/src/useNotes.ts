import { useContext } from "@kudzujs/core"
import { NotesContext } from "./notes"

export function useNotes() {
  return useContext(NotesContext)
}
