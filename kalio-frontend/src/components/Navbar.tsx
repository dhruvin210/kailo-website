import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, ShoppingBag, X, Heart, Search } from "lucide-react";
import { Logo } from "./Logo";
import { useCart } from "@/lib/cart";
import { getWishlist, WISHLIST_EVENT } from "@/lib/wishlist";


const LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/products", label: "Products" },
  { to: "/gallery", label: "Gallery" },
  { to: "/contact", label: "Contact Us" },
] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { count } = useCart();
  const { location } = useRouterState();
  const navigate = useNavigate();

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    navigate({ to: "/products", search: q ? { q } : {} });
    setSearch("");
    setSearchOpen(false);
  };

  // On the homepage the navbar floats transparently over the hero image and
  // only turns solid white once the user scrolls past the top.
  const overlay = location.pathname === "/" && !scrolled;
  const iconBtn = overlay
    ? "text-white hover:bg-white/15"
    : "text-foreground hover:bg-muted";

  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const updateWishlist = () => setWishlistCount(getWishlist().length);

    updateWishlist();

    // `wishlistUpdated` fires on same-tab changes; `storage` covers other tabs.
    window.addEventListener(WISHLIST_EVENT, updateWishlist);
    window.addEventListener("storage", updateWishlist);

    return () => {
      window.removeEventListener(WISHLIST_EVENT, updateWishlist);
      window.removeEventListener("storage", updateWishlist);
    };
  }, []);

  return (
  <header
    className={`sticky top-0 z-50 w-full transition-all duration-300 ${
      overlay
        ? "border-b border-transparent bg-transparent"
        : scrolled
          ? "border-b border-border bg-white/90 shadow-sm backdrop-blur"
          : "border-b border-transparent bg-white/90 backdrop-blur"
    }`}
  >
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-end px-4 sm:px-6 lg:px-8">
      <Logo light={overlay} />

      <nav className="ml-auto hidden items-center gap-8 md:flex">
        {LINKS.map((l) => {
          const active =
            l.to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(l.to);

          return (
            <Link
              key={l.to}
              to={l.to}
              className={`group relative text-sm transition-colors hover:text-primary ${
                active
                  ? overlay
                    ? "font-semibold text-white"
                    : "font-semibold text-foreground"
                  : overlay
                    ? "font-medium text-white/80"
                    : "font-medium text-muted-foreground"
              }`}
            >
              {l.label}

              <span
                className={`absolute -bottom-1 left-0 h-0.5 w-full origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100 ${
                  active ? "scale-x-100" : ""
                }`}
              />
            </Link>
          );
        })}
      </nav>

      <div className="relative flex items-center gap-2 md:ml-8">

        {/* Search */}
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors ${iconBtn}`}
        >
          <Search className="h-5 w-5" />
        </button>

        {searchOpen && (
          <form
            onSubmit={submitSearch}
            className="absolute right-0 top-1/2 z-50 flex -translate-y-1/2 items-center rounded-full border border-border bg-white px-4 py-2 shadow-xl"
          >
            <button type="submit" aria-label="Search">
              <Search className="mr-2 h-4 w-4 text-gray-500 hover:text-black" />
            </button>

            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-64 bg-transparent text-sm outline-none"
            />

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSearchOpen(false);
              }}
              aria-label="Close search"
            >
              <X className="ml-2 h-4 w-4 text-gray-500 hover:text-black" />
            </button>
          </form>
        )}

        {/* Wishlist */}
        <Link
          to="/wishlist"
          className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors ${iconBtn}`}
        >
          <Heart className="h-5 w-5" />

          {wishlistCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
              {wishlistCount}
            </span>
          )}
        </Link>

        {/* Cart */}
        <Link
          to="/cart"
          className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors ${iconBtn}`}
        >
          <ShoppingBag className="h-5 w-5" />

          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {count}
            </span>
          )}
        </Link>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors md:hidden ${iconBtn}`}
        >
          {open ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>

    {open && (
      <div className="border-t border-border bg-white md:hidden">
        <nav className="mx-auto flex max-w-7xl flex-col px-4 py-4 sm:px-6">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-muted"
            >
              {l.label}
            </Link>
          ))}

          <Link
            to="/login"
            className="mt-2 inline-flex justify-center rounded-full border border-primary px-5 py-2.5 text-sm font-medium text-primary"
          >
            Login
          </Link>
        </nav>
      </div>
    )}
  </header>
);
}