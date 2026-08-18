# Mercury Profit Sharing Derived Fixture

## Provenance

- Repository: <https://github.com/cosmicstack-labs/mercury-agent>
- Revision: `829b1713740c5d551155540df712de9243c9e415`
- Revision date: `2026-08-18T15:00:58+05:30`
- Git archive SHA-256: `1773ac45b03005e1b7246138fa3140f0ac282c3cfd45a26680f957ab7dea4dec`
- License: MIT
- License SHA-256: `5c3cde5d5e51736fb2af87b970415924d0e326c8977799634ef7e4157ecf2179`
- Original source: [`ui/src/pages/ProfitSharing.tsx`](https://github.com/cosmicstack-labs/mercury-agent/blob/829b1713740c5d551155540df712de9243c9e415/ui/src/pages/ProfitSharing.tsx)
- Original source SHA-256: `65d9a562c8075427bc49e9406f70c92e44b6ff87b08dfe8c4a9b6d764ea33c86`

## Reduction

The upstream page derives yearly revenue and profit rows plus cumulative
summary fields from revenue, growth, margin, and projection-period inputs. It
renders the summaries and maps the same projection into keyed chart and table
rows.

The reduced fixture removes motion, design-system components, formatting,
presets, and unrelated inputs. It keeps four primitive inputs, deterministic
financial calculations, scalar summary bindings, an adjustable keyed yearly
collection, and a static sibling. The bounded two/three-year return replaces
the upstream loop because the fixture tests Derived consumers rather than
arbitrary loop evaluation.

The selected `totalProfit` effect is a fixture-only observer. Medusa already
authorizes selected calculation effect dependencies; this observer verifies
that Mercury's unrelated scalar and list consumers reuse that same existing
calculation `DerivedIR` identity rather than adding another evaluator or
semantic record.
