export default function ProductCatalog({ products }) {
  return (
    <section id="products-section">
      <div className="section-head">
        <span className="tag">01</span>
        <h2>Product Catalog</h2>
        <span className="count">{products.length} items</span>
      </div>

      {products.length === 0 ? (
        <p className="empty-state">No products in the catalog yet.</p>
      ) : (
        <div className="product-grid">
          {products.map((p) => (
            <div className="product-card" key={p.sku}>
              <div className="cat">{p.category.replace("_", " ")}</div>
              <div className="name">{p.name}</div>
              <div className="meta">
                <span>{p.sku}</span>
                <span>${p.unit_price.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
