import { NotesProvider } from "../notes"
import { useNotes } from "../useNotes"

function Notes() {
  const { notes, activeId, createNote, renameNote, deleteNote, selectNote } = useNotes()
  const setNotes = "consumer binding"

  return <main>
    <button data-create aria-label={setNotes} onClick={() => createNote("New")}>Create</button>
    <output data-active>{activeId}</output>
    {notes.map(note => <section key={note.id} data-note={note.id}>
      <button data-select onClick={() => selectNote(note.id)}>{note.title}</button>
      <button data-rename onClick={() => renameNote(note.id, `${note.title}!`)}>Rename</button>
      <button data-delete onClick={() => deleteNote(note.id)}>Delete</button>
    </section>)}
  </main>
}

export default function Page() {
  return <NotesProvider><Notes /></NotesProvider>
}
