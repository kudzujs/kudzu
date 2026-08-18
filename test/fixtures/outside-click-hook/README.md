# Outside Click Hook Fixture

Reduced from ClimateCompatibleGrowth/teaching-kit-frontend at commit `090d88a65611a9de5b607e8b83f0187bc606c65c`:

https://github.com/ClimateCompatibleGrowth/teaching-kit-frontend/blob/090d88a65611a9de5b607e8b83f0187bc606c65c/src/hooks/useOutsideClickAlerter.ts

The upstream MIT-licensed dropdown creates a DOM ref in a function component and passes it with a direct setter callback to a relative outside-click hook. The hook owns one document listener with matching cleanup.
