import { useMemo, useState } from "react";

let lineSeq = 0;
const emptyLine = () => ({ key: `line-${++lineSeq}`, sku: "", qty: 1 });

export default function CreateOrderForm({ customers = [], products = [], onCreateOrder }) {
  const [customerId, setCustomerId] = useState(customers[0]?.customer_id || "");
  const [lines, setLines] = useState([emptyLine()]);
  const [feedback, setFeedback] = useState(null); // { ok, message }

  const productMap = useMemo(() => new Map(products.map((p) => [p.sku, p])), [products]);

  const validLines = useMemo(
    () => lines.filter((line) => line.sku && Number(line.qty) > 0),
    [lines]
  );

  const total = validLines.reduce((sum, line) => {
    const product = productMap.get(line.sku);
    return sum + (product ? product.unit_price * Number(line.qty || 0) : 0);
  }, 0);

  function updateLine(key, patch) {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  function addLine() {
    setLines((current) => [...current, emptyLine()]);
  }

  function removeLine(key) {
    setLines((current) => (current.length > 1 ? current.filter((line) => line.key !== key) : current));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const items = validLines.map((line) => ({ sku: line.sku, qty: Number(line.qty) }));

    if (!customerId) {
      setFeedback({ ok: false, message: "Choose a customer before creating the order." });
      return;
    }

    if (!items.length) {
      setFeedback({ ok: false, message: "Add at least one product with a quantity greater than zero." });
      return;
    }

    const result = onCreateOrder({ customerId, items });

    if (result.success) {
      setFeedback({ ok: true, message: `Order ${result.order.order_id} created — total $${result.order.total.toFixed(2)}.` });
      setLines([emptyLine()]);
    } else {
      setFeedback({ ok: false, message: result.message });
    }
  }

  return (
    <section id="create-order-section">
      <div className="section-head">
        <span className="tag">04</span>
        <h2>Create Order</h2>
      </div>

      <form className="create-order-form" onSubmit={handleSubmit}>
        <div className="create-order-form-header">
          <label className="order-filter create-customer-field">
            <span>Customer</span>
            <select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
              {customers.map((customer) => (
                <option key={customer.customer_id} value={customer.customer_id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </label>

          <div className="order-summary-badges mono">
            <span>{validLines.length} items</span>
            <span>{lines.length} lines</span>
          </div>
        </div>

        <div className="order-lines">
          {lines.map((line) => {
            const selectedSkus = new Set(
              lines
                .filter((entry) => entry.key !== line.key && entry.sku)
                .map((entry) => entry.sku)
            );

            return (
              <div className="order-line" key={line.key}>
                <select
                  value={line.sku}
                  onChange={(event) => updateLine(line.key, { sku: event.target.value })}
                >
                  <option value="">Select product…</option>
                  {products.map((product) => (
                    <option
                      key={product.sku}
                      value={product.sku}
                      disabled={selectedSkus.has(product.sku)}
                    >
                      {product.name} — ${product.unit_price.toFixed(2)}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  value={line.qty}
                  onChange={(event) => updateLine(line.key, { qty: event.target.value })}
                  aria-label="Quantity"
                />

                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => removeLine(line.key)}
                  disabled={lines.length === 1}
                >
                  Remove
                </button>
              </div>
            );
          })}

          <button type="button" className="ghost-button add-line-button" onClick={addLine}>
            + Add product
          </button>
        </div>

        <div className="create-order-footer">
          <span className="order-total mono">Total: ${total.toFixed(2)}</span>
          <button type="submit" disabled={!customerId || !validLines.length}>
            Create order
          </button>
        </div>

        {feedback && <p className={`form-feedback ${feedback.ok ? "ok" : "error"}`}>{feedback.message}</p>}
      </form>
    </section>
  );
}
