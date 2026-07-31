import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { formatINR, type Product } from "@/lib/products";
import { SIZES } from "@/lib/strapi";
import { useCart } from "@/lib/cart";
import { getWishlist, toggleWishlist as persistWishlist, WISHLIST_EVENT } from "@/lib/wishlist";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();

  const [isFavourite, setIsFavourite] = useState(false);

  useEffect(() => {
    const sync = () => setIsFavourite(getWishlist().includes(product.id));
    sync();
    window.addEventListener(WISHLIST_EVENT, sync);
    return () => window.removeEventListener(WISHLIST_EVENT, sync);
  }, [product.id]);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    const nowFavourite = persistWishlist(product.id);
    setIsFavourite(nowFavourite);
    toast.success(nowFavourite ? "Added to wishlist" : "Removed from wishlist", {
      closeButton: true,
    });
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-xl"
    >
      <Link
        to="/products/$id"
        params={{ id: product.id }}
        className="relative block aspect-square overflow-hidden bg-muted"
      >
        <img
          src={product.image}
          srcSet={product.imageSrcSet}
          sizes={SIZES.productCard}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {product.badge && (
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
              product.badge === "NEW"
                ? "bg-primary text-primary-foreground"
                : "bg-foreground text-background"
            }`}
          >
            {product.badge}
          </span>
        )}

        <button
          type="button"
          onClick={toggleWishlist}
          className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition hover:scale-110"
          aria-label="Toggle wishlist"
        >
          <Heart
            className={`h-5 w-5 transition ${
              isFavourite ? "fill-red-500 text-red-500" : "text-gray-500"
            }`}
          />
        </button>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-primary text-primary" />
          <span>{product.rating}</span>
          <span>({product.reviews})</span>
        </div>

        <Link
          to="/products/$id"
          params={{ id: product.id }}
          className="font-medium text-foreground transition-colors hover:text-primary"
        >
          {product.name}
        </Link>

        <p className="mt-1 text-xs text-muted-foreground">{product.category}</p>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-semibold text-foreground">{formatINR(product.price)}</span>

          <button
            type="button"
            onClick={() => {
              add(product.id);

              toast.success(`${product.name} added to cart`, {
                closeButton: true,
              });
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-[var(--primary-dark)]"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
      </div>
    </motion.div>
  );
}
