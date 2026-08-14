// We import the mock Northstar data.
// This is where all of our orders are stored.
import data from "../data/data.json";

/*
  This function handles customer questions about order status.

  Input:
    orderId - for example: "ORD-20260702-02"

  Output:
    An object containing the order information and a
    customer-friendly message that the chatbot can display.
*/
export function getOrderStatus(orderId) {
  // Make sure the customer actually provided an order ID.
  if (!orderId || typeof orderId !== "string") {
    return {
      success: false,
      message: "Please provide a valid order ID."
    };
  }

  // Remove extra spaces and make the ID uppercase.
  // This means " ord-20260702-02 " will still work.
  const cleanOrderId = orderId.trim().toUpperCase();

  // Search the orders in data.json for the requested order.
  const order = data.orders.find(
    (order) => order.order_id.toUpperCase() === cleanOrderId
  );

  // If we cannot find the order, tell the chatbot what happened.
  if (!order) {
    return {
      success: false,
      message: `I couldn't find an order with ID ${cleanOrderId}. Please check the order ID and try again.`
    };
  }

  /*
    The dataset uses different statuses.

    We translate each status into a message that makes
    sense to a normal customer.
  */
  switch (order.status) {
    case "delivered":
      return {
        success: true,
        orderId: order.order_id,
        status: order.status,
        message: `Your order was delivered on ${order.delivered_date}.`,
        carrier: order.carrier,
        trackingNumber: order.tracking_number
      };

    case "in_transit":
      return {
        success: true,
        orderId: order.order_id,
        status: order.status,
        message: `Your order is currently in transit with ${order.carrier}.`,
        carrier: order.carrier,
        trackingNumber: order.tracking_number
      };

    case "processing":
      return {
        success: true,
        orderId: order.order_id,
        status: order.status,
        message: "Your order is still being processed and has not shipped yet."
      };

    case "shipped":
      return {
        success: true,
        orderId: order.order_id,
        status: order.status,
        message: `Your order shipped on ${order.shipped_date} via ${order.carrier}.`,
        carrier: order.carrier,
        trackingNumber: order.tracking_number
      };

    case "delayed":
      return {
        success: true,
        orderId: order.order_id,
        status: order.status,
        message: `Your order has been delayed while being handled by ${order.carrier}.`,
        carrier: order.carrier,
        trackingNumber: order.tracking_number
      };

    case "cancelled":
      return {
        success: true,
        orderId: order.order_id,
        status: order.status,
        message:
          "This order has been cancelled. Please contact support if you need help with the refund."
      };

    // This protects if a new status is added to the dataset later.
    default:
      return {
        success: true,
        orderId: order.order_id,
        status: order.status,
        message: `Your order status is currently: ${order.status}.`
      };
  }
}