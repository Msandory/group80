// Import the mock Northstar product data.
import data from "../data/data.json";

/*
  This function checks whether a product exists
  in Northstar's product catalog.

  The customer can search using:
    - Product name
    - SKU

  Example:
    "RL-003"
    "Metal Ruler"
*/
export function checkProductAvailability(productQuery) {
  // Make sure the customer provided something to search for.
  if (!productQuery || typeof productQuery !== "string") {
    return {
      success: false,
      message: "Please provide a product name or SKU."
    };
  }

  // Remove extra spaces and make the search lowercase.
  const cleanQuery = productQuery.trim().toLowerCase();

  // Search the product catalog.
  const product = data.product_catalog.find((product) => {
    // Check if the search matches the SKU exactly.
    const skuMatches = product.sku.toLowerCase() === cleanQuery;

    // Check if the search is part of the product name.
    // For example, "metal ruler" can find
    // "Metal Ruler 30cm with Cork Backing".
    const nameMatches = product.name.toLowerCase().includes(cleanQuery);

    return skuMatches || nameMatches;
  });

  // If no product was found, tell the chatbot.
  if (!product) {
    return {
      success: true,
      found: false,
      message: `Sorry, I couldn't find "${productQuery}" in our product catalog.`
    };
  }

  // Product was found, so return its useful information.
  return {
    success: true,
    found: true,
    sku: product.sku,
    name: product.name,
    category: product.category,
    price: product.unit_price,
    message: `Yes, we have ${product.name} in our product catalog.`
  };
}