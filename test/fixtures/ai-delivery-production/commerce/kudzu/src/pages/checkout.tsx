import { useEffect, useState } from "@kudzujs/core"
import { CART_KEY, type CartLine } from "../catalog"
import "../styles.css"

export const metadata = { title: "결제 | OTW Store", lang: "ko" }

export default function CheckoutPage() {
  const [lines, setLines] = useState<CartLine[]>([])
  const [subtotal, setSubtotal] = useState(0)
  const [subtotalLabel, setSubtotalLabel] = useState("0원")

  useEffect(() => {
    const stored: CartLine[] = JSON.parse(localStorage.getItem(CART_KEY) || "[]")
    let total = 0
    for (const line of stored) total = total + line.price * line.quantity
    setLines(stored)
    setSubtotal(total)
    setSubtotalLabel(`${new Intl.NumberFormat("ko-KR").format(total)}원`)
  }, [])

  return <>
    <header className="site-header"><a className="logo" href="/">OTW Store</a><nav aria-label="주요 메뉴"><a href="/shipping">배송 안내</a></nav></header>
    <main className="checkout">
      <h1>주문 요약</h1>
      {lines.length === 0 && <p className="empty">장바구니가 비어 있습니다.</p>}
      <ul className="cart-lines">{lines.map(line => <li key={line.id}>
        <span><strong>{line.title}</strong><small>{line.color} / {line.size} / 수량 {line.quantity}</small></span>
        <span>{line.priceLabel}</span>
      </li>)}</ul>
      <p className="subtotal" data-subtotal={subtotal}><span>소계</span><strong>{subtotalLabel}</strong></p>
      <button className="checkout-button" disabled={lines.length === 0}>결제 계속하기</button>
    </main>
  </>
}
