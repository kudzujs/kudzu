import { createContext, useContext, useState } from "@kudzujs/core";

const ThemeContext = createContext("default");
type CounterValue = { count: number; setCount: (value: number | ((previous: number) => number)) => void; label: string };
const CounterContext = createContext<CounterValue | null>(null);

function ContextCounter({ label }: { label: string }) {
  const counter = useContext(CounterContext);
  if (!counter) return null;
  return <div data-counter={label} data-value={counter.count}>
    <span>{counter.count}</span>
    <button data-context-double onClick={() => {
      counter.setCount(counter.count + 1);
      counter.setCount(counter.count + 1);
    }}>Double increment</button>
    <button data-context-functional onClick={() => counter.setCount(previous => previous + 1)}>Functional increment</button>
  </div>;
}

function DestructuredCounter() {
  const value = useContext(CounterContext);
  if (!value) return null;
  const { count: current, setCount: update } = value;
  return <button data-context-destructured onClick={() => update(current + 1)}>{current}</button>;
}

function ThemeValue({ label }: { label: string }) {
  const theme = useContext(ThemeContext);
  return <span data-theme={label} className={`theme-${theme}`}>{theme}</span>;
}

function ThemeButton() {
  const theme = useContext(ThemeContext);

  function readTheme() {
    document.body.dataset.theme = String(theme);
  }

  return <button data-context className={`theme-${theme}`} onClick={readTheme}>{theme}</button>;
}

function Child({ open }: { open: boolean }) {
  return <>{open && <small>Child open</small>}</>;
}

function BlockLocal({ open }: { open: boolean }) {
  {
    const view = open ? <strong data-block-local>Block open</strong> : <em data-block-local>Block closed</em>;
    const alias = view;
    return alias;
  }
}

function EarlyReturn({ open }: { open: boolean }) {
  if (open) return <strong data-early>Early open</strong>;
  return <em data-early>Early closed</em>;
}

function AssignedLocal({ open }: { open: boolean }) {
  let view;
  if (open) {
    view = <strong data-assigned>Assigned open</strong>;
  } else {
    view = <em data-assigned>Assigned closed</em>;
  }
  return view;
}

function NestedEarlyReturn({ open, count }: { open: boolean; count: number }) {
  if (!open) return <em data-nested-early>Nested closed</em>;
  if (count === 0) return <strong data-nested-early>Nested zero</strong>;
  return <strong data-nested-early>Nested positive</strong>;
}

export default function ConditionalPage() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [hidden, setHidden] = useState(0);
  const [theme, setTheme] = useState("light");
  const [contextCount, setContextCount] = useState(0);
  const [nestedCount, setNestedCount] = useState(10);

  async function growAsync() {
    await Promise.resolve();
    setCount(count + 1);
  }

  const staticLocal = <aside>Static local</aside>;
  const localState = open ? <strong data-local>Local open</strong> : <em data-local>Local closed</em>;
  const localAlias = localState;
  const nestedLocal = open && localAlias;
  const unusedLocal = open ? <span>Unused open</span> : <span>Unused closed</span>;

  return (
    <main>
      <button data-action="open" onClick={() => setOpen(true)}>Open</button>
      <button data-action="close" onClick={() => setOpen(false)}>Close</button>
      <button data-action="hidden" onClick={() => setHidden(hidden + 1)}>Increment hidden</button>
      <button data-action="theme" onClick={() => setTheme("dark")}>Dark theme</button>
      <ThemeContext.Provider value={theme}>
        <ThemeButton />
        <ThemeContext.Provider value="nested"><ThemeValue label="nested" /></ThemeContext.Provider>
      </ThemeContext.Provider>
      <ThemeValue label="default" />
      <CounterContext.Provider value={{ count: contextCount, setCount: setContextCount, label: "outer" }}>
        <ContextCounter label="outer" />
        <DestructuredCounter />
        <CounterContext.Provider value={{ count: nestedCount, setCount: setNestedCount, label: "nested" }}>
          <ContextCounter label="nested" />
        </CounterContext.Provider>
      </CounterContext.Provider>
      {open && (
        <section className={count > 0 ? "grown" : "new"} data-count={count} aria-live={count > 0 ? "polite" : "off"}>
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
      <BlockLocal open={open} />
      <EarlyReturn open={open} />
      <AssignedLocal open={open} />
      <NestedEarlyReturn open={open} count={count} />
      {true && <aside>Static condition</aside>}
      {staticLocal}
      {nestedLocal}
    </main>
  );
}
