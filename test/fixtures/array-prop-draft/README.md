# Array Prop Draft Fixture

Reduced from ClimateCompatibleGrowth/teaching-kit-frontend `Dropdown` at commit `090d88a65611a9de5b607e8b83f0187bc606c65c`:

https://github.com/ClimateCompatibleGrowth/teaching-kit-frontend/blob/090d88a65611a9de5b607e8b83f0187bc606c65c/src/components/Dropdown/Dropdown.tsx

The upstream MIT-licensed component initializes local array state directly from its `selectedItems` prop and reports changes through a direct `setSelectedItems` prop. This fixture keeps those names and that ownership shape while removing unrelated styling, async search, and package components.
