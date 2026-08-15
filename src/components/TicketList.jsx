import { useEffect, useMemo, useRef, useState } from "react";

export default function TicketList({ tickets = [], customers = [], highlightedTicketId }) {
  const custMap = useMemo(() => Object.fromEntries(customers.map((c) => [c.customer_id, c])), [customers]);
  const rowRefs = useRef({});
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [channel, setChannel] = useState("all");

  const [type, setType] = useState("all");

  const statusOptions = useMemo(() => ["all", ...Array.from(new Set(tickets.map((t) => t.resolution_status)))], [tickets]);
  const channelOptions = useMemo(() => ["all", ...Array.from(new Set(tickets.map((t) => t.channel).filter(Boolean)))], [tickets]);
  const typeOptions = useMemo(() => ["all", ...Array.from(new Set(tickets.map((t) => t.type).filter(Boolean)))], [tickets]);

  const filtered = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    return tickets.filter((t) => {
      const matchesStatus = status === "all" || t.resolution_status === status;
      const matchesChannel = channel === "all" || t.channel === channel;
      const matchesType = type === "all" || t.type === type;
      const cust = custMap[t.customer_id];
      const hay = [t.ticket_id, t.order_id, t.subject, t.message, t.created_at, cust?.name, cust?.email, t.channel]
        .filter(Boolean).map(String).join(" ").toLowerCase();
      const matchesSearch = !q || hay.includes(q);
      return matchesStatus && matchesChannel && matchesType && matchesSearch;
    });
  }, [channel, custMap, search, status, type, tickets]);

  // A freshly-escalated ticket should always be visible, even if the
  // current filters would otherwise hide it (e.g. Status was set to
  // "resolved" and the new one is "escalated"). Clearing filters here is
  // the "make it appear" behavior — same idea as OrdersTable scrolling to
  // a highlighted row, just with a filter reset first since a hidden row
  // can't be scrolled to at all.
  useEffect(() => {
    if (!highlightedTicketId) return;
    const stillVisible = tickets.some((t) => t.ticket_id === highlightedTicketId) &&
      filtered.some((t) => t.ticket_id === highlightedTicketId);
    if (!stillVisible) {
      setSearch("");
      setStatus("all");
      setChannel("all");
      setType("all");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedTicketId]);

  useEffect(() => {
    if (highlightedTicketId && rowRefs.current[highlightedTicketId]) {
      rowRefs.current[highlightedTicketId].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightedTicketId, filtered]);

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setChannel("all");
    setType("all");
  };

  return (
    <section id="tickets-section">
      <div className="section-head">
        <span className="tag">04</span>
        <h2>Support Tickets</h2>
        <span className="count">{tickets.length} tickets</span>
      </div>

      {tickets.length === 0 ? (
        <p className="empty-state">No tickets logged yet.</p>
      ) : (
        <>
          <div className="orders-toolbar" aria-label="Ticket filters">
            <label className="order-search">
              <span className="sr-only">Search tickets</span>
              <span aria-hidden="true">⌕</span>
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ticket, order, customer or message…" />
            </label>

            <label className="order-filter"><span>Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                {statusOptions.map((s) => <option key={s} value={s}>{s === "all" ? "All statuses" : s}</option>)}
              </select>
            </label>

            <label className="order-filter"><span>Channel</span>
              <select value={channel} onChange={(e) => setChannel(e.target.value)}>
                {channelOptions.map((c) => <option key={c} value={c}>{c === "all" ? "All channels" : c}</option>)}
              </select>
            </label>

            <label className="order-filter"><span>Type</span>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                {typeOptions.map((t) => <option key={t} value={t}>{t === "all" ? "All types" : t.replace("_", " ")}</option>)}
              </select>
            </label>

            {(search || status !== "all" || channel !== "all" || type !== "all") && (
              <button className="clear-order-filters" type="button" onClick={clearFilters}>Clear filters</button>
            )}
          </div>

          <div className="orders-table-wrap">
            <table className="orders-table tickets-table">
              <thead>
                <tr>
                  <th scope="col">Ticket</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Subject</th>
                  <th scope="col">Type</th>
                  <th scope="col">Created</th>
                  <th scope="col">Channel</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const cust = custMap[t.customer_id];
                  return (
                    <tr
                      key={t.ticket_id}
                      ref={(el) => { rowRefs.current[t.ticket_id] = el; }}
                      className={t.ticket_id === highlightedTicketId ? "order-row--highlight" : ""}
                    >
                      <td data-label="Ticket"><span className="order-id mono">{t.ticket_id}</span><div className="order-date">{t.order_id}</div></td>
                      <td data-label="Customer"><div className="customer-name">{cust?.name || (t.source === "chatbot-auto" ? "Guest (chat)" : t.customer_id)}</div><div className="customer-location">{cust?.location || cust?.email}</div></td>
                      <td data-label="Subject"><div className="subject">{t.subject}</div><div className="message">{t.message}</div></td>
                      <td data-label="Type"><span className="ticket-type mono">{(t.type || "—").replace("_", " ")}</span></td>
                      <td data-label="Created">{(t.created_at || "").slice(0, 10)}</td>
                      <td data-label="Channel">{t.channel || "—"}</td>
                      <td data-label="Status"><span className={`res res-${t.resolution_status}`}>{t.resolution_status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="empty-state orders-empty">No tickets match these filters. <button type="button" onClick={clearFilters}>Clear filters</button></div>}
          </div>
        </>
      )}
    </section>
  );
}
