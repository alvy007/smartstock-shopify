/**
 * Pure inventory presentation logic. No Shopify client, browser globals, or side effects.
 * Kept separate so it can be tested without a live store.
 */
export const PAGE_SIZE = 50;
export const DEFAULT_LOW_STOCK_THRESHOLD = 10;
export const MAX_LOW_STOCK_THRESHOLD = 1000;

export type InventoryStatus = "healthy" | "low" | "out" | "untracked";

export interface ShopifyVariantNode {
  id: string;
  title: string;
  sku: string | null;
  inventoryQuantity: number | null;
  product: { id: string; title: string };
  inventoryItem: { tracked: boolean } | null;
}

export interface InventoryRow {
  id: string;
  productId: string;
  productTitle: string;
  variantTitle: string;
  sku: string;
  quantity: number | null;
  tracked: boolean;
}

export interface InventorySummary {
  loaded: number;
  healthy: number;
  low: number;
  out: number;
  untracked: number;
}

/** Reject malformed thresholds rather than silently accepting parseInt("5foo"). */
export function parseThreshold(value: string | null): number {
  if (value === null || !/^(0|[1-9]\d{0,3})$/.test(value)) {
    return DEFAULT_LOW_STOCK_THRESHOLD;
  }
  const parsed = Number(value);
  return parsed <= MAX_LOW_STOCK_THRESHOLD
    ? parsed
    : DEFAULT_LOW_STOCK_THRESHOLD;
}

export function getInventoryStatus(
  quantity: number | null,
  tracked: boolean,
  threshold: number,
): InventoryStatus {
  if (!tracked || quantity === null || !Number.isFinite(quantity)) {
    return "untracked";
  }
  if (quantity <= 0) return "out";
  if (quantity <= threshold) return "low";
  return "healthy";
}

export function toInventoryRow(node: ShopifyVariantNode): InventoryRow {
  return {
    id: node.id,
    productId: node.product.id,
    productTitle: node.product.title,
    variantTitle: node.title === "Default Title" ? "" : node.title,
    sku: node.sku ?? "",
    quantity: node.inventoryQuantity,
    tracked: node.inventoryItem?.tracked ?? false,
  };
}

/** Runs once over the returned page: O(n) time, O(1) extra space. */
export function summarizeInventory(
  rows: readonly InventoryRow[],
  threshold: number,
): InventorySummary {
  const result: InventorySummary = {
    loaded: rows.length,
    healthy: 0,
    low: 0,
    out: 0,
    untracked: 0,
  };
  for (const row of rows) {
    result[getInventoryStatus(row.quantity, row.tracked, threshold)]++;
  }
  return result;
}

/** Intentionally filters the currently loaded Shopify page, not the entire catalog. */
export function filterInventory(
  rows: readonly InventoryRow[],
  search: string,
): InventoryRow[] {
  const query = search.trim().toLocaleLowerCase();
  if (!query) return [...rows];
  return rows.filter((row) =>
    [row.productTitle, row.variantTitle, row.sku].some((value) =>
      value.toLocaleLowerCase().includes(query),
    ),
  );
}
