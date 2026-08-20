import { variants } from "./catalog"

export function deriveVariant(color: string, size: string) {
  const selected = variants.find(variant => variant.color === color && variant.size === size)
  return {
    id: selected?.id ?? "",
    price: selected?.price ?? "Unavailable",
    available: selected?.available ?? false
  }
}
