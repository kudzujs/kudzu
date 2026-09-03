export const product = {
  handle: "p-00000",
  title: "울 오버사이즈 재킷",
  description: "울 소재의 오버사이즈 재킷. 매일 입기 좋은 무게감과 마감.",
  options: {
    colors: ["블랙", "아이보리"],
    sizes: ["S", "M"]
  }
} as const

export const variants = [
  { id: "black-s", color: "블랙", size: "S", image: "/black.svg", price: 89000, available: false },
  { id: "black-m", color: "블랙", size: "M", image: "/black.svg", price: 91000, available: true },
  { id: "ivory-s", color: "아이보리", size: "S", image: "/ivory.svg", price: 89000, available: true },
  { id: "ivory-m", color: "아이보리", size: "M", image: "/ivory.svg", price: 91000, available: false }
] as const

export type CartLine = {
  id: string
  title: string
  color: string
  size: string
  quantity: number
  price: number
  priceLabel: string
}

export const CART_KEY = "otw-cart"

export function formatPrice(amount: number) {
  return `${new Intl.NumberFormat("ko-KR").format(amount)}원`
}
