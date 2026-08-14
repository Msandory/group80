export default function Header({ data }) {
  const { product_catalog, orders, support_tickets, customers } = data;

  return (
    <header>
      <div className="header-inner">
        <p className="eyebrow">Northstar Retail Co. — Support Ops</p>
        <h1>The Order-Status Ledger</h1>
        <p className="sub">
          A working dataset of stationery orders and the "where is my order?"
          tickets they generate — with an order-status resolver docked on the side.
        </p>
        <div className="stat-row">
          <div className="stat">
            <span className="n">{product_catalog.length}</span>
            <span className="l">SKUs</span>
          </div>
          <div className="stat">
            <span className="n">{orders.length}</span>
            <span className="l">Orders</span>
          </div>
          <div className="stat">
            <span className="n">{support_tickets.length}</span>
            <span className="l">Tickets</span>
          </div>
          <div className="stat">
            <span className="n">{customers.length}</span>
            <span className="l">Customers</span>
          </div>
        </div>
      </div>
    </header>
  );
}
