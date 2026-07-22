import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="bg-[#2EBFC3] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">

        {/* Logo & Social */}
        <div>
          <div className="[&_span]:!text-white">
            <Logo light />
          </div>

          <p className="mt-4 max-w-xs text-sm text-white/90">
            Crafted with finesse, made to move your soul.
          </p>

          <div className="mt-5 flex gap-3">
            {[Instagram, Twitter, Facebook, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#2EBFC3] transition-all duration-300 hover:scale-110 hover:bg-black hover:text-white"
                aria-label="Social link"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
            Quick Links
          </h4>

          <ul className="space-y-3 text-sm">
            {[
              { to: "/about", label: "About Us" },
              { to: "/gallery", label: "Gallery" },
              { to: "/contact", label: "Contact" },
              { to: "/account", label: "My Account" },
            ].map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="transition-colors duration-300 hover:text-black"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Products */}
        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
            Products
          </h4>

          <ul className="space-y-3 text-sm">
            {["Cases", "Straps", "Tuners", "Picks", "Cleaning Kits"].map((c) => (
              <li key={c}>
                <Link
                  to="/products"
                  search={{ category: c } as never}
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
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
            Contact
          </h4>

          <ul className="space-y-3 text-sm text-white/90">
            <li>hello@kailo.com</li>
            <li>+1 (800) KAILO-01</li>
            <li>123 Music Lane, Nashville, TN</li>
            <li>Mon–Fri 9AM–6PM EST</li>
          </ul>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/30 bg-[#239DA4]">
        <div className="mx-auto max-w-7xl px-4 py-5 text-center text-sm text-white">
          © 2025 Kailo. All rights reserved.
        </div>
      </div>
    </footer>
  );
}