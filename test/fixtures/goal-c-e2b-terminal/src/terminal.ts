export type TerminalHandle = {
  close(): void
  resume(): void
}

export async function openTerminal(): Promise<TerminalHandle> {
  return {
    close() {},
    resume() {}
  }
}
