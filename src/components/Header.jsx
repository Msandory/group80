export default function Header({ data }) {
  const { product_catalog, orders, support_tickets, customers } = data;

  const orderDates = orders.map(o => o.order_date).filter(Boolean).sort();
  const coverageStart = orderDates[0];
  const coverageEnd = orderDates[orderDates.length - 1];

  const resolution = support_tickets.reduce((acc, t) => {
    acc[t.resolution_status] = (acc[t.resolution_status] || 0) + 1;
    return acc;
  }, {});

  const tally = [
    { label: 'SKUs', value: product_catalog.length },
    { label: 'Orders', value: orders.length },
    { label: 'Tickets', value: support_tickets.length },
    { label: 'Customers', value: customers.length },
  ];

  return (
    <header className="ledger-header">
      <div className="header-inner">
        <div className="header-info">
          <p className="eyebrow">Northstar Retail Co.</p>
          <h1>Operations Overview</h1>
          <p className="sub">
            Live snapshot of products, orders, and support follow-ups.
          </p>
          {coverageStart && (
            <p className="coverage mono">
              Records span <span>{coverageStart}</span> to <span>{coverageEnd}</span>
            </p>
          )}
        </div>

        <div className="tally-card" aria-label="Dataset tally">
          <div className="tally-head mono">Ledger Tally</div>
          <dl className="tally-rows">
            {tally.map(({ label, value }) => (
              <div className="tally-row" key={label}>
                <dt>{label}</dt>
                <dd className="mono">{String(value).padStart(2, '0')}</dd>
              </div>
            ))}
          </dl>
          <div className="tally-foot mono">
            <span><i className="res-dot ok" />{resolution.resolved || 0} resolved</span>
            <span><i className="res-dot warn" />{resolution.open || 0} open</span>
            <span><i className="res-dot bad" />{resolution.escalated || 0} escalated</span>
          </div>
        </div>
      </div>
    </header>
  );
}