import { useState } from "@kudzujs/core"

export function Controls({ dispatch }: { dispatch: (action: unknown) => void }) {
  return <button onClick={() => dispatch(useState)}>Invalid</button>
}
