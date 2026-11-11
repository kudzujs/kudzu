# Context Result Aliases

## Evidence and reduction

Actual Budget `87e33e49eb4d666c33e0c0f172faf340d1b7aa0a` selects
`dispatch: splitsExpandedDispatch` from its Context-backed `useSplitsExpanded()`
in `components/accounts/Account.tsx:128,2002`. The fixture README records the
provider boundary: this packet does not support its Set/reducer/useMemo graph.
The existing Notes Context CRUD reduction isolates the consumer alias semantics.
Before the fix, its first aliased state fails with the Context-alias diagnostic.
Native HTML cannot express lexical binding renaming; existing shared state/action
identities and capture-avoiding substitution already provide the needed semantics.

## Implementation and scope

Five existing lines in `source-compiler.mjs` change: allow identifier aliases,
register selected state/setter locals under their consumer names, reserve selected
and previously allocated names for hidden bindings, and key action lookup by the
consumer name. SharedStateIR fields and SharedActionIR names retain Provider
identity. Existing substitution preserves callback-local names.

State, setter and action result aliases are supported; selecting a setter still
requires its state. Actions may select their state implicitly. Defaults, rest,
computed/string keys, duplicate fields, unknown fields, private captures and
private-timer aliases remain rejected. No public API or dependency is added.

## Validation and accounting

- Pre-fix failure: `/tmp/opencode/context-alias-before.log`.
- Existing and aliased CRUD browser journeys pass create/rename/select/delete.
  The new fixture also checks aliased direct setters, repeated hook calls sharing
  state, action-only selection, callback-local capture avoidance, and collisions
  with hidden setter and generated-looking names.
- IR assertions preserve original state/action identities and shared signals.
- Six invalid selections retain source-located diagnostics; static sibling is
  complete HTML with zero JavaScript.
- `npm run check` and `npm test`: 401 tests pass, zero skips before version bump.
- Semantic primitives +0; passes +0; core net LOC +0 (5 changed lines);
  runtime concepts/source/browser runtime bytes +0.
- Existing Context fixture: 6 JS files, 22,582 raw / 8,217 aggregate gzip B.
  Extended alias fixture: 6 JS files, 22,665 raw / 8,243 aggregate gzip B.
  The +83/+26 includes two additional buttons and a repeated state consumer;
  this is fixture accounting, not a matched overhead or speed comparison.
- Cross-framework latency/build benchmarks were not rerun; no speed claim.

This user-requested composition continuation leaves the original SharedWorker
coordination intake as the next application investigation.

## Release validation

Accepted for core 0.17.11 / generator 0.1.172. Version-aligned `npm run check`
builds 262 pages, `npm test` passes all 401 tests without skips, and
`npm run test:package` passes both package smokes. Exact-commit hosted CI gates
tagging and publication.
