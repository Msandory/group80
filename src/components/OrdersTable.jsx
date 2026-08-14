import { useEffect, useRef } from "react";

export default function OrdersTable({ orders, customers, products, highlightedOrderId }) {
  const cardRefs = useRef({});

  const custMap = Object.fromEntries(customers.map((c) => [c.customer_id, c]));
  const prodMap = Object.fromEntries(products.map((p) => [p.sku, p]));

  useEffect(() => {
    if (highlightedOrderId && cardRefs.current[highlightedOrderId]) {
      cardRefs.current[highlightedOrderId].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [highlightedOrderId]);

  return (
    <section id="orders-section">
      <div className="section-head">
        <span className="tag">02</span>
        <h2>Orders</h2>
        <span className="count">{orders.length} orders</span>
      </div>

      {orders.length === 0 ? (
        <p className="empty-state">No orders yet.</p>
      ) : (
        <div className="order-card-grid">
          {orders.map((o) => {
            const cust = custMap[o.customer_id];
            const isHighlighted = o.order_id === highlightedOrderId;
            return (
              <div
                key={o.order_id}
                ref={(el) => (cardRefs.current[o.order_id] = el)}
                className={`order-card status-edge-${o.status} ${
                  isHighlighted ? "order-card--highlight" : ""
                }`}
              >
                <div className="order-card-top">
                  <span className="order-id mono">{o.order_id}</span>
                  <span className={`pill status-${o.status}`}>
                    {o.status.replace("_", " ")}
                  </span>
                </div>

                <p className="order-card-customer">{cust ? cust.name : o.customer_id}</p>

                <ul className="order-card-items">
                  {o.items.map((i) => (
                    <li key={i.sku}>
                      <span className="mono qty">{i.qty}×</span>{" "}
                      {prodMap[i.sku]?.name || i.sku}
                    </li>
                  ))}
                </ul>

                <div className="order-card-bottom">
                  <span className="mono total">${o.total.toFixed(2)}</span>
                  <span className="mono tracking">
                    {o.tracking_number || "no tracking yet"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
