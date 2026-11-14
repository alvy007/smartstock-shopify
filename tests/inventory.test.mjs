import test from "node:test";
import assert from "node:assert/strict";

import {
  filterInventory,
  getInventoryStatus,
  parseThreshold,
  summarizeInventory,
  toInventoryRow,
} from "../app/lib/inventory.ts";

test("threshold validation accepts only bounded whole numbers", () => {
  assert.equal(parseThreshold(null), 10);
  assert.equal(parseThreshold("0"), 0);
  assert.equal(parseThreshold("1000"), 1000);
  for (const invalid of ["", "-1", "1001", "12units", "1.5", "01"]) {
    assert.equal(parseThreshold(invalid), 10, invalid);
  }
});

test("stock categories handle boundaries and untracked items", () => {
  assert.equal(getInventoryStatus(11, true, 10), "healthy");
  assert.equal(getInventoryStatus(10, true, 10), "low");
  assert.equal(getInventoryStatus(1, true, 10), "low");
  assert.equal(getInventoryStatus(0, true, 10), "out");
  assert.equal(getInventoryStatus(-2, true, 10), "out");
  assert.equal(getInventoryStatus(25, false, 10), "untracked");
  assert.equal(getInventoryStatus(null, true, 10), "untracked");
});

test("maps Shopify variant data without changing the source", () => {
  const node = {
    id: "gid://shopify/ProductVariant/1",
    title: "Default Title",
    sku: null,
    inventoryQuantity: 7,
    product: { id: "gid://shopify/Product/1", title: "Runner Shoe" },
    inventoryItem: { tracked: true },
  };
  const row = toInventoryRow(node);
  assert.equal(row.productTitle, "Runner Shoe");
  assert.equal(row.variantTitle, "");
  assert.equal(row.sku, "");
  assert.equal(row.quantity, 7);
  assert.equal(node.sku, null);
});

test("summaries and search work on loaded page only", () => {
  const rows = [
    { id: "1", productId: "p1", productTitle: "Blue Tee", variantTitle: "Small", sku: "BLU-S", quantity: 20, tracked: true },
    { id: "2", productId: "p2", productTitle: "Red Tee", variantTitle: "Large", sku: "RED-L", quantity: 4, tracked: true },
    { id: "3", productId: "p3", productTitle: "Hat", variantTitle: "", sku: "HAT", quantity: 0, tracked: true },
    { id: "4", productId: "p4", productTitle: "Gift Card", variantTitle: "", sku: "", quantity: null, tracked: false },
  ];
  assert.deepEqual(summarizeInventory(rows, 5), {
    loaded: 4,
    healthy: 1,
    low: 1,
    out: 1,
    untracked: 1,
  });
  assert.deepEqual(filterInventory(rows, "  red-l ").map((r) => r.id), ["2"]);
  assert.deepEqual(filterInventory(rows, "tee").map((r) => r.id), ["1", "2"]);
  assert.equal(filterInventory(rows, "nope").length, 0);
});
