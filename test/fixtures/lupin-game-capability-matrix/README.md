# Lupin Game Capability Matrix

Reduced from `lupin-lab` revision `9d46863111a6eaa79c9140131ba691789475a2aa`.

This is a framework capability fixture, not a copied game. It composes the
remaining semantics shared by Lupin's games: full WebSocket snapshots,
lightweight drawing deltas, effect-local high-frequency frame data, Canvas/RAF,
pointer and keyboard POST commands, browser-only private state, keyed status
rows, reconnect invalidation, exact cleanup, IME-safe input, paste/drop guards,
pointer capture, document-owned panic shortcuts, title disguise, and clipboard
fallback.

The current compiler accepts this composition without another semantic change.
It adds no primitive, pass, runtime concept, normalization rule, or adapter.
The interactive route emits 10 JavaScript files totaling 34,302 raw / 13,705
aggregate gzip bytes; the static sibling emits zero JavaScript. Compared with
the earlier game matrix, the shell/input fidelity adds 2,780 raw / 1,047 gzip
bytes. It adds no semantic primitive, compiler pass, core compiler LOC,
browser runtime concept, normalization rule, or adapter.

## Game coverage

| Game | Reduction |
|---|---|
| stopwatch | owned local timer, snapshot rows, POST commands |
| race | snapshot interpolation, Canvas/RAF, gauge command |
| touch | private keyed board, temporary local lock, touch command |
| snake | compact snapshots, Canvas interpolation, direction command |
| react | pointer command plus browser precision timing |
| bump | Canvas interpolation, held keyboard/pointer input |
| boom | bump transport with server-owned bomb/item fields |
| liar | private info fetch, phase rows, controlled submissions |
| draw | Canvas pointer input, drawing deltas/replay, private word |
| memory | private board fetch and incremental card responses |
| croc | native SVG rows, local RAF, bite command |
| boss | native SVG scene, local RAF, held input |
| typing | IME composition, paste/drop guards, progress commands |
| omok | compact board snapshot, Canvas hit testing, private preview |
| bb | private info, controlled forms, keyed guess history |
| stack | snapshot-driven Canvas/RAF and drop command |
| apple | Canvas drag selection, private optimistic state |
| tray | physics snapshots, Canvas/RAF, held input |
| plane | private local phase, Canvas/RAF, sequenced input |
| card | private hand fetch, keyed cards, local transition state |
| kdl | private board, physical/virtual keyboard, optimistic row |

Common lobby, room, password, spectator, chat, token, navigation, and timer
semantics are covered by the other `lupin-*` fixtures.
