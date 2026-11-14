import type { authenticate } from "../shopify.server";
import {
  PAGE_SIZE,
  toInventoryRow,
  type InventoryRow,
  type ShopifyVariantNode,
} from "./inventory";

type AdminClient = Awaited<ReturnType<typeof authenticate.admin>>["admin"];

interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

interface InventoryResponse {
  data?: {
    productVariants?: {
      nodes: ShopifyVariantNode[];
      pageInfo: PageInfo;
    };
  };
  errors?: Array<{ message: string }>;
}

export interface InventoryPage {
  rows: InventoryRow[];
  pageInfo: PageInfo;
}

const INVENTORY_QUERY = `#graphql
  query SmartStockInventory(
    $first: Int
    $last: Int
    $after: String
    $before: String
  ) {
    productVariants(
      first: $first
      last: $last
      after: $after
      before: $before
    ) {
      nodes {
        id
        title
        sku
        inventoryQuantity
        inventoryItem {
          tracked
        }
        product {
          id
          title
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

/**
 * Fetch only the requested page. Cursor pagination avoids querying the full catalog.
 * This operation reads inventory and never changes merchant products.
 */
export async function loadInventoryPage(
  admin: AdminClient,
  cursor: string | null,
  direction: "next" | "previous",
): Promise<InventoryPage> {
  const backward = Boolean(cursor) && direction === "previous";
  const response = await admin.graphql(INVENTORY_QUERY, {
    variables: {
      first: backward ? null : PAGE_SIZE,
      last: backward ? PAGE_SIZE : null,
      after: backward ? null : cursor,
      before: backward ? cursor : null,
    },
  });

  if (!response.ok) {
    throw new Error(`Shopify API returned HTTP ${response.status}`);
  }

  const payload = (await response.json()) as InventoryResponse;
  const variants = payload.data?.productVariants;
  if (payload.errors?.length || !variants) {
    throw new Error("Shopify inventory query failed. Confirm read_products and read_inventory scopes.");
  }

  return {
    rows: variants.nodes.map(toInventoryRow),
    pageInfo: variants.pageInfo,
  };
}
