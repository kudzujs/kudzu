import { useState } from "react"

export function usePayees() {
  const [data, setData] = useState("First")
  const rename = () => { setData(data + "!") }
  const reset = () => { setData("First") }
  const shadow = () => { const data = "Local"; setData(data) }
  const collide = () => { const payees = " suffix"; setData(data + payees) }
  const scoped = () => {
    const __kLocal_payees = "reserved"
    const { payees } = { payees: "!" }
    const values = [payees].map(payees => ({ payees, data }))
    setData(values[0].data + values[0].payees + __kLocal_payees)
  }
  const setterCollision = () => {
    const setPayees = (payees: string) => payees.toUpperCase()
    setData(setPayees(data))
  }
  const scopedLoop = () => {
    let suffix = ""
    for (const payees of ["!"]) suffix += payees
    try { throw "?" } catch (payees) { suffix += String(payees) }
    setData(data + suffix)
  }
  const assignment = () => {
    let payees = "unused"
    ;({ payees = "fallback" } = {})
    setData(data + payees)
  }
  return { data, setData, rename, reset, shadow, collide, scoped, setterCollision, scopedLoop, assignment }
}
