import { useEffect, useRef, useState } from "react";
import { resolveQuery } from "../logic/resolver.js";

const WELCOME = {
  role: "bot",
  text: "Hi! Ask me about an order (e.g. ORD-20260701-01), a product, or a customer name. You can also say \"cancel order ORD-...\".",
  status: "resolved",
};

const ORDER_ID_PATTERN = /ORD-\d{8}-\d{2}/i;
const CANCEL_PATTERN = /\bcancel\b/i;

// A message is retried at most once automatically on a thrown error,
// then the user gets an explicit retry button — never a silent failure.
//
// `onCancelOrder` and `onEscalate` are optional so this still works if a
// parent doesn't wire them up: cancel commands just fall through to the
// normal resolver (which will say "order found" without cancelling), and
// no-match replies simply won't spawn tickets.
export default function ChatPanel({ data, onOrderMatch, onCancelOrder, onEscalate }) {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isThinking]);

  async function send(text) {
    const trimmed = text.trim();
    if (!trimmed || isThinking) return;

    const userMsg = { role: "user", text: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setIsThinking(true);

    // Intercept "cancel order ORD-..." before it ever reaches the (pure,
    // read-only) resolver — cancelling is a mutation, so it's handled here
    // via the onCancelOrder callback the parent owns.
    const orderIdMatch = trimmed.match(ORDER_ID_PATTERN);
    if (onCancelOrder && CANCEL_PATTERN.test(trimmed) && orderIdMatch) {
      return runCancel(orderIdMatch[0]);
    }

    await runQuery(trimmed);
  }

  async function runCancel(orderId) {
    try {
      const result = onCancelOrder(orderId);
      setMessages((m) => [
        ...m,
        { role: "bot", text: result.message, status: result.success ? "resolved" : "no_match" },
      ]);
      if (result.order) onOrderMatch(result.order.order_id);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          status: "error",
          text: "Something went wrong cancelling that order. Try again in a moment.",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  }

  async function runQuery(trimmed) {
    try {
      const result = await resolveQuery(trimmed, data);
      if (!result || typeof result.reply !== "string") {
        throw new Error("Malformed response from resolver.");
      }

      let displayText = result.reply;
      let displayStatus = result.status;
      if (result.escalate && onEscalate) {
        const ticket = onEscalate(result.escalate, trimmed);
        if (ticket) {
          displayText += ` (Logged as ${ticket.ticket_id} for follow-up.)`;
          displayStatus = "escalated";
        }
      }

      setMessages((m) => [...m, { role: "bot", ...result, text: displayText, status: displayStatus }]);
      if (result.orderId) onOrderMatch(result.orderId);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          status: "error",
          text:
            "Something went wrong finding that order. You can try rephrasing, or check the Orders table directly.",
          canRetry: true,
          retryText: trimmed,
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  }

  function handleRetry(text) {
    setIsThinking(true);
    runQuery(text);
  }

  function handleSuggestion(orderId) {
    send(orderId);
  }

  return (
    <aside className={`chat-panel ${isOpen ? "" : "chat-panel--collapsed"}`}>
      <button
        className="chat-toggle mono"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-controls="chat-body"
      >
        {isOpen ? "› Hide" : "‹ Resolver"}
      </button>

      {isOpen && (
        <div className="chat-body" id="chat-body">
          <div className="chat-head">
            <div className="chat-head-row">
              <span className="live-dot" aria-hidden="true" />
              <p className="eyebrow">Order-Status Resolver</p>
            </div>
            <h2>Ask the ledger</h2>
          </div>

          <div className="chat-scroll" ref={scrollRef}>
            {messages.map((m, i) => (
              <ChatBubble key={i} msg={m} onRetry={handleRetry} onSuggestion={handleSuggestion} />
            ))}
            {isThinking && (
              <div className="bubble bubble-bot bubble-thinking mono">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            )}
          </div>

          <form
            className="chat-input-row"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Where is ORD-20260702-02?"
              aria-label="Ask about an order"
            />
            <button type="submit" disabled={!input.trim() || isThinking}>
              Send
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}

function ChatBubble({ msg, onRetry, onSuggestion }) {
  if (msg.role === "user") {
    return <div className="bubble bubble-user">{msg.text}</div>;
  }

  const status = msg.status || "resolved";

  return (
    <div className={`bubble bubble-bot bubble-${status}`}>
      <p>{msg.text || msg.reply}</p>

      {status === "ambiguous" && Array.isArray(msg.matches) && (
        <div className="suggestion-row">
          {msg.matches.map((id) => (
            <button key={id} className="suggestion-chip mono" onClick={() => onSuggestion(id)}>
              {id}
            </button>
          ))}
        </div>
      )}

      {msg.canRetry && (
        <button className="retry-btn mono" onClick={() => onRetry(msg.retryText)}>
          ↻ Retry
        </button>
      )}
    </div>
  );
}
