async function loadProducts() {
  await Promise.resolve()
  return [{ id: 1, name: "Build oak" }, { id: 2, name: "Build pine" }]
}

export default async function BuildQueryPage() {
  const products = await loadProducts()

  return <main>
    <h1>Build-known products</h1>
    <ul>{products.map(product => <li key={product.id}>{product.name}</li>)}</ul>
  </main>
}
