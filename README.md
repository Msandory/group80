
<h1 id="--Northstar-Support-Deflection-MVP">🌟 Northstar Support Deflection MVP - Dashboard + Chatbot</h1>
<p>A modern, responsive dashboard and integrated chatbot designed to reduce manual support tickets for Northstar Retail Co.</p>
<p>Built for the <strong>PLP Northstar Sprint</strong>, this Minimum Viable Product (MVP) automates responses to common customer queries (Order Status and Stock Availability), significantly reducing the workload on human support agents.</p>
<hr />
<h2 id="--Live-Demo"> Live Demo</h2>
<p><strong><a href="#">View the Live Deployment on Vercel</a></strong> <em>https://northstar-supportsystem.vercel.app/</em></p>
<hr />
<h2 id="--Core-Features">✨ Core Features</h2>
<ul>
<li>🤖 <strong>Intelligent Support Chatbot:</strong> Automatically answers questions regarding order statuses and product availability.</li>
<li>🔍 <strong>Smart Lookups:</strong> Resolves ambiguous queries by customer name (e.g., &quot;Amina Otieno&quot;) and provides intuitive suggestion chips.</li>
<li>🎫 <strong>Auto-Escalation Ticketing:</strong> If a product is out of stock or an order is missing, the bot automatically generates and logs an escalation ticket in the dashboard.</li>
<li>🔄 <strong>Smart Deduping:</strong> Prevents spam by updating existing tickets for repeated queries instead of creating duplicates.</li>
<li>🛠️ <strong>Self-Service Actions:</strong> Allows customers to cancel eligible orders directly through chat commands.</li>
<li>💾 <strong>Local Persistence:</strong> Uses <code>localStorage</code> to ensure new orders and tickets survive page refreshes.</li>
</ul>
<hr />
<h2 id="---Tech-Stack">🛠️ Tech Stack</h2>
<ul>
<li><strong>Framework:</strong> React 19 + Vite</li>
<li><strong>Styling:</strong> Custom CSS (Ledger/Chalkboard Theme)</li>
<li><strong>Routing/Logic:</strong> Custom Vanilla JS pattern matching (no external NLP dependencies)</li>
<li><strong>Data Layer:</strong> Static JSON (<code>src/data/data.json</code>) + Browser <code>localStorage</code></li>
</ul>
<hr />
<h2 id="--Getting-Started--Local-Development-">💻 Getting Started (Local Development)</h2>
<p>To run this project locally on your machine:</p>
<ol>
<li><strong>Clone the repository</strong> (if you haven't already).</li>
<li><strong>Install dependencies:</strong>
<pre><code class="language-bash">npm install
</code></pre>
</li>
<li><strong>Start the development server:</strong>
<pre><code class="language-bash">npm run dev
</code></pre>
</li>
<li>Open your browser and navigate to <code>http://localhost:5173</code>.</li>
</ol>
<blockquote>
<p><strong>Note:</strong> Hot-reloading is enabled by default via Vite. Any changes made to the React components or logic files will reflect instantly in the browser.</p>
</blockquote>
<hr />
<h2 id="--Testing-the-Logic">🧪 Testing the Logic</h2>
<p>The core routing logic (<code>resolveQuery</code>) checks for small talk, order IDs, product names, and customer names.<br />
To sanity-check the logic functions and the full resolver pipeline against sample queries, run:</p>
<pre><code class="language-bash">npm run test:logic
</code></pre>
<hr />
<h2 id="--Project-Structure">📂 Project Structure</h2>
<pre><code class="language-text">src/
├── data/
│   └── data.json              # Mock dataset (drop-in replaceable)
├── logic/
│   ├── resolver.js            # Chat router (small talk → lookups)
│   ├── orderStatus.js         # Order status retrieval logic
│   ├── productAvailability.js # Stock availability logic
│   ├── store.js               # CRUD engine (localStorage management)
│   └── tickets.js             # Chat sanitization &amp; ticket generation
├── components/
│   ├── ChatPanel.jsx          # Chatbot interface &amp; command handling
│   ├── CreateOrderForm.jsx    # Manual order creation form
│   ├── OrdersTable.jsx        # Data table with auto-scroll highlighting
│   ├── ProductCatalog.jsx     # Visual product list
│   └── TicketList.jsx         # Escalation tickets view
├── App.jsx                    # Main layout shell
└── App.css                    # Global ledger/chalkboard styling
</code></pre>
## The logic contract

`resolveQuery(message, data)` in `src/logic/resolver.js` is what the chat
panel calls. It's a router: it checks for small talk first, then an order
ID, then a product/SKU or stock-question phrasing, then a customer name —
and calls `getOrderStatus()` or `checkProductAvailability()` accordingly,
translating their result into the shape the UI expects (`reply`, `orderId`,
`status`, `matches`).

To improve matching (typos, more phrasing, better intent detection), edit
`orderStatus.js` / `productAvailability.js` directly, or the routing logic
in `resolver.js` — the UI doesn't need to change either way.

Run `npm run test:logic` to sanity-check the logic functions and the full
resolver pipeline against a handful of sample queries.

## Manual test script — CRUD demo (for the instructor)

Run `npm install && npm run dev`, open the app, and try these in order in
the chat panel on the right. Each row is one CRUD operation.

| # | Type in the chat box | What it demonstrates | Expected result |
|---|---|---|---|
| 1 | `Where is ORD-20260702-02?` | **Read** — order lookup | Bot replies with in-transit status; the matching row highlights in the Orders table |
| 2 | `do you have a metal ruler in stock` | **Read** — product lookup | Bot confirms the product and its price |
| 3 | `Amina Otieno` | **Read** — customer-name lookup | Bot resolves to her one order automatically |
| 4 | `George Mutua` then pick a suggestion chip *(only if that customer has 2+ orders — otherwise skip, most sample customers have exactly one)* | **Read** — ambiguous match | Bot asks which order and shows chip buttons; clicking one resolves it |
| 5 | `do you have a stapler in stock` | **Create** — auto-escalation ticket | Bot replies "couldn't find it... Logged as TCK-XXXX for follow-up." Scroll to **Support Tickets** → a new row appears, type `product availability`, status `escalated` |
| 6 | `do you guys sell staplers` (repeat #5 in different words) | **Create** — dedup check | No *new* ticket appears — same TCK-XXXX gets reused instead of creating a duplicate |
| 7 | `Where is ORD-99999999-99?` | **Create** — auto-escalation for a missing order | Same as #5 but ticket type is `order status` |
| 8 | Fill in the **Create Order** form (pick a customer, pick a product, submit) | **Create** — manual, via form | Success message with a new `ORD-<today>-01` ID; new row appears at the bottom of the Orders table with status `processing` |
| 9 | `cancel order <the ID from step 8>` | **Update** — cancel via chat command | Bot confirms cancellation; that order's row in the Orders table now shows status `cancelled` |
| 10 | `cancel order ORD-20260701-01` | **Update** — guard rail | Bot refuses: this order is already `delivered`, so it explains it can't be cancelled |
| 11 | Refresh the browser page | **Persistence** | The order created in #8 and the tickets from #5/#7 are still there — state is saved to `localStorage`, not just React memory |
| 12 | `asdkjfh nonsense query` | **Sanitization check** | Bot gives the generic "couldn't match that" reply — no ticket is created, since there's no real order/product signal to escalate. Confirms the bot isn't ticket-spamming on gibberish |

Steps 1–4 and 12 are also covered non-interactively by `npm run test:logic`
(see `scripts/testLogic.js`) — the table above is for demonstrating the
same logic live through the actual chat UI, plus the two write operations
(Create, Update) that only exist at the UI/store layer.

<hr />
<h2 id="--Deployment">🌍 Deployment</h2>
<p>This project is fully optimized for zero-config deployments.</p>
<p>The easiest way to host this application is via <strong>Vercel</strong>:</p>
<ol>
<li>Push your code to a GitHub repository.</li>
<li>Import the repository into your Vercel dashboard.</li>
<li>Vercel will automatically detect the Vite framework and build the <code>dist</code> folder.</li>
</ol>
<p>Alternatively, this builds to plain HTML/CSS/JS (<code>npm run build</code>) and can be hosted on any static provider like Netlify or GitHub Pages.</p>

