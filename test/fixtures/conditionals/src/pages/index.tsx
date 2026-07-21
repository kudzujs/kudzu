import { useState } from "@kudzujs/core";

function Child({ open }: { open: boolean }) {
  return <>{open && <small>Child open</small>}</>;
}

export default function ConditionalPage() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [hidden, setHidden] = useState(0);

  async function growAsync() {
    await Promise.resolve();
    setCount(count + 1);
  }

  return (
    <main>
      <button data-action="open" onClick={() => setOpen(true)}>Open</button>
      <button data-action="close" onClick={() => setOpen(false)}>Close</button>
      <button data-action="hidden" onClick={() => setHidden(hidden + 1)}>Increment hidden</button>
      {open && (
        <section className={count > 0 ? "grown" : "new"}>
          <span>{count}</span>
          <u>{hidden}</u>
          <input value={count} disabled={!open} />
          <button onClick={() => setCount(count + 1)}>Grow</button>
          <button onClick={growAsync}>Grow async</button>
          {count === 0 ? <i>Zero</i> : <b>Positive</b>}
          {count && <mark>Has count</mark>}
          <select value={count === 0 ? "zero" : "positive"}>
            {count === 0 ? <option value="zero">Zero</option> : <option value="positive">Positive</option>}
          </select>
          <input data-uncontrolled />
        </section>
      )}
      <table>{open ? <tr><td>Open row</td></tr> : <tr><td>Closed row</td></tr>}</table>
      {open ? <strong>Open state</strong> : <em>Closed state</em>}
      {open ? "Visible text" : "Hidden text"}
      <Child open={open} />
      {true && <aside>Static condition</aside>}
    </main>
  );
}
