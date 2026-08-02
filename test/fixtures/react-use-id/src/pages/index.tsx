import React from "react"
import { Field } from "../Field"

function MemberField() {
  const id = React.useId()
  return <><label htmlFor={id}>Email</label><input id={id} /></>
}

export default function Page() {
  return <main>
    <Field label="First name" />
    <Field label="Last name" />
    <MemberField />
  </main>
}
