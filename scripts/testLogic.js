import { getOrderStatus } from "../src/logic/orderStatus.js";
import { checkProductAvailability } from "../src/logic/productAvailability.js";


// ===============================
// TEST 1: ORDER THAT EXISTS
// ===============================

console.log("TEST 1: Existing order");

const orderResult = getOrderStatus("ORD-20260702-02");

console.log(orderResult);


// ===============================
// TEST 2: ORDER THAT DOES NOT EXIST
// ===============================

console.log("TEST 2: Non-existing order");

const missingOrderResult = getOrderStatus("ORD-999999");

console.log(missingOrderResult);


// ===============================
// TEST 3: PRODUCT USING SKU
// ===============================

console.log("TEST 3: Product searched by SKU");

const skuResult = checkProductAvailability("RL-003");

console.log(skuResult);


// ===============================
// TEST 4: PRODUCT USING NAME
// ===============================

console.log("TEST 4: Product searched by name");

const productResult = checkProductAvailability("Metal Ruler");

console.log(productResult);


// ===============================
// TEST 5: PRODUCT THAT DOES NOT EXIST
// ===============================

console.log("TEST 5: Non-existing product");

const missingProductResult = checkProductAvailability("Stapler");

console.log(missingProductResult);


// ===============================
// TEST 6: FULL RESOLVER — small talk, order, product, fallback
// ===============================

console.log("TEST 6: resolveQuery() end-to-end");

import { resolveQuery } from "../src/logic/resolver.js";
import data from "../src/data/data.json" with { type: "json" };

const resolverCases = [
  "hi",
  "Where is ORD-20260702-02?",
  "do you have a metal ruler in stock",
  "asdkjfh nonsense query",
];

for (const message of resolverCases) {
  const result = await resolveQuery(message, data);
  console.log(`  > "${message}"`, result);
}