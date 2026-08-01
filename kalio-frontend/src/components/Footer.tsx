import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { CmsLink } from "./CmsLink";
import { getIcon } from "@/lib/icons";
import { useGlobal, useSiteCategories } from "@/lib/site";

/**
 * Used when the CMS is unreachable, so the footer never collapses into an empty
 * teal band. Mirrors what `global` is seeded with.
 */
const FALLBACK = {
  tagline: "Crafted with finesse, made to move your soul.",
  quickLinks: [
    { href: "/about", label: "About Us" },
    { href: "/gallery", label: "Gallery" },
    { href: "/contact", label: "Contact" },
    { href: "/account", label: "My Account" },
  ],
  categories: [
    "Tenor Size Bags",
    "Concert Size Bags",
    "Denim",
    "Suede Leather",
    "NDM Leather",
    "Ukuleles",
  ],
  socials: ["Instagram", "Twitter", "Facebook", "Youtube"],
  contact: [
    "abhinavsharma@kailostore.in",
    "(+91) 814 902 7675",
    "Pune (MH)",
    "Mon–Sat, 10AM–7PM IST",
  ],
  copyright: "© 2025 Kailo. All rights reserved.",
};

export function Footer() {
  const global = useGlobal();
  const categories = useSiteCategories();

  const quickLinks = global?.footerQuickLinks?.length
    ? global.footerQuickLinks
    : FALLBACK.quickLinks;

  // The Products column is not part of `global` — it is the Category collection,
  // linked into the shop's filter.
  const categoryNames = categories?.length
    ? categories.map((category) => category.name)
    : FALLBACK.categories;

  const socials = global?.socialLinks?.length
    ? global.socialLinks
    : FALLBACK.socials.map((platform) => ({ platform, url: "#" }));

  const contactLines = global
    ? [global.contactEmail, global.contactPhone, global.contactAddress, global.contactHours].filter(
        (line): line is string => !!line,
      )
    : FALLBACK.contact;

  return (
    <footer className="bg-[#2EBFC3] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {/* Logo & Social */}
        <div>
          <Logo light />

          <p className="mt-4 max-w-xs text-sm text-white/90">
            {global?.tagline?.trim() || FALLBACK.tagline}
          </p>

          <div className="mt-5 flex gap-3">
            {socials.map(({ platform, url }) => {
              // `platform` doubles as the lucide icon name.
              const Icon = getIcon(platform);

              return (
                <a
                  key={platform}
                  href={url || "#"}
                  target={url && url !== "#" ? "_blank" : undefined}
                  rel={url && url !== "#" ? "noopener noreferrer" : undefined}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#2EBFC3] transition-all duration-300 hover:scale-110 hover:bg-black hover:text-white"
                  aria-label={platform ?? "Social link"}
                >
                  <Icon className="h-5 w-5" />
                </a>
              );
            })}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
            Quick Links
          </h4>

          <ul className="space-y-3 text-sm">
            {quickLinks.map((l) => (
              <li key={l.href}>
                <CmsLink href={l.href} className="transition-colors duration-300 hover:text-black">
                  {l.label}
                </CmsLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Products */}
        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Products</h4>

          <ul className="space-y-3 text-sm">
            {categoryNames.map((c) => (
              <li key={c}>
                <Link
                  to="/products"
                  search={{ category: c }}
                  className="transition-colors duration-300 hover:text-black"
                >
                  {c}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Contact</h4>

          <ul className="space-y-3 text-sm text-white/90">
            {contactLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/30 bg-[#239DA4]">
        <div className="mx-auto max-w-7xl px-4 py-5 text-center text-sm text-white">
          {global?.copyright?.trim() || FALLBACK.copyright}
        </div>
      </div>
    </footer>
  );
}
