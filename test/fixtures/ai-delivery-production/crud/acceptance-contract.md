# CRUD/shared-state acceptance contract

## Scope

This contract applies identically to the Kudzu 0.16.23 and React+Vite starters. The only requested implementation is the shared memo status filter described in `prompt.md`.

## Build

- `npm ci` succeeds from the committed lockfile.
- `npm run build` exits successfully without warnings promoted to errors.
- No dependency is added or changed.
- The production artifact contains the memo workspace and About page.
- Kudzu's About page contains complete HTML and no module script or JavaScript artifact dependency.

## Existing behavior to preserve

- The initial records are keyed by stable numeric IDs: Roadmap notes (active), Release checklist (archived), and Customer follow-up (active).
- Create accepts non-empty memo content, adds one active record, clears the textarea, and announces `Memo created.`
- Edit updates the selected keyed record from its own form and announces `Memo updated.`
- Delete removes only the selected keyed record and announces `Memo deleted.`
- Sync controls expose loading, error, and recovered status without removing the current records.
- The simulated error is exposed with `role="alert"`; ordinary operation and result counts use polite status regions.

## Requested filter behavior

- A group named `Filter memos` contains `All`, `Active`, and `Archived` buttons.
- Exactly one filter button has `aria-pressed="true"`; initial selection is `All`.
- `All` renders IDs 101, 102, and 103 in source order.
- `Active` renders IDs 101 and 103 in source order.
- `Archived` renders ID 102.
- The result summary says `Showing 3 of 3 memos`, `Showing 2 of 3 memos`, or `Showing 1 of 3 memos` for those initial selections.
- Switching filters retains the exact DOM element for every memo whose key remains visible.
- Creating a memo while `Archived` is selected increments the total but does not show the active record; selecting `Active` reveals it.
- Deleting or editing a visible record updates the filtered result and total correctly.
- An empty filtered result renders `No memos match this filter.`

## Accessibility and quality

- There is one `h1`, labeled create/edit controls, keyboard-operable native buttons, and no positive `tabindex`.
- Status and alert text remains available to assistive technology and is not communicated by color alone.
- Focus remains on the activated filter button after a filter change.
- No uncaught browser exception occurs during the journey.
- Implementations remain idiomatic for their framework and do not replace declarative components with imperative DOM mutation.
