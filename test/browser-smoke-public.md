# Local Browser Observations

The same optional Linux Chrome utility is provided in both workspaces. Run your
production build separately, then use ordinary shell tools, for example:

```sh
node .tools/browser-smoke.mjs dist '[{"op":"open","path":"/"},{"op":"snapshot"}]'
```

Each invocation starts a fresh browser and read-only loopback file server. It
does not build, edit files, run a grader, or provide task answers. Do not modify,
delete, replace, or move any `.tools` file, including this document. Their hashes
are checked after your attempt; changes invalidate it. Utility source is public
and readable inside the workspace. Do not inspect outside the workspace.

Supported commands are `open` with a local root-relative `path`, `snapshot`,
`fill` with exact accessibility-tree `role` and string `value`, `click`
with exact `role`, and `expect-text` with your own `text` substring.
Learn roles/names from your rendered page's observations. Fill supports textbox
and searchbox roles on writable text inputs/textarea. Click supports button, link,
checkbox, radio, switch, tab, menuitem, menuitemcheckbox and menuitemradio roles.
An optional `name` is always exact and case-sensitive, including an empty string.
Omit `name` explicitly to select by role alone, for example
`{"op":"fill","role":"searchbox","value":"example"}`. This requires exactly one
non-ignored AX target; disabled candidates still count toward ambiguity. The target
must be visible, enabled and focusable; clicks must hit the selected element.
Role-only selection does not assert its name or certify accessible labeling.
Input and clicks use native browser events. The JSON array
is limited to 20 commands / 16,384 characters and an invocation to 30 seconds.

Each command observes rendered body text (up to 4,000 characters) and named Chrome
accessibility entries (up to 60, names up to 160 characters), with truncation
flags. Static text/inline text-box entries whose entire name already occurs in
the returned body text are omitted from the AX summary and counted in
`duplicateTextEntriesOmitted`. Control, heading and landmark names are retained,
even when repeated in body text; text beyond the body-text bound remains eligible
for the AX summary. Target lookup still uses the full live AX tree. This is a
bounded observation summary, not a complete accessibility-tree export.
If this bounded observation is identical to an earlier one, actions and
text checks emit `observationFrom` pointing to the zero-based command index of the
most recent matching complete observation in this invocation instead of repeating
it. References never chain. This does not assert that the
whole page is unchanged. `open` and explicit `snapshot` always emit full bounded
observations. Actions, text assertions and error checks still run on every command.
Failed actions, missing expected text and observed page/network errors
exit nonzero. Target lookup errors include up to five same-role AX candidates
(only exact matches on ambiguity), their total count, and names capped at 160
characters with `nameTruncated` flags. CSS can change computed names; candidates
are observations, never fuzzy matches or automatic retries.
There is a fixed 150 ms settling wait, not an application-readiness
guarantee. Successful input dispatch alone does not prove the intended result;
inspect the subsequent observation or use your own expected rendered text.

This is optional smoke verification, not acceptance certification, a complete
accessibility audit, keyboard/mobile testing, or proof of static script freedom.
Raw artifacts and rendered content answer different questions. External network,
API fixtures, SPA fallbacks, screenshots and arbitrary evaluation are unsupported.
Use only trusted local builds with no credentials: this is not a security sandbox.

Browser invocations consume normal shell tool/time/token budgets. Inner browser
commands are visible observations/actions, not extra model tool calls or builds.
Do not omit the required production build. You may use the utility after building
and correct authored source if necessary, within the unchanged budgets. Report
what you actually checked and any failures or limits, then stop.
