# Lupin Room Social Flow

Reduced from `lupin-lab` revision `9d46863111a6eaa79c9140131ba691789475a2aa`.

This fixture preserves room chat, spectator display, player-to-spectator leave,
spectator-to-player join, token storage, dependency-owned WebSocket replacement,
stale message invalidation, and document cleanup.

The current compiler accepts the reduction without a semantic change. It adds
no primitive, pass, runtime concept, normalization rule, or adapter. The
interactive route emits 10 JavaScript files totaling 29,824 raw / 12,252
aggregate gzip bytes; the static sibling emits zero JavaScript.
