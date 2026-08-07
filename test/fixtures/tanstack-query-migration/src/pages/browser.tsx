import { useEffect, useState } from "react"

type Product = { id: number; name: string }

export default function BrowserQueryPage() {
  const [request, setRequest] = useState(0)
  const [status, setStatus] = useState("loading")
  const [error, setError] = useState("")
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    setStatus("loading")
    setError("")

    void fetch(`/api/products?request=${request}`)
      .then(async response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      })
      .then(nextProducts => {
        setProducts(nextProducts)
        setStatus("success")
      })
      .catch(cause => {
        setError(cause instanceof Error ? cause.message : String(cause))
        setStatus("error")
      })

    return () => {
      document.body.dataset.queryCleanup = `${document.body.dataset.queryCleanup ?? ""}|${request}`
    }
  }, [request])

  return <main>
    <h1>Browser-only products</h1>
    <button id="refetch" onClick={() => setRequest(request + 1)}>Refetch</button>
    {status === "loading" && <p role="status">Loading products</p>}
    {status === "error" && <p role="alert">{error}</p>}
    {status === "success" && <ul id="products">{products.map(product => <li key={product.id}>{product.name}</li>)}</ul>}
  </main>
}
