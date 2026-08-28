# Magic Modal GSAP Lifecycle Reduction

- Upstream: `GSTJ/magic-modal`
- Revision: `ab3df864de5b01d604d26345165ea5f7900eae14`
- Source: `apps/docs/components/home-effects.tsx`
- Source SHA-256: `8fdfe358aa3aa1c5b45938e31b09caf57ef328c29a43e9621ac1155e584cb7e9`
- Test source SHA-256: `7b0f9c7d7bebe2d5dfd096b799486775fc15b41f64100016da55df45026f5504`
- Application license: MIT
- Package: `gsap@3.15.0`, Standard "No Charge" license
- Package integrity: `sha512-dMW4CWBTUK1AEEDeZc1g4xpPGIrSf9fJF960qbTZmN/QwZIWY5wgliS6JWl9/25fpTGJrMRtSjGtOmPnfjZB+A==`

The upstream landing page uses one layout effect, a root-scoped GSAP context,
GSAP media queries, and exact `media.revert()` / `context.revert()` cleanup. This
reduction preserves the root-scoped context and deterministic visible HTML while
using native `matchMedia()` to choose either a bounded entrance tween or a static
reduced-motion presentation. Kudzu owns the section structure and its conditional
and route lifetime; GSAP owns only opacity and transform while that owner exists.
