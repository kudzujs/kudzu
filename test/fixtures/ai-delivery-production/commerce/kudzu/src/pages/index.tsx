import { useState } from "@kudzujs/core"
import { CART_KEY, product, type CartLine } from "../catalog"
import { deriveVariant } from "../derive"
import "../styles.css"

export const metadata = { title: "울 오버사이즈 재킷 | OTW Store", lang: "ko" }

export default function ProductPage() {
  const [color, setColor] = useState("블랙")
  const [size, setSize] = useState("M")
  const [added, setAdded] = useState(false)
  const selected = deriveVariant(color, size)

  return <>
    <header className="site-header">
      <a className="logo" href="/">OTW Store</a>
      <nav aria-label="주요 메뉴"><a href="/shipping">배송 안내</a><a href="/checkout">장바구니</a></nav>
    </header>
    <main className="product">
      <div className="product-gallery"><img src={selected.image} alt={`${product.title} ${color}`} width="800" height="800" /></div>
      <section className="product-detail" aria-labelledby="product-title">
        <p className="eyebrow">아우터 / 신상</p>
        <h1 id="product-title">{product.title}</h1>
        <p className="product-price">{selected.priceLabel}</p>
        <fieldset className="option-group">
          <legend>색상</legend>
          <button type="button" aria-pressed={color === "블랙"} onClick={() => setColor("블랙")}>블랙</button>
          <button type="button" aria-pressed={color === "아이보리"} onClick={() => setColor("아이보리")}>아이보리</button>
        </fieldset>
        <fieldset className="option-group">
          <legend>사이즈</legend>
          <button type="button" aria-pressed={size === "S"} onClick={() => setSize("S")}>S</button>
          <button type="button" aria-pressed={size === "M"} onClick={() => setSize("M")}>M</button>
        </fieldset>
        <p className="availability" aria-live="polite">{selected.available ? "구매 가능" : "품절"}</p>
        <button className="add-to-cart" disabled={!selected.available} onClick={() => {
          const raw = localStorage.getItem(CART_KEY)
          const lines: CartLine[] = raw ? JSON.parse(raw) : []
          lines.push({ id: selected.id, title: product.title, color, size, quantity: 1, price: selected.price, priceLabel: selected.priceLabel })
          localStorage.setItem(CART_KEY, JSON.stringify(lines))
          setAdded(true)
        }}>장바구니에 담기</button>
        {added && <p className="confirmation" role="status">장바구니에 담았습니다.</p>}
        <p className="description">{product.description}</p>
      </section>
    </main>
  </>
}
