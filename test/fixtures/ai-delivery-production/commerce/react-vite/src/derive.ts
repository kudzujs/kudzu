import { variants } from "./catalog"

export function deriveVariant(color: string, size: string) {
  const selected = variants.find(variant => variant.color === color && variant.size === size)
  return {
    id: selected?.id ?? "",
    image: selected?.image ?? "/black.svg",
    price: selected?.price ?? 0,
    priceLabel: selected ? `${new Intl.NumberFormat("ko-KR").format(selected.price)}원` : "선택 불가",
    available: selected?.available ?? false
  }
}
