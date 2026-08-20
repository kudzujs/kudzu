# Lupin Lobby Room Flow

Reduced from `lupin-lab` revision `9d46863111a6eaa79c9140131ba691789475a2aa`.

This fixture preserves the lobby's WebSocket snapshot, keyed room rows, public
room creation, player entry, token storage, and native document navigation.
Password prompts, spectators, and the callback-driven shared socket helper are
outside this first slice.

Source pressure:

- lobby snapshots: `server.js:4924-4966`
- create, enter, and join protocol: `server.js:6960-6972`, `7018-7069`
- original shared socket helper and lobby rendering: `server.js:10352-10383`, `10631-10663`

The current compiler accepts the reduced source without a semantic change. It
adds no primitive, compiler pass, runtime concept, normalization rule, or
adapter. The interactive route emits 10 JavaScript files totaling 31,711 raw /
12,510 aggregate gzip bytes; the static sibling emits zero JavaScript.
