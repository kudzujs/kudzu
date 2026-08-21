import { create } from "zustand"

type Session = { status: string; token: string; username: string; isAdmin: boolean }
type SessionStore = {
  session: Session
  replace: (session: Session) => void
  clear: () => void
}

export const useSession = create<SessionStore>(set => ({
  session: { status: "loading", token: "", username: "", isAdmin: false },
  replace: session => set(() => ({ session })),
  clear: () => set(() => ({ session: { status: "anonymous", token: "", username: "", isAdmin: false } })),
}))
