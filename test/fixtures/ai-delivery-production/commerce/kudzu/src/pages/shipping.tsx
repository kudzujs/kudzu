import "../styles.css"

export const metadata = { title: "배송 안내 | OTW Store", lang: "ko" }

export default function ShippingPage() {
  return <>
    <header className="site-header"><a className="logo" href="/">OTW Store</a></header>
    <main className="policy"><p className="eyebrow">고객 지원</p><h1>배송 안내</h1><p>오후 2시 이전 결제 건은 당일 출고됩니다.</p><p>제주 및 도서산간은 3,000원이 추가됩니다.</p></main>
  </>
}
