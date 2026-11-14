export default function GettingStarted() {
  return (
    <s-page heading="Getting started with SmartStock">
      <s-section heading="How it works">
        <s-paragraph>
          SmartStock reads product variants and sellable inventory through the
          authenticated Shopify GraphQL Admin API. It does not edit products,
          stock levels, or store settings.
        </s-paragraph>
        <s-unordered-list>
          <s-list-item>
            Add products to your Shopify development store, or choose the demo
            data option while creating the store.
          </s-list-item>
          <s-list-item>
            Open Inventory dashboard to inspect the latest page of variants.
          </s-list-item>
          <s-list-item>
            Set a low-stock threshold. Quantities at or below the threshold
            (but above zero) are flagged as low stock.
          </s-list-item>
          <s-list-item>
            Search products or SKUs on the loaded page. Use pagination to load
            more products.
          </s-list-item>
        </s-unordered-list>
      </s-section>
      <s-section heading="Understanding the numbers">
        <s-paragraph>
          Stock quantities reflect Shopify's total sellable quantity for each
          variant, across inventory locations. Dashboard counts are calculated
          from the current page of up to 50 variants, not the entire store.
          Items that do not track inventory are shown separately.
        </s-paragraph>
      </s-section>
      <s-section slot="aside" heading="Resources">
        <s-link href="/app">Open inventory dashboard</s-link>
        <s-paragraph>
          <s-link
            href="https://shopify.dev/docs/api/admin-graphql"
            target="_blank"
          >
            Shopify GraphQL Admin API documentation
          </s-link>
        </s-paragraph>
      </s-section>
    </s-page>
  );
}
