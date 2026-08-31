function useEffect(callback: () => void) {
  callback()
}

export default function Page() {
  useEffect(() => {
    import("@codemirror/view").then(() => {})
  })
  return <main>Shadowed effect</main>
}
