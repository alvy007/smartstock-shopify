import type { DetailedHTMLProps, HTMLAttributes } from "react";

/**
 * Shopify App Bridge renders <s-app-nav> as a web component.
 * Its runtime documentation supports this element, but the installed Polaris
 * JSX declaration package does not yet describe it.
 * Augment React JSX instead of disabling TypeScript checks.
 */
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "s-app-nav": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}
