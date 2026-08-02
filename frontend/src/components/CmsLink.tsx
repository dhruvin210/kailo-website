import { Link, type LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";

/**
 * A link whose destination comes from the CMS.
 *
 * Editors type hrefs as free text, so the target is a plain `string` rather than
 * one of the route paths the router's `to` prop is typed against. In-app paths go
 * through `<Link>` to keep client-side navigation and prefetching; anything with a
 * scheme, a protocol-relative prefix, or a bare fragment falls through to `<a>`,
 * since the router cannot resolve those.
 */
type CmsLinkProps = {
  href: string | null | undefined;
  /** Used when the CMS field is empty. */
  fallbackHref?: string;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
};

const isRouterPath = (href: string) => href.startsWith("/");

export function CmsLink({ href, fallbackHref = "/", className, children, ...rest }: CmsLinkProps) {
  const target = href?.trim() || fallbackHref;

  if (!isRouterPath(target)) {
    // mailto:, tel:, https://, //cdn…, #section — all outside the route tree.
    const external = /^(https?:)?\/\//.test(target);

    return (
      <a
        href={target}
        className={className}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <Link to={target as LinkProps["to"]} className={className} {...rest}>
      {children}
    </Link>
  );
}
