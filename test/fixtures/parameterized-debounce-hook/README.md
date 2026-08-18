# Parameterized Debounce Hook Fixture

Reduced from ClimateCompatibleGrowth/teaching-kit-frontend at commit `090d88a65611a9de5b607e8b83f0187bc606c65c`:

https://github.com/ClimateCompatibleGrowth/teaching-kit-frontend/blob/090d88a65611a9de5b607e8b83f0187bc606c65c/src/hooks/useDebouce.ts

The upstream MIT-licensed hook accepts one state value and a delay, owns a timeout dependency effect with cleanup, and returns the debounced primitive value. This fixture preserves that shape while using a required literal delay.
