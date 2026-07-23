import { useRef, useState } from "@kudzujs/core"
import { Parent } from "../Parent"
import { coolWeather } from "../weather"

export default function NativeBubblingPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [weather, setWeather] = useState({ temperature: 28, label: "Warm" })

  function focusInput() {
    inputRef.current?.focus()
    document.body.dataset.ref = inputRef.current?.id ?? ""
  }

  function controls(event: MouseEvent) {
    document.body.dataset.controls = (event.currentTarget as HTMLElement).id
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
  }

  function inner(event: MouseEvent) {
    document.body.dataset.order = (event.currentTarget as HTMLElement).id
    ;(event.currentTarget as HTMLElement).parentElement?.remove()
  }

  return <>
    <Parent>
      <a id="controls" href="#changed" onClick={controls}>Controls</a>
      <button id="inner" onClick={inner}>Bubble</button>
    </Parent>
    <input id="focus-target" ref={inputRef} />
    <button id="focus-ref" onClick={focusInput}>Focus</button>
    <p id="object-state">{weather.temperature}° {weather.label}</p>
    <table><tbody><tr><td id="object-cell">{weather.label.toUpperCase()}</td></tr></tbody></table>
    <select><option id="object-option">{weather.label}</option></select>
    <svg><text id="object-svg">{weather.temperature}</text></svg>
    {weather.temperature > 0 && <aside id="object-condition">{weather.label.toLowerCase()}</aside>}
    <button id="hide-object" onClick={() => setWeather({ temperature: 0, label: "Idle" })}>Hide weather</button>
    <button id="update-object" onClick={() => setWeather(coolWeather())}>Update weather</button>
  </>
}
