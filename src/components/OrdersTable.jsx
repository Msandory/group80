import { useEffect, useMemo, useRef, useState } from "react";

const STATUS_LABELS = {
  delivered: "Delivered",
  in_transit: "In transit",
  processing: "Processing",
  delayed: "Delayed",
  shipped: "Shipped",
  cancelled: "Cancelled",
};

export default function OrdersTable({ orders, customers, products, highlightedOrderId }) {
  const rowRefs = useRef({});
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [fulfillment, setFulfillment] = useState("all");

  const custMap = useMemo(() => Object.fromEntries(customers.map((customer) => [customer.customer_id, customer])), [customers]);
  const prodMap = useMemo(() => Object.fromEntries(products.map((product) => [product.sku, product])), [products]);
  const statusOptions = useMemo(() => [...new Set(orders.map((order) => order.status))], [orders]);
  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const customer = custMap[order.customer_id];
      const productsInOrder = order.items.map((item) => item.sku + " " + (prodMap[item.sku]?.name || "")).join(" ");
      const isFulfilled = Boolean(order.shipped_date || order.delivered_date);
      const matchesSearch = !query || [order.order_id, customer?.name, customer?.email, order.tracking_number, productsInOrder]
        .some((value) => value?.toLowerCase().includes(query));
      return matchesSearch
        && (status === "all" || order.status === status)
        && (fulfillment === "all" || (fulfillment === "fulfilled" ? isFulfilled : !isFulfilled));
    });
  }, [custMap, fulfillment, orders, prodMap, search, status]);

  useEffect(() => {
    if (highlightedOrderId && rowRefs.current[highlightedOrderId]) {
      rowRefs.current[highlightedOrderId].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightedOrderId, filteredOrders]);

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setFulfillment("all");
  };
  const hasActiveFilters = Boolean(search) || status !== "all" || fulfillment !== "all";

  return (
    <section id="orders-section">
      <div className="section-head">
        <span className="tag">02</span>
        <h2>Orders</h2>
        <span className="count">{filteredOrders.length} of {orders.length} orders</span>
      </div>
      <div className="orders-toolbar" aria-label="Order filters">
        <label className="order-search">
          <span className="sr-only">Search orders</span><span aria-hidden="true">⌕</span>
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, customer, product or tracking…" />
        </label>
        <label className="order-filter"><span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All statuses</option>
            {statusOptions.map((option) => <option key={option} value={option}>{STATUS_LABELS[option] || option}</option>)}
          </select>
        </label>
        <label className="order-filter"><span>Fulfillment</span>
          <select value={fulfillment} onChange={(event) => setFulfillment(event.target.value)}>
            <option value="all">All orders</option><option value="fulfilled">Shipped or delivered</option><option value="unfulfilled">Not shipped</option>
          </select>
        </label>
        {hasActiveFilters && <button className="clear-order-filters" type="button" onClick={clearFilters}>Clear filters</button>}
      </div>
      <div className="orders-table-wrap">
        <table className="orders-table">
          <thead><tr><th scope="col">Order</th><th scope="col">Customer</th><th scope="col">Items</th><th scope="col">Status</th><th scope="col">Tracking</th><th scope="col" className="amount-cell">Total</th></tr></thead>
          <tbody>
            {filteredOrders.map((order) => {
              const customer = custMap[order.customer_id];
              return (
                <tr key={order.order_id} ref={(element) => { rowRefs.current[order.order_id] = element; }} className={order.order_id === highlightedOrderId ? "order-row--highlight" : ""}>
                  <td data-label="Order"><span className="order-id mono">{order.order_id}</span><span className="order-date">Placed {order.order_date}</span></td>
                  <td data-label="Customer"><span className="customer-name">{customer?.name || order.customer_id}</span><span className="customer-location">{customer?.location || order.customer_id}</span></td>
                  <td data-label="Items"><ul className="order-items-list">{order.items.map((item) => <li key={item.sku}><b>{item.qty}×</b> {prodMap[item.sku]?.name || item.sku}</li>)}</ul></td>
                  <td data-label="Status"><span className={"pill status-" + order.status}>{STATUS_LABELS[order.status] || order.status}</span></td>
                  <td data-label="Tracking"><span className="tracking-carrier">{order.carrier || "Not assigned"}</span><span className="tracking-number mono">{order.tracking_number || "—"}</span></td>
                  <td data-label="Total" className="amount-cell mono">${order.total.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredOrders.length === 0 && <div className="empty-state orders-empty">No orders match these filters. <button type="button" onClick={clearFilters}>Clear filters</button></div>}
      </div>
    </section>
  );
}
