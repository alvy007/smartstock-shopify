import { useMemo, useState } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Form, Link, useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticate } from "../shopify.server";
import { loadInventoryPage } from "../lib/inventory.server";
import {
  filterInventory,
  getInventoryStatus,
  parseThreshold,
  summarizeInventory,
  type InventoryStatus,
} from "../lib/inventory";
import styles from "../styles/inventory.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);

  const rawCursor = url.searchParams.get("cursor");
  const cursor = rawCursor && rawCursor.length <= 2048 ? rawCursor : null;
  const direction =
    url.searchParams.get("direction") === "previous" ? "previous" : "next";
  const threshold = parseThreshold(url.searchParams.get("threshold"));

  const page = await loadInventoryPage(admin, cursor, direction);
  return { ...page, threshold };
};

const statusLabels: Record<InventoryStatus, string> = {
  healthy: "In stock",
  low: "Low stock",
  out: "Out of stock",
  untracked: "Not tracked",
};

const statusClasses: Record<InventoryStatus, string> = {
  healthy: styles.healthy,
  low: styles.low,
  out: styles.out,
  untracked: styles.untracked,
};

function makePageLink(
  cursor: string | null,
  direction: "next" | "previous",
  threshold: number,
): string {
  const params = new URLSearchParams({ threshold: String(threshold) });
  if (cursor) {
    params.set("cursor", cursor);
    params.set("direction", direction);
  }
  return `/app?${params.toString()}`;
}

export default function InventoryDashboard() {
  const { rows, pageInfo, threshold } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const [search, setSearch] = useState("");

  const summary = useMemo(
    () => summarizeInventory(rows, threshold),
    [rows, threshold],
  );
  const filtered = useMemo(() => filterInventory(rows, search), [rows, search]);
  const navigating = navigation.state !== "idle";

  return (
    <s-page heading="SmartStock Inventory">
      <s-button slot="primary-action" href="/app">
        Refresh inventory
      </s-button>

      <s-section heading="Stock overview">
        <p className={styles.intro}>
          Monitor Shopify product variants and spot items that need attention.
          Quantities are Shopify's total sellable inventory across locations.
        </p>
        <div className={styles.metrics} aria-live="polite">
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Variants on this page</span>
            <strong className={styles.metricNumber}>{summary.loaded}</strong>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>In stock</span>
            <strong className={styles.metricNumber}>{summary.healthy}</strong>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Low stock</span>
            <strong className={styles.metricNumber}>{summary.low}</strong>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Out of stock</span>
            <strong className={styles.metricNumber}>{summary.out}</strong>
          </div>
        </div>
        <p className={styles.hint}>
          These counts describe the currently loaded page, not the entire
          catalog. Untracked or unavailable inventory: {summary.untracked}.
        </p>
      </s-section>

      <s-section heading="Inventory details">
        <div className={styles.toolbar}>
          <label className={styles.field}>
            <span>Search on this page</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Product, variant, or SKU"
              autoComplete="off"
            />
          </label>
          <Form method="get" replace className={styles.thresholdForm}>
            <label className={styles.field}>
              <span>Low-stock threshold</span>
              <input
                type="number"
                name="threshold"
                min="0"
                max="1000"
                step="1"
                defaultValue={threshold}
                key={threshold}
              />
            </label>
            <button type="submit" className={styles.applyButton}>
              Apply
            </button>
          </Form>
        </div>

        <p className={styles.hint}>
          Showing {filtered.length} of {rows.length} variants loaded on this
          page. Search is local to this page; use Next to browse more products.
          {navigating ? " Loading…" : ""}
        </p>

        {rows.length === 0 ? (
          <div className={styles.empty}>
            <h2>No products found</h2>
            <p>
              Add demo products to your Shopify development store, then refresh
              this page.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            No matching variants on this page. Try a different search.
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">SKU</th>
                  <th scope="col" className={styles.number}>Available</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const status = getInventoryStatus(
                    row.quantity,
                    row.tracked,
                    threshold,
                  );
                  return (
                    <tr key={row.id}>
                      <td>
                        <span className={styles.product}>{row.productTitle}</span>
                        {row.variantTitle && (
                          <span className={styles.variant}>{row.variantTitle}</span>
                        )}
                      </td>
                      <td className={styles.sku}>{row.sku || "—"}</td>
                      <td className={styles.number}>
                        {row.tracked && row.quantity !== null
                          ? row.quantity.toLocaleString()
                          : "—"}
                      </td>
                      <td>
                        <span className={`${styles.status} ${statusClasses[status]}`}>
                          {statusLabels[status]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <nav className={styles.pagination} aria-label="Inventory pagination">
          {pageInfo.hasPreviousPage && pageInfo.startCursor ? (
            <Link
              to={makePageLink(pageInfo.startCursor, "previous", threshold)}
              className={styles.pageButton}
              aria-label="Previous inventory page"
            >
              Previous
            </Link>
          ) : (
            <span className={styles.pageDisabled}>Previous</span>
          )}
          <span className={styles.pageHint}>Up to 50 variants per page</span>
          {pageInfo.hasNextPage && pageInfo.endCursor ? (
            <Link
              to={makePageLink(pageInfo.endCursor, "next", threshold)}
              className={styles.pageButton}
              aria-label="Next inventory page"
            >
              Next
            </Link>
          ) : (
            <span className={styles.pageDisabled}>Next</span>
          )}
        </nav>
      </s-section>

      <s-section slot="aside" heading="About this version">
        <s-paragraph>
          SmartStock is in active development. This dashboard reads Shopify
          inventory only and never changes stock quantities.
        </s-paragraph>
        <s-link href="/app/additional">How to use SmartStock</s-link>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (args) => boundary.headers(args);
