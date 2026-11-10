# Custom hook result aliases

Source evidence: Actual Budget commit
`87e33e49eb4d666c33e0c0f172faf340d1b7aa0a`, MIT-licensed desktop client:

- `src/components/schedules/SchedulesTable.tsx:312` selects
  `const { data: payees } = usePayees()`.
- `src/components/mobile/budget/CategoryTransactions.tsx:71` selects
  `search: onSearch` from `useTransactionsSearch(...)`.

This is an independently authored reduction of the **consumer alias syntax**,
not a copy or compatibility claim for Actual's TanStack query hooks, parameterized
search hook, debounce package or backend. An existing supported zero-argument
React state hook supplies shorthand fields. Two calls select those fields under
different names; a callback-local `data` and a component-local `data` verify that
renaming does not capture unrelated bindings.

Before the change, the page fails at its first alias with the existing
"without aliases, defaults, or rest" diagnostic. The connected Chrome regression
checks state isolation, latest-state callbacks, aliased setters, reset and local
shadowing. `/static` has no JavaScript. The output test compares the alias form
with a manually renamed canonical hook and requires identical deploy files.

The follow-up also aliases into names already used by callback locals, nested
parameters, loop/catch bindings and destructuring. It preserves shorthand keys
and assignment defaults, and avoids a deliberately authored `__kLocal_payees`
name. The collision-specific output comparison executes both generated handlers
and compares sizes; esbuild may choose different minified function names. HTML,
runtime and entry modules still require exact equality.
