export default function ProductsPage() {
  const products = [
    { id: 1, name: 'Next.js Radar Pro', price: '$29' },
    { id: 2, name: 'VS Code Extensions Bundle', price: '$49' },
    { id: 3, name: 'Developer Tools Suite', price: '$99' }
  ]

  return (
    <div>
      <h1>Our Products</h1>
      <p>This page is inside a route group (marketing).</p>
      
      <div className="products-grid">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <h3>{product.name}</h3>
            <p>Price: {product.price}</p>
            <button>Buy Now</button>
          </div>
        ))}
      </div>
    </div>
  )
}