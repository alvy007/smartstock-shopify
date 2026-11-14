import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { redirect, Form, useActionData, useLoaderData } from "react-router";

import { login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";
import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }
  return { showForm: Boolean(login) };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const errors = loginErrorMessage(await login(request));
  return { errors };
};

export default function Welcome() {
  const { showForm } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const errors = actionData?.errors;

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>SmartStock Inventory</h1>
        <p className={styles.text}>
          A clear view of product availability, low-stock items, and inventory
          health across your Shopify catalog.
        </p>
        {showForm && (
          <Form className={styles.form} method="post">
            <label className={styles.label}>
              <span>Your Shopify store domain</span>
              <input
                className={styles.input}
                type="text"
                name="shop"
                placeholder="your-store.myshopify.com"
                autoComplete="off"
                required
              />
              <span>{errors?.shop ?? "Enter the store where the app is installed."}</span>
            </label>
            <button className={styles.button} type="submit">
              Open SmartStock
            </button>
          </Form>
        )}
        <ul className={styles.list}>
          <li><strong>Read-only inventory</strong> from the Shopify GraphQL Admin API.</li>
          <li><strong>Stock awareness</strong> with configurable low-stock thresholds.</li>
          <li><strong>Fast browsing</strong> with cursor pagination and page search.</li>
        </ul>
      </div>
    </div>
  );
}
