import { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import ProductCatalog from "./components/ProductCatalog.jsx";
import OrdersTable from "./components/OrdersTable.jsx";
import TicketList from "./components/TicketList.jsx";
import ChatPanel from "./components/ChatPanel.jsx";
import "./styles/tokens.css";
import "./App.css";

// Vite lets us import JSON straight from /src. We import it directly so a
// missing/broken data.json fails loudly at build time instead of silently
// at runtime — but we still guard the shape below in case a teammate edits
// the file by hand and breaks it.
import rawData from "./data/data.json";

const REQUIRED_KEYS = ["product_catalog", "customers", "orders", "support_tickets"];

export default function App() {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [highlightedOrderId, setHighlightedOrderId] = useState(null);

  useEffect(() => {
    try {
      const missing = REQUIRED_KEYS.filter((k) => !(k in rawData));
      if (missing.length) {
        throw new Error(`data.json is missing required key(s): ${missing.join(", ")}`);
      }
      setData(rawData);
    } catch (err) {
      setLoadError(err.message || "Could not load the dataset.");
    }
  }, []);

  if (loadError) {
    return (
      <div className="fatal-error">
        <p className="eyebrow">Dataset error</p>
        <h1>Couldn't load the ledger</h1>
        <p>{loadError}</p>
        <p className="mono muted">Check src/data/data.json is present and valid JSON.</p>
      </div>
    );
  }

  if (!data) {
    return <div className="loading-screen mono">Loading ledger…</div>;
  }

  return (
    <div className="app-shell">
      <div className="app-main">
        <Header data={data} />
        <main>
          <ProductCatalog products={data.product_catalog} />
          <OrdersTable
            orders={data.orders}
            customers={data.customers}
            products={data.product_catalog}
            highlightedOrderId={highlightedOrderId}
          />
          <TicketList tickets={data.support_tickets} customers={data.customers} />
        </main>
        <footer>Mock dataset · for prototyping only · data.json</footer>
      </div>

      <ChatPanel data={data} onOrderMatch={setHighlightedOrderId} />
    </div>
  );
}
