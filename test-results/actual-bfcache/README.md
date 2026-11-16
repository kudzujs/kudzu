# Original Actual BFCache intake

Pinned upstream: `87e33e49eb4d666c33e0c0f172faf340d1b7aa0a`.
Use its unchanged installed workspace and original production browser build.
The probe refuses modified relevant tracked source and substitutes no assets.

```sh
ACTUAL_ROOT=/absolute/path/to/actual \
CHROME_BIN=/usr/bin/google-chrome \
RESULT_DIR=/tmp/opencode/actual-bfcache-results \
node test/actual-bfcache.mjs
```

Ports 3157/3158 must be free; the away origin uses an ephemeral port.
Playwright's BFCache-disable argument is removed. A plain HTML control must
restore the same document with `pageshow.persisted`; application cases use two
real heartbeat rounds away, not synthetic lifecycle events.

- `initial-same-origin-away.json`: invalid first app experiment; Actual's service
  worker intercepted the same-origin away page. Preserved, not counted.
- `eligibility-only.json`: corrected control/follower restore; leader falls back
  to a fresh document with Chrome `IgnoreEventAndEvict`.
- `browser.json`: final probe also checks backend writes and reload persistence.
- `repeat.json`: repeated full probe; leader evicted, follower restored, both
  post-return writes persist. Strict BFCache acceptance exits nonzero.
- `production-js.json`: sizes and SHA256 of the unchanged 33-file JS build.

A nonzero exit preserves any failed BFCache acceptance. A fresh-document reload
must not be relabeled as cache restoration. This proves neither all-browser
eligibility nor arbitrary frozen writes, concurrent edits or whole-app migration.
