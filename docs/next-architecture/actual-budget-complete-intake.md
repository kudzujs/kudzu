# Actual Budget Complete Workspace Intake

## Decision (2026-10-29)

The missing-workspace stop condition in `0.19.5` is resolved at the **same**
upstream commit, `87e33e49eb4d666c33e0c0f172faf340d1b7aa0a`. A complete checkout
installs, builds its browser application, and passes two original onboarding
journeys. This authorizes a bounded migration investigation, not a compatibility
claim, compiler change or new release.

## Acquisition and reproducibility

- Source: <https://github.com/actualbudget/actual/tree/87e33e49eb4d666c33e0c0f172faf340d1b7aa0a>.
- Complete codeload archive SHA256:
  `0f1287f65f391c23eb5a4759aaa0a023dfeb5223e5df1e8ddbf617ea89fb0cd7`.
- Root license: MIT. Workspace manifest licenses are retained individually;
  `@actual-app/core`, for example, declares ISC. Preserve notices when reducing
  source; the root license is not a substitute for dependency licenses.
- Node 24.14.0, checked-in Yarn 4.17.1, Playwright 1.61.1, bundled Chromium
  149.0.7827.55. Upstream tracked files remain unchanged after installation/build.

From the complete upstream repository root:

```sh
node .yarn/releases/yarn-4.17.1.cjs install --immutable
node .yarn/releases/yarn-4.17.1.cjs build:browser --skip-translations
PLAYWRIGHT_BROWSERS_PATH=/tmp/opencode/actual-intake/browsers node .yarn/releases/yarn-4.17.1.cjs workspace @actual-app/web playwright install chromium
PLAYWRIGHT_BROWSERS_PATH=/tmp/opencode/actual-intake/browsers E2E_USE_BUILD=1 E2E_PORT=3137 node .yarn/releases/yarn-4.17.1.cjs workspace @actual-app/web playwright test e2e/onboarding.test.ts --grep 'creates a new empty budget file|creates a new budget file by importing Actual budget' --workers=1 --retries=0 --reporter=json
```

Use a Git checkout: the first archive-only build failed because Lage needs
`git ls-tree HEAD`. Initializing Git and fetching/resetting the index to the exact
upstream commit restored that metadata without changing source. The initial
browser run also failed before either journey because Playwright's browser was
not installed. Both failures are retained separately from the final 2/2 result.
The build uses upstream's explicit `--skip-translations` option to avoid fetching
an unpinned translation repository. Other locales are not verified.

## Executable baseline and denominator

- Fourteen package workspaces are present; every declared `workspace:` dependency
  resolves to one of them. This manifest graph is not a complete TS import graph.
- Browser production build emits 166 files, individually sized and hashed.
- Original empty-budget test reaches **All Accounts**, balance **0.00**.
- Original Actual-import test loads the checked-in budget archive, displays the
  budget table, and verifies **Ally Savings: 1,772.80** and **Roth IRA: 2,745.81**.
- Tests run serially without retries against the upstream production server.
  Upstream disables animations in functional tests; visual screenshots are not
  asserted. No Kudzu browser/performance comparison has run.

The inventory hashes **1,958 tracked JS/TS-family files / 295,885 lines** under
`packages/`, including declarations, tests, mocks, configurations, scripts and
checked-in generated source. Root tooling, non-code assets, build output and
installed dependencies are outside this explicit code denominator. In particular,
web is 886 files / 171,888 lines, components 449 / 14,080, and core 331 / 69,669.
The full archive preserves the excluded root tooling/assets too. An earlier
`src/`-only census (1,786 / 277,066) is retained and is not substituted for this
broader denominator. Neither number is a migration numerator; **no migrated
source-retention percentage is established**. The old sparse 22/906 report probe
must not be compared with this workspace as if it migrated the application.

## Next bounded packet: local budget creation boundary

1. Pin and preserve `src/components/manager/WelcomeScreen.tsx`,
   `src/budgetfiles/budgetfilesSlice.ts`, browser preload/connection setup and their
   reachable dependencies. Keep the original empty-budget acceptance unchanged.
2. Follow `WelcomeScreen.tsx:122` (`dispatch(createBudget({}))`) through
   `budgetfilesSlice.ts:145-172`: loading status, native worker message
   `create-budget`, modal closure, file and preference refresh, then loading clear.
   Inspect the actual database/worker lifecycle before choosing a reduction.
3. Build a reduced executable fixture and record the first source-located Kudzu
   failure **before** compiler edits. Prefer native controls, ordinary components,
   state and owned effects, and existing Worker/package boundaries. Prove real
   local persistence rather than replacing the database with a success stub.
4. Require create/open, failure feedback, reload persistence and owner cleanup,
   plus an independent static sibling. Only the two upstream entry journeys above
   are currently verified; persistence/cleanup are new acceptance work.
5. Stop if this needs general Redux/TanStack/React providers, arbitrary package
   components, a router, or a generic worker/database runtime. Record independent
   blockers and retain the source denominator rather than treating them as one
   compiler feature. A new primitive still needs unrelated-fixture review.

Current bootstrap (`src/index.tsx`) contains React DOM, Redux, TanStack Query,
auth/server providers and a window API; the welcome component additionally uses
workspace UI components, Emotion, responsive hooks and runtime translations.
Their presence is an inventory finding, not proof that Kudzu supports them or
that each requires a new semantic primitive.

## Accounting and evidence

Semantic primitives, core passes/LOC, runtime concepts and Kudzu browser bytes:
all **zero change**. No migration fixture or timing result is added. Package
versions stay core 0.17.7 / generator 0.1.168. The intake archive retains original
source, inventory script/results, installation/build logs, both failed setup
attempts, final Playwright JSON and exact browser/workspace receipts. Delivery
hash and repository check results are recorded in `PERFORMANCE.md`.
