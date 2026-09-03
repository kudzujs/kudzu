# Memo status filter

Add one shared status-filter feature to this production-shaped memo workspace.

The existing seeded memo CRUD, sync controls, status/error announcements, styling, and About page are complete. Preserve them.

Implement exactly these behaviors:

- Add `all`, `active`, and `archived` filter state at the existing shared application-state owner.
- Render a named filter group with buttons labeled `All`, `Active`, and `Archived`.
- Expose the selected button with `aria-pressed="true"` and the other buttons with `aria-pressed="false"`.
- Show all memos for `all`, only non-archived memos for `active`, and only archived memos for `archived`.
- Update the visible-results summary to announce `Showing N of M memos` through the existing polite status region.
- Preserve keyed memo DOM identity for records retained when the filter changes.
- New memos are active and immediately obey the selected filter.
- If no records match, render `No memos match this filter.`

Use the framework's ordinary state, components, props, and keyed collections. Do not add dependencies, a router, a state library, a general runtime, or an executable acceptance test. Run `npm run build` before finishing.
