# Context/Zustand Shared Action Equivalence

This fixture is the Session 03A equivalence reduction for Kudzu's existing
Context and Zustand-shaped action paths.

## Provenance

- Context source shape: the React Notes reduction introduced by Kudzu commit
  `77b6fe47d860b40d14470cbea02e2aaacd9b7af6` and narrowed in
  `4d16316099292f713eed6f927cf088114fbaaddd`.
- Zustand behavior: the reduced cart fixture introduced by Kudzu commit
  `0810e7efce47206f0c1bb4c64bdbce298d19f5e7` and lowered to package-neutral
  shared records in `55a53de6e5082f6d9a52748e02d792a5ffc708f7`.
- The checkout does not record an external upstream URL, revision, license, or
  acquisition hash for either older reduction. Session 03A does not invent one.

## Retained Behavior

- one object state field with parameterized add and remove actions;
- two same-turn additions observing current logical state;
- batched DOM and dependency-effect updates;
- layout state and DOM identity across enhanced navigation;
- route consumers reading the current layout-owned value;
- a static sibling with zero JavaScript.

The fixture changes no compiler semantics. Its focused test snapshots the
current Context/Zustand ModuleIR difference and keeps one package-neutral
equivalence assertion red for Session 03B.
