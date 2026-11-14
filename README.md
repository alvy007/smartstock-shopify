# SmartStock Inventory

A **read-only Shopify embedded inventory dashboard** built with React Router, React, TypeScript and Shopify GraphQL Admin API. Designed as a practical full-stack portfolio project.

> **Status:** MVP in development. Requires a Shopify development store to run. Not published to the Shopify App Store.

## What it does

- Displays real Shopify product variants and total sellable quantities.
- Flags low-stock and out-of-stock items using a configurable threshold.
- Searches product titles, variant titles and SKUs on the current page.
- Paginates inventory in batches of 50 using Shopify GraphQL cursors.
- Separates untracked inventory from tracked stock quantities.
- Works on desktop and mobile, including horizontal scrolling for narrow tables.
- Makes **no inventory mutations** and requests only read permissions.

**Scope note:** Dashboard counts and search operate on the *current page only*, not across the whole catalog. Inventory quantities are Shopify's aggregate sellable inventory across locations. Multi-location stock, store-wide analytics and alerts are future enhancements.

## Stack

| Area | Technology |
| --- | --- |
| Embedded UI | React Router 7, React 18, TypeScript, Shopify Polaris web components, CSS Modules |
| Server | Node.js, Shopify app authentication adapter |
| Platform integration | Shopify GraphQL Admin API (2026-07) |
| Shopify auth sessions | Prisma and SQLite (default development template) |
| Code quality | ESLint, TypeScript typechecking, native Node test runner |
| Delivery | GitHub, Shopify CLI |

## Local setup

Prerequisites: **Node.js 22.12+** (Node 24 recommended), Git, npm, a Shopify development organization and store.

1. Clone and install dependencies:

   ```bash
   git clone https://github.com/alvy007/smartstock-shopify.git
   cd smartstock-shopify
   npm ci
   ```

2. Start the Shopify dev workflow:

   ```bash
   npm run dev
   ```

   The CLI signs you into Shopify, links your app and helps create a development store. When naming your store **do not include the reserved word "Shopify"**. For example, use `smartstock-inventory-dev`.

3. Choose your development store and install the embedded app. If you changed `shopify.app.toml` permissions, accept the new permission grant or reinstall as prompted.

4. Add demo products in your dev store, then open **SmartStock Inventory**.

All Shopify API requests run in authenticated server loaders; never commit `.env` files, tokens or private credentials.

## Commands

```bash
npm run dev       # Shopify CLI app development
npm run typecheck # React Router typegen + TypeScript checks
npm run lint      # ESLint
npm test          # Inventory domain unit tests
npm run build     # Build the React Router application
```

If `shopify` is not on your system PATH, `npm run dev` or `npx shopify app dev` uses the project-local CLI.

## Architecture

```text
app/
  lib/
    inventory.ts          # Pure inventory states, transforms, filtering, summaries
    inventory.server.ts   # Authenticated GraphQL pagination
  routes/
    app._index.tsx        # Inventory dashboard loader and React UI
    app.additional.tsx    # Getting started
    app.tsx               # Embedded app shell and authentication
  styles/
    inventory.module.css  # Responsive dashboard styles
tests/
  inventory.test.mjs      # Pure inventory logic regression tests
shopify.app.toml          # App title, read-only scopes and lifecycle webhooks
```

The app uses **cursor-based pagination** to fetch at most 50 product variants per request rather than fetching an entire catalog. Inventory classification runs in O(n) time on the current page; search is O(n) per changed search term. Shopify product queries use GraphQL variables rather than string concatenation.

## Security and limitations

- Requires `read_products` and `read_inventory`; does not request write permissions.
- GraphQL calls run on the server after `authenticate.admin(request)`.
- No private tokens are exposed in client components.
- The default SQLite Prisma session store is for local/single-instance use. Plan production-ready persistent storage and proper hosting before distributing this app.
- Development and automated unit testing are different from successful integration testing against a live Shopify development store. Verify the actual store connection before calling the app production-ready.

## Roadmap

- [x] App scaffold, authentication and GitHub repository
- [x] Read-only GraphQL inventory dashboard
- [x] Low-stock classification and cursor pagination
- [x] Responsive presentation and pure domain tests
- [ ] Verify and record end-to-end integration against a populated development store
- [ ] Inventory breakdown by location and store-wide aggregate reporting
- [ ] Saved merchant-specific stock thresholds
- [ ] Automated alerts, audit logs and safe opt-in write operations
- [ ] Production deployment with managed session storage

Built by **Alvy Rahman Masum**. [Portfolio](https://alvyrahman-ar.vercel.app) · [GitHub](https://github.com/alvy007).
