export function Parent({ children }: { children: unknown }) {
  function parent(event: MouseEvent) {
    document.body.dataset.order += `,${(event.currentTarget as HTMLElement).id}`
  }

  return <div id="parent" onClick={parent}>{children}</div>
}
