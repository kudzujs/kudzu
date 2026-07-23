import { useEffect, useState } from "@kudzujs/core"

export default function EffectsPage() {
  const [label, setLabel] = useState("Loading")
  const [ready, setReady] = useState(false)
  const [items, setItems] = useState<{ id: number; name: string }[]>([])
  const [second, setSecond] = useState("pending")
  const [afterFailure, setAfterFailure] = useState("pending")
  const outerLabel = "outer"

  useEffect(async () => {
    const response = await fetch("/api/items.json")
    const result = await response.json()
    const { label: nextLabel, items: nextItems } = result
    setLabel(nextLabel)
    setReady(true)
    setItems(nextItems)
  }, [])

  useEffect(() => {
    Promise.resolve("complete").then(setSecond)
  }, [])

  useEffect(async () => {
    await Promise.resolve()
    throw new Error("expected effect failure")
  }, [])

  useEffect(() => {
    setAfterFailure("continued")
  }, [])

  useEffect(() => {
    const setSecond = (value: string) => {
      document.body.dataset.shadowedSetter = value
    }
    Promise.resolve("local").then(setSecond)
  }, [])

  useEffect(() => {
    const callbacks = { setSecond }
    callbacks.setSecond("shorthand")
    document.body.dataset.shorthandState = ({ second }).second
  }, [])

  useEffect(() => {
    try {
      throw new Error("catch")
    } catch (setSecond) {
      document.body.dataset.catchShadow = setSecond instanceof Error ? setSecond.message : ""
    }
    for (const setSecond of ["for"]) document.body.dataset.forShadow = setSecond
  }, [])

  useEffect(() => {
    if (true) {
      var setSecond = (value: string) => {
        document.body.dataset.varShadow = value
      }
    }
    Promise.resolve("var").then(setSecond)
  }, [])

  useEffect(() => {
    switch ("switch") {
      case "switch": {
        const setSecond = (value: string) => {
          document.body.dataset.switchShadow = value
        }
        setSecond("switch")
      }
    }
  }, [])

  useEffect(() => {
    document.body.dataset.outerCapture = outerLabel
    {
      const outerLabel = "inner"
      document.body.dataset.innerShadow = outerLabel
    }
  }, [])

  useEffect(() => {
    document.body.dataset.laterCapture = later
  }, [])

  useEffect(() => {
    setLaterState("after")
  }, [])

  const later = "later"
  const [laterState, setLaterState] = useState("before")

  return <main data-label={label}>
    <h1>{label}</h1>
    {ready && <p data-ready>Ready</p>}
    <p data-second>{second}</p>
    <p data-after-failure>{afterFailure}</p>
    <p data-later-state>{laterState}</p>
    <ul data-items>{items.map(item => <li key={item.id}>{item.name}</li>)}</ul>
  </main>
}
