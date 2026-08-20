# Medusa Product Actions Derived Fixture

## Provenance

- Repository: <https://github.com/medusajs/nextjs-starter-medusa>
- Revision: `9818886f06e493cb2249733d114d339aa216ef00`
- Revision date: `2026-04-23T15:19:01+03:00`
- Git archive SHA-256: `82cba4b22c1a047db0e18126d12eab225dae8f89fc9920622c643e83c5f1e568`
- License: MIT
- License SHA-256: `770a61c897d73cdeb53ff2a367d537a80eccf57b31f81e4a5fe951fecc40c632`
- Original source: [`src/modules/products/components/product-actions/index.tsx`](https://github.com/medusajs/nextjs-starter-medusa/blob/9818886f06e493cb2249733d114d339aa216ef00/src/modules/products/components/product-actions/index.tsx)
- Original source SHA-256: `b28125e3c39c8e526ebc29d2b17fccaf182a0e45a6008046a115b0905187ed31`

## Reduction

The upstream component derives `selectedVariant`, `isValidVariant`, and
`inStock` from selected product options and static product variants. It uses
the selected result in DOM props, handlers, and an effect dependency that
synchronizes the selected variant ID to the URL.

The reduced fixture removes Next.js routing, packages, styling, async cart
work, refs, and component forwarding. Its two logical option fields become
primitive `color` and `size` states, while the immutable variant table,
deterministic selection, selected price/availability bindings, and selected-ID
effect dependency remain. The effect writes a dataset value instead of a URL
so only the Derived dependency boundary is under test.

Before the Derived slice, Kudzu built this fixture only when the effect was
removed. With the effect present, the first failure was:

```text
src/pages/index.tsx:11:7 useEffect() dependencies must be direct state or runtime parameter identifiers or property reads
```

The implemented slice now registers one calculation `DerivedIR` with explicit
`color` and `size` signals. Price and availability `BindingIR` consumers and
the selected-ID `EffectIR` dependency reference that identity. The effect uses
the existing generated binding evaluator, source-state scheduling, `Object.is`
comparison, and effect ownership; no calculation runtime or collection
evaluator is emitted.
