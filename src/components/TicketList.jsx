export default function TicketList({ tickets, customers }) {
  const custMap = Object.fromEntries(customers.map((c) => [c.customer_id, c]));
//
  return (
    <section id="tickets-section">
      <div className="section-head">
        <span className="tag">03</span>
        <h2>Order-Status Tickets</h2>
        <span className="count">{tickets.length} tickets</span>
      </div>

      {tickets.length === 0 ? (
        <p className="empty-state">No tickets logged yet.</p>
      ) : (
        <div id="ticket-list">
          {tickets.map((t) => {
            const cust = custMap[t.customer_id];
            return (
              <div className="ticket" key={t.ticket_id}>
                <div className="tid">
                  {t.ticket_id}
                  <br />
                  {t.order_id}
                  <br />
                  {(t.created_at || "").slice(0, 10)}
                </div>
                <div>
                  <p className="subject">{t.subject}</p>
                  <p className="message">"{t.message}"</p>
                  <div className="footer">
                    <span>{cust ? cust.name : t.customer_id}</span>
                    <span>{t.channel}</span>
                    <span className={`res res-${t.resolution_status}`}>
                      {t.resolution_status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
