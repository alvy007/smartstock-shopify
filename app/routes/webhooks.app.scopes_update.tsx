import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { payload, session, topic, shop } = await authenticate.webhook(request);
  console.info(`Received ${topic} webhook for ${shop}`);

  // Shopify can retry webhook deliveries; updateMany is safe if the
  // session has already been removed after an app uninstall.
  const current = payload.current;
  if (session && Array.isArray(current)) {
    const scopes = current.filter(
      (scope): scope is string => typeof scope === "string",
    );
    await db.session.updateMany({
      where: { id: session.id },
      data: { scope: scopes.join(",") },
    });
  }

  return new Response(null, { status: 200 });
};
