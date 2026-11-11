import { NotesProvider } from "../notes"
import { useNotes } from "../useNotes"

function Notes() {
  const { notes: entries, activeId: selected, createNote: add, renameNote: rename, deleteNote: remove, selectNote: setNotes } = useNotes()
  const __kContext_setNotes = "consumer binding"
  const { activeId: mirrored, setActiveId: choose } = useNotes()
  const { selectNote: reset } = useNotes()
  return <main>
    <button data-create aria-label={__kContext_setNotes} onClick={() => add("New")}>Create</button>
    <output data-active>{selected}</output>
    <output data-mirrored>{mirrored}</output>
    <button data-setter onClick={() => choose(7)}>Choose</button>
    <button data-action-only onClick={() => reset(0)}>Reset</button>
    {entries.map(note => <section key={note.id} data-note={note.id}>
      <button data-select onClick={() => setNotes(note.id)}>{note.title}</button>
      <button data-rename onClick={() => rename(note.id, `${note.title}!`)}>Rename</button>
      <button data-delete onClick={() => remove(note.id)}>Delete</button>
    </section>)}
  </main>
}

export default function Page() {
  return <NotesProvider><Notes /></NotesProvider>
}
