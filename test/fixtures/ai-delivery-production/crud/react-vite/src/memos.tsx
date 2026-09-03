import { createContext, useContext, useState, type ReactNode } from "react"

export type Memo = {
  id: number
  content: string
  archived: boolean
  updatedAt: string
}

type MemosValue = {
  memos: Memo[]
  status: string
  error: string
  createMemo: (content: string) => void
  updateMemo: (id: number, content: string) => void
  deleteMemo: (id: number) => void
  beginSync: () => void
  failSync: () => void
  retrySync: () => void
}

const MemosContext = createContext<MemosValue | null>(null)

export function MemosProvider({ children }: { children: ReactNode }) {
  const [memos, setMemos] = useState<Memo[]>([
    { id: 101, content: "Roadmap notes", archived: false, updatedAt: "Today, 09:40" },
    { id: 102, content: "Release checklist", archived: true, updatedAt: "Yesterday, 16:15" },
    { id: 103, content: "Customer follow-up", archived: false, updatedAt: "Monday, 11:05" },
  ])
  const [nextId, setNextId] = useState(104)
  const [status, setStatus] = useState("All changes saved.")
  const [error, setError] = useState("")

  const createMemo = (content: string) => {
    setMemos(current => [{ id: nextId, content, archived: false, updatedAt: "Just now" }, ...current])
    setNextId(current => current + 1)
    setError("")
    setStatus("Memo created.")
  }
  const updateMemo = (id: number, content: string) => {
    setMemos(current => current.map(memo => memo.id === id ? { ...memo, content, updatedAt: "Just now" } : memo))
    setError("")
    setStatus("Memo updated.")
  }
  const deleteMemo = (id: number) => {
    setMemos(current => current.filter(memo => memo.id !== id))
    setError("")
    setStatus("Memo deleted.")
  }
  const beginSync = () => {
    setError("")
    setStatus("Loading memos...")
  }
  const failSync = () => {
    setError("Memos could not be synchronized.")
    setStatus("Sync failed.")
  }
  const retrySync = () => {
    setError("")
    setStatus("Memos synchronized.")
  }

  return <MemosContext.Provider value={{ memos, status, error, createMemo, updateMemo, deleteMemo, beginSync, failSync, retrySync }}>{children}</MemosContext.Provider>
}

export function useMemos() {
  const value = useContext(MemosContext)
  if (!value) throw new Error("useMemos must be used within MemosProvider")
  return value
}
