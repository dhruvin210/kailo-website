import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { PRODUCTS, type Product } from "@/lib/products";

export const Route = createFileRoute("/wishlist")({
  component: Wishlist,
});

function Wishlist() {
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);

  useEffect(() => {
    const loadWishlist = () => {
      const wishlistIds: string[] = JSON.parse(
        localStorage.getItem("wishlist") || "[]"
      );

      const favouriteProducts = PRODUCTS.filter((product) =>
        wishlistIds.includes(product.id)
      );

      setWishlistProducts(favouriteProducts);
    };

    loadWishlist();

    // Reload whenever the page gains focus
    window.addEventListener("focus", loadWishlist);

    return () => {
      window.removeEventListener("focus", loadWishlist);
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-6 py-20">
      <h1 className="mb-2 text-4xl font-bold">
        ❤️ My Wishlist
      </h1>

      <p className="mb-10 text-gray-500">
        Your favourite products appear below.
      </p>

      {wishlistProducts.length === 0 ? (
        <div className="rounded-xl border border-dashed p-16 text-center">
          <h2 className="text-2xl font-semibold">
            Your wishlist is empty
          </h2>

          <p className="mt-3 text-gray-500">
            Click the ❤️ icon on any product to save it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {wishlistProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      )}
    </div>
  );
}