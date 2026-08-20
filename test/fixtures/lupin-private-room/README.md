# Lupin Private Room Entry

Reduced from `lupin-lab` revision `9d46863111a6eaa79c9140131ba691789475a2aa`.

The original imperative prompt loop is represented as ordinary React state and
an accessible password form. The fixture preserves player and spectator entry,
password retries, player token storage, and native document navigation.

The immutable room row folds into static HTML, so this reduction adds no list
runtime. It requires no semantic primitive, compiler pass, runtime concept,
normalization rule, or adapter. The interactive route emits 7 JavaScript files
totaling 12,961 raw / 6,017 aggregate gzip bytes; the static sibling emits zero
JavaScript.
