/**
 * Ticket helpers — sanitizing raw chat text and shaping escalation tickets.
 * Pure functions only: no state, no data.json import. The actual ticket
 * store (id generation, dedupe, push, persist) lives in logic/store.js.
 */

const MAX_MESSAGE_LENGTH = 240;

// Strips control characters and anything tag-shaped, collapses whitespace,
// and caps length. Note: React already escapes interpolated text (nothing
// in this app uses dangerouslySetInnerHTML), so this isn't an XSS defense —
// it's here so a pasted wall of text or stray characters from the chat box
// doesn't wreck the tickets table.
export function sanitizeText(raw) {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/[\u0000-\u001F\u007F]/g, " ") // control chars
    .replace(/<[^>]*>/g, " ") // tag-looking content
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH);
}

function deriveSubject(type, sanitizedMessage, { orderId, query }) {
  if (type === "order_status") {
    return orderId ? `Order not found: ${orderId}` : "Order status — unresolved";
  }
  if (type === "product_availability") {
    return query ? `Stock question: "${query}"` : "Product availability — unresolved";
  }
  return sanitizedMessage.slice(0, 60) || "Unresolved chat query";
}

/**
 * Builds a ticket object from a chatbot escalation. Does not assign an id
 * or push anywhere — logic/store.js owns that so it can dedupe first.
 *
 * @param {"order_status"|"product_availability"} type
 * @param {string} rawMessage - the customer's original chat text
 * @param {string|null} orderId - set when the escalation came from an
 *   order-lookup miss
 * @param {string|null} query - set when it came from a product-lookup miss
 */
export function buildEscalationTicket({ type, rawMessage, orderId = null, query = null }) {
  const message = sanitizeText(rawMessage);
  // `query` (the extracted product search term, e.g. "stapler") is kept as
  // its own field — not just folded into the message/subject text — so
  // store.js can dedupe on it. Two different phrasings of the same stock
  // question ("do you have a stapler" / "do you guys sell staplers") both
  // extract to the same query and should collapse into one ticket, even
  // though their raw messages don't match.
  const cleanQuery = typeof query === "string" ? sanitizeText(query).toLowerCase() : null;
  return {
    customer_id: null,
    order_id: orderId,
    query: cleanQuery,
    type, // "order_status" | "product_availability"
    channel: "chat",
    created_at: new Date().toISOString(),
    subject: deriveSubject(type, message, { orderId, query }),
    message,
    resolution_status: "escalated",
    agent_response: null,
    source: "chatbot-auto",
  };
}
