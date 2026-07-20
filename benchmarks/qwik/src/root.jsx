import { component$, useSignal } from "@builder.io/qwik"

export default component$(() => {
  const count = useSignal(7)
  return <main><h1>Counter</h1><button onClick$={() => count.value--}>-</button><strong>Count: {count.value}</strong><button onClick$={() => count.value++}>+</button></main>
})
