import { useMemo, useState } from "react";

export default function ProductCatalog({ products }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const categories = useMemo(() => {
    return ["all", ...Array.from(new Set((products || []).map((p) => p.category)))];
  }, [products]);

  const filtered = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    return (products || []).filter((p) => {
      const matchesCategory = category === "all" || p.category === category;
      const matchesQuery = !q || [p.sku, p.name, p.category].some((v) => String(v).toLowerCase().includes(q));
      return matchesCategory && matchesQuery;
    });
  }, [category, products, search]);

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
  };

  return (
    <section id="products-section">
      <div className="section-head">
        <span className="tag">01</span>
        <h2>Product Catalog</h2>
        <span className="count">{(products || []).length} items</span>
      </div>

      {(products || []).length === 0 ? (
        <p className="empty-state">No products in the catalog yet.</p>
      ) : (
        <>
          <div className="orders-toolbar" aria-label="Product filters">
            <label className="order-search">
              <span className="sr-only">Search products</span>
              <span aria-hidden="true">⌕</span>
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search SKU, name or category…" />
            </label>

            <label className="order-filter"><span>Category</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((c) => (
                  <option key={c} value={c}>{c === "all" ? "All categories" : c.replace("_", " ")}</option>
                ))}
              </select>
            </label>

            {(search || category !== "all") && (
              <button className="clear-order-filters" type="button" onClick={clearFilters}>Clear filters</button>
            )}
          </div>

          <div className="orders-table-wrap">
            <table className="orders-table products-table">
              <thead>
                <tr>
                  <th scope="col">SKU</th>
                  <th scope="col">Name</th>
                  <th scope="col">Category</th>
                  <th scope="col" className="amount-cell">Price</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.sku}>
                    <td data-label="SKU"><span className="order-id mono">{p.sku}</span></td>
                    <td data-label="Name"><span className="customer-name">{p.name}</span></td>
                    <td data-label="Category">{p.category.replace("_", " ")}</td>
                    <td data-label="Price" className="amount-cell mono">${(p.unit_price || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="empty-state orders-empty">No products match these filters. <button type="button" onClick={clearFilters}>Clear filters</button></div>}
          </div>
        </>
      )}
    </section>
  );
}
