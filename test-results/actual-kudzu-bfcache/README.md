# Compiled Actual BFCache evidence

Start with `coordination/` from the
[v0.17.17 lifecycle archive](https://github.com/kudzujs/kudzu/releases/download/v0.17.17/kudzu-lifecycle-0.17.17.tar.gz),
SHA256 `95c7645e8ca4477d8613487e7b5e8b6970fa733a8a6366a090f0023594ed7cc4`.
It includes the original compiled coordination fixture, explicitly patched
coordinator, public backend assets and licenses.

In the extracted fixture:

```sh
git apply /path/to/kudzu/docs/next-architecture/patches/actual-kudzu-bfcache.patch
npm install --save-exact @kudzujs/core@0.17.17
npm run build
```

From the Kudzu checkout, using the pinned installed Actual workspace for
Playwright:

```sh
export COORDINATION_ROOT=/path/to/extracted/coordination
export ACTUAL_ROOT=/path/to/installed/actual
export RESULT_DIR=/tmp/opencode/compiled-bfcache-results
node test/actual-kudzu-bfcache.mjs
CACHE=disabled node test/actual-kudzu-bfcache.mjs
```

Native mode removes Playwright's BFCache-disable argument and requires both roles
to return in the same cached document. Disabled mode explicitly checks fresh
documents. Run sequentially. Actual coordinator timing and backend replies remain
unchanged. A cache miss is not recorded as a cache hit.

`baseline-evicted.json` retains both original `SharedWorkerMessage` evictions;
fresh-document recovery passed but cache coverage failed. `accounting.json` pins
all 77 candidate deploy files. All 66 public assets and generated runtime files
are unchanged. The two generated effect/handler files add 421 raw / 105 aggregate
gzip JavaScript bytes for application lifecycle handling.

`native.json` and `disabled.json` pass both role cases. `crash-regression.json`
passes all three existing renderer-crash cases using the patched source.
Repository check and all 404 tests pass; their logs are retained here.
