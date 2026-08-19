export type TerminalHandle = {
  close(): void
  resume(): void
}

export async function openTerminal(): Promise<TerminalHandle> {
  const controlled = (globalThis as typeof globalThis & { __kTerminalOpen?: () => Promise<TerminalHandle> }).__kTerminalOpen
  if (controlled) return controlled()
  return {
    close() {},
    resume() {}
  }
}
