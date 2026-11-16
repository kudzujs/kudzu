# Compiled Actual renderer-crash evidence

The source/public assets come from the existing
[v0.17.14 coordination archive](https://github.com/kudzujs/kudzu/releases/download/v0.17.14/actual-kudzu-coordination.tar.gz).
Verify SHA256
`22e00d4c82586796903c3c308865330920809cfd7a4bae1b07dc1f01aa7ea2ba`
before extraction. The coordinator includes the explicit association and
uncertainty patches; it is not untouched upstream.

In the extracted fixture, run:

```sh
npm install --save-exact @kudzujs/core@0.17.16
npm run build
```

From the Kudzu checkout:

```sh
export COORDINATION_ROOT=/absolute/path/to/actual-kudzu-coordination
export ACTUAL_ROOT=/absolute/path/to/installed/actual
export CHROME_BIN=/usr/bin/google-chrome
export RESULT_DIR=/tmp/opencode/actual-kudzu-crash-results
node test/actual-kudzu-crash.mjs
LOSS=close node test/actual-kudzu-crash.mjs
```

`ACTUAL_ROOT` supplies pinned upstream's installed `@playwright/test`; the browser
serves only the compiled fixture. Run cases sequentially. Native SharedWorker,
dedicated Workers, SQLite and the original heartbeat timing remain active.

- `archived-core-crash.json`: original 0.17.14 deploy output, three crash cases.
- `initial-about-blank-lifecycle-failure.json`: retained initial harness failure.
- `accounting.json`: current registry build matches all 77 original deploy files.
- `crash.json` / `close.json`: current exact registry build acceptance.

The probe checks uncertainty, no mutation replay, database readback, surviving
owner cleanup and static exclusion. It establishes renderer-crash behavior only,
not full browser/OS crash durability, performance or whole-application migration.
