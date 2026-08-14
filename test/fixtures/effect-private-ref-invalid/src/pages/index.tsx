import { useEffect, useRef } from "react"

export default function InvalidPage() {
  const sharedRef = useRef(0)
  useEffect(() => {
    sharedRef.current += 1
  }, [])
  useEffect(() => {
    sharedRef.current += 1
  }, [])
  return <main>Invalid shared ref</main>
}
