# Pinned 0.17.6 HTML Byte Census

This completes the offline payload packet after the rejected first-fill trial.
No browser timing was rerun and no product source or output changed.

## Inputs and accounting

- Revision: `487a1566d23c6226974f919beb943d088142763b`, v0.17.6.
- C2: unmodified `baseline-dist` from hosted run 40450942360.
- Project application: fresh `git archive` of that revision's compiler and fixture,
  built with Node 24.14.0 and the installed locked dependencies. Exact deploy
  digest matches its released contract:
  `f85429fec060f30dafc90545be6b5720c45bf8e2ec9f4d33c16c043ed2f91d34`
  (42 files, 189,830 raw bytes).
- `test/html-byte-census.mjs` records each HTML SHA256 and whole-file level-9 gzip.
  It accounts for source spans of reserved `data-k-*` attributes and `k-*`
  comments, retaining UTF-8 bytes, encoded values and original whitespace. Tests
  cover quoted/unquoted values, Unicode, repetitions, raw-text elements, comments
  and malformed input. This is a scanner for emitted HTML, not a general browser
  parser or a DOM transformation.

```sh
node --test test/html-byte-census.test.mjs
node test/html-byte-census.mjs C2_DIST PROJECT_DIST census.json
```

Every page conserves raw bytes: metadata spans plus residual source equal the
input. **Residual is not proven pure authored content**: it includes ordinary
content, tag syntax, prototype markup and generated script/link elements. Whole
structural descriptors mix keys, seeds and ownership; their bytes stay together
rather than being claimed again as state seeds. Category gzip sizes are not
reported or added: compression dictionaries cross these boundaries.

## HTML totals

| Page | Raw B | Gzip B | Metadata B | Metadata share |
|---|---:|---:|---:|---:|
| C2 `/` | 687,976 | 69,512 | 481,736 | 70.02% |
| C2 `/static` | 305 | 229 | 0 | 0% |
| Project `/app/projects` | 30,064 | 4,562 | 20,384 | 67.80% |
| Project `/app/projects/alpha` | 22,233 | 3,591 | 14,221 | 63.96% |
| Project `/app/projects/[projectId]` | 5,651 | 1,397 | 2,984 | 52.80% |
| Project `/app/projects/[projectId]/issues/[issueId]` | 5,767 | 1,393 | 3,078 | 53.37% |
| Project `/login` | 1,320 | 573 | 375 | 28.41% |
| Project `/help` | 273 | 213 | 0 | 0% |

Project HTML totals 65,308 raw / 11,729 per-file aggregate gzip bytes, of which
41,042 raw bytes (62.84%) are counted metadata. Both static siblings have no
metadata and retain their released zero-JavaScript output.

| Metadata group | C2 B | All project pages B |
|---|---:|---:|
| Binding descriptors/targets | 152,909 | 8,911 |
| Event commands/native/list descriptors | 139,346 | 16,897 |
| State seeds | 73,083 | 3,112 |
| Effect markers/item captures | 73,842 | 0 |
| List/conditional structural descriptors | 13,421 | 8,804 |
| Other ownership/routing markers | 29,039 | 3,094 |
| Binding range comments | 96 | 224 |

C2 metadata contains 116,319 bytes of attribute/comment syntax and 365,417 bytes
of encoded values. Exact repeated encoded values within the same attribute name
and page account for only **6,051 bytes**; project pages sum to 1,506 bytes.
These are repetition counts, not achievable savings, and do not include cross-page
deduplication. C2's 2,006 `data-k-bind-attrs` values are all distinct (151,801 bytes
including syntax), largely because each row has a different state ID. The
1,001 identical `data-k-effects` values contribute 6,000 repeated value bytes,
but removing them would remove effect membership. A generic descriptor dictionary
would require a new browser lookup/reconstruction path and is not selected.

## Large capture and safe default-omission feasibility

Eleven C2 `data-k-native-click` attributes total 82,452 raw bytes. The row-restore
handler alone has an 80,919-byte encoded value; its `initialRows` tagged array
capture is 80,806 JSON bytes. This contains application restore data as well as
serialization tags, not duplicated dead markup. Producer: `serializeCapture()` in
`framework/core.mjs`; consumers: `createNativeContext()` and `deserialize()` in
`framework/native-runtime.js` and `framework/serialization.js`.

Replacing it with a plain 28,781-byte JSON array is **not equivalent**: the
existing decoder returns an untagged array by reference, whereas tagged decoding
creates independent objects for each context. The archived assert-based proof
demonstrates this aliasing and rejects that shortcut.

A smaller reduction uses an existing decoder default: ordinary objects serialize
`nullPrototype:false`, but `deserialize()` treats an absent flag as false. Offline
omission of those 1,000 false fields reduces this one tagged capture from
80,806 to **58,806 bytes (−22,000)**. Values, independent repeated decodes,
null-prototype objects, and own `__proto__`/`constructor` keys pass assertions.
The archive includes the pinned decoder, input HTML and `capture-proof.mjs` for
reproduction. This is descriptor-only feasibility, **not a built-output or speed
result**. No flags were removed from production or deployed artifacts.

## Relation to readiness and next packet

The preserved 0.17.6 baseline trace partition reports parse 21.689–28.157 ms,
layout 44.094–52.527 ms and style 16.394–24.397 ms. See
[`c2-readiness-attribution-0176.md`](./c2-readiness-attribution-0176.md).
These disjoint per-profile spans establish that several costs matter. HTML byte
shares do not allocate those durations, establish their cause, or predict a speed
gain. Do not sum category medians or compare these older hosted times with local
analysis. Previous failed trials remain rejected.

Next bounded candidate: omit only explicit false `nullPrototype` fields from
build-time `serializeCapture()` records, retaining true flags and the tagged
representation. Reuse the unchanged decoder; do not add compact-array decoding,
a dictionary, sharing/cache, or browser reconstruction. Before adoption prove
native/effect/binding capture isolation, nested live states/setters/refs, own keys,
special numbers/undefined, null prototypes and source diagnostics. Keep existing
keyed/conditional/navigation lifetime and static-sibling checks. Record actual
artifact changes, run full checks/package smoke and one pinned uninstrumented
21-pair comparison against 0.17.6. The startup gate remains >=5% lower initial-DOM
median, negative paired median, >=16/21 faster, no operation >5% higher with
>=16/21 slower pairs. Raw-byte savings cannot replace a failed startup gate.

This census passes full check and 386 tests plus the project journey. Semantic
primitives, compiler passes/LOC, runtime concepts and production browser bytes
change by zero. No release or deployment is required for the offline report.
