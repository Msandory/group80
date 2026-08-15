/**
 * ─────────────────────────────────────────────────────────────────────────
 * LIVE DEMO STORE — the only place that mutates data.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * getOrderStatus() and checkProductAvailability() (in orderStatus.js /
 * productAvailability.js) import ../data/data.json directly instead of
 * taking data as an argument. Because ES modules are cached by resolved
 * path, every import of "../data/data.json" — from here, from those two
 * files, from resolver.js's caller — points at the exact same object in
 * memory. There's only ever one data.json module instance.
 *
 * So rather than copying data around, this store mutates that shared
 * object's arrays IN PLACE (push, or replace an element by index — never
 * `data.orders = [...]`, which would swap in a new array the other files
 * can't see). That means a cancelled or newly-created order is visible to
 * getOrderStatus() immediately, without changing a line of the teammate's
 * logic files.
 *
 * React still re-renders correctly because App.jsx wraps every mutation in
 * a fresh `{ ...getLiveData() }` for its own state — see refresh() there.
 */
import data from "../data/data.json" with { type: "json" };
import { buildEscalationTicket } from "./tickets.js";

const LS_KEY = "northstar_demo_state_v1";

/** Call once at startup, before anything else reads `data`. */
export function restoreFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (Array.isArray(saved.orders)) {
      data.orders.length = 0;
      data.orders.push(...saved.orders);
    }
    if (Array.isArray(saved.support_tickets)) {
      data.support_tickets.length = 0;
      data.support_tickets.push(...saved.support_tickets);
    }
  } catch {
    // Corrupt or blocked storage — fall back to the seed dataset silently.
  }
}

function persist() {
  try {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ orders: data.orders, support_tickets: data.support_tickets })
    );
  } catch {
    // Storage full/disabled — demo still works, just won't survive a refresh.
  }
}

function nextOrderId() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const todaysCount = data.orders.filter((o) => o.order_id.includes(`-${stamp}-`)).length;
  return `ORD-${stamp}-${String(todaysCount + 1).padStart(2, "0")}`;
}

function nextTicketId() {
  const nums = data.support_tickets
    .map((t) => parseInt(String(t.ticket_id).replace(/\D/g, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 5000) + 1;
  return `TCK-${next}`;
}

export function getLiveData() {
  return data;
}

/** CREATE — new order from the manual form. */
export function addOrder({ customerId, items }) {
  if (!customerId) return { success: false, message: "Pick a customer first." };

  const catalog = new Map(data.product_catalog.map((p) => [p.sku, p]));
  const cleanItems = (items || [])
    .filter((i) => i.sku && Number(i.qty) > 0 && catalog.has(i.sku))
    .map((i) => ({ sku: i.sku, qty: Number(i.qty) }));

  if (!cleanItems.length) {
    return { success: false, message: "Add at least one valid product line." };
  }

  const total = cleanItems.reduce((sum, i) => sum + catalog.get(i.sku).unit_price * i.qty, 0);

  const order = {
    order_id: nextOrderId(),
    customer_id: customerId,
    order_date: new Date().toISOString().slice(0, 10),
    items: cleanItems,
    total: Math.round(total * 100) / 100,
    status: "processing",
    carrier: null,
    tracking_number: null,
    shipped_date: null,
    delivered_date: null,
  };

  data.orders.push(order);
  persist();
  return { success: true, order };
}

/** UPDATE — cancel via the chat command "cancel order ORD-...". */
export function cancelOrder(orderId) {
  const clean = (orderId || "").trim().toUpperCase();
  const idx = data.orders.findIndex((o) => o.order_id.toUpperCase() === clean);

  if (idx === -1) {
    return { success: false, message: `I couldn't find an order with ID ${clean}.` };
  }
  const order = data.orders[idx];
  if (order.status === "cancelled") {
    return { success: false, message: `Order ${order.order_id} is already cancelled.`, order };
  }
  if (order.status === "delivered") {
    return {
      success: false,
      message: `Order ${order.order_id} was already delivered, so it can't be cancelled.`,
      order,
    };
  }

  data.orders[idx] = { ...order, status: "cancelled" };
  persist();
  return { success: true, message: `Order ${order.order_id} has been cancelled.`, order: data.orders[idx] };
}

/**
 * CREATE — auto-escalation ticket for an unresolved chat query.
 * Deduped: a repeat of the same unresolved order/product question returns
 * the existing open ticket instead of spamming a new row on every retry.
 */
export function addEscalationTicket(escalate, rawMessage) {
  const candidate = buildEscalationTicket({ ...escalate, rawMessage });

  const duplicate = data.support_tickets.find(
    (t) =>
      t.source === "chatbot-auto" &&
      t.type === candidate.type &&
      t.resolution_status !== "resolved" &&
      (candidate.order_id
        ? t.order_id === candidate.order_id
        : candidate.query
        ? t.query === candidate.query
        : t.message === candidate.message)
  );
  if (duplicate) return duplicate;

  const ticket = { ticket_id: nextTicketId(), ...candidate };
  data.support_tickets.push(ticket);
  persist();
  return ticket;
}
