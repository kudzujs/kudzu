import { createContext, useState } from "@kudzujs/core"

type Note = { id: number; title: string }
type NotesValue = {
  notes: Note[]
  activeId: number
  createNote: (title: string) => void
  renameNote: (id: number, title: string) => void
  deleteNote: (id: number) => void
  selectNote: (id: number) => void
}

export const NotesContext = createContext<NotesValue>({} as NotesValue)

export function NotesProvider({ children }: { children: unknown }) {
  const [notes, setNotes] = useState<Note[]>([{ id: 1, title: "First" }])
  const [activeId, setActiveId] = useState(1)
  const createNote = (title: string) => {
    const note = { id: notes.length + 1, title }
    setNotes([...notes, note])
    setActiveId(note.id)
  }
  const renameNote = (id: number, title: string) => {
    setNotes(notes.map(note => note.id === id ? { ...note, title } : note))
  }
  const deleteNote = (id: number) => {
    setNotes(notes.filter(note => note.id !== id))
    if (activeId === id) setActiveId(0)
  }
  const selectNote = (id: number) => setActiveId(id)

  return <NotesContext.Provider value={{ notes, activeId, createNote, renameNote, deleteNote, selectNote }}>
    {children}
  </NotesContext.Provider>
}
