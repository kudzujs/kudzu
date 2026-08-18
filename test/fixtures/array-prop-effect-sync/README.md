# Array Prop Effect Sync Fixture

Reduced from ClimateCompatibleGrowth/teaching-kit-frontend `Dropdown` at commit `090d88a65611a9de5b607e8b83f0187bc606c65c`:

https://github.com/ClimateCompatibleGrowth/teaching-kit-frontend/blob/090d88a65611a9de5b607e8b83f0187bc606c65c/src/components/Dropdown/Dropdown.tsx

The upstream MIT-licensed component initializes local array state from `selectedItems` and synchronizes it through `setSelectedItems` in an effect. This fixture preserves that ownership and dependency shape while removing unrelated styling, async search, and package components.
