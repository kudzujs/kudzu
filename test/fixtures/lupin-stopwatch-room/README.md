# Lupin Stopwatch Room

Reduced from `lupin-lab` revision `9d46863111a6eaa79c9140131ba691789475a2aa`.

The fixture preserves the `/events` room snapshot, keyed scoreboard, local
animation-frame stopwatch, `/running`, `/record`, and `/reset` commands, game
completion, and exact socket/frame cleanup.

The first failure was the ordinary primitive list
`losers.map((name, index) => <li key={index}>{name}</li>)`. Kudzu accepted its
empty build value but rejected a runtime string row. Positional lists now allow
JSON-safe primitives while property-keyed rows still require plain objects.

Accounting: zero semantic primitives, compiler passes, runtime concepts,
normalization rules, and adapters were added. The interactive route emits 10
JavaScript files totaling 33,712 raw / 13,351 aggregate gzip bytes; the static
sibling emits zero JavaScript.
