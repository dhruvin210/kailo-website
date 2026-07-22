import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Music, Truck } from "lucide-react";

import { SiteLayout } from "@/components/SiteLayout";
import { ProductCard } from "@/components/ProductCard";
import GalleryGrid from "@/components/GalleryGrid";

import { PRODUCTS } from "@/lib/products";

import gallery1 from "@/assets/gallery/gallery1.jpeg";
import gallery2 from "@/assets/gallery/gallery2.jpeg";
import gallery3 from "@/assets/gallery/gallery3.jpeg";
import gallery4 from "@/assets/gallery/gallery4.jpeg";
import gallery5 from "@/assets/gallery/gallery5.jpeg";
import gallery6 from "@/assets/gallery/gallery6.jpeg";

import heroImage from "@/assets/hero/hero.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Kailo — Premium Instrument Accessories",
      },
      {
        name: "description",
        content:
          "Crafted with finesse, made to move your soul. Premium cases, straps, tuners and care kits for musicians.",
      },
    ],
  }),
  component: Home,
});

const bestSellers = PRODUCTS.slice(0, 4);

const categories = [
  {
    name: "Cases",
    image:
      "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Straps",
    image:
      "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Tuners",
    image:
      "https://images.unsplash.com/photo-1511735111819-9a3f7709049c?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Picks & Care",
    image:
      "https://images.unsplash.com/photo-1453090927415-5f45085b65c0?auto=format&fit=crop&w=800&q=80",
  },
];

const galleryImages = [
  gallery1,
  gallery2,
  gallery3,
  gallery4,
  gallery5,
  gallery6,
];

function Home() {
  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative h-screen overflow-hidden">
        <img
          src={heroImage}
          alt="Kailo Hero"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-black/50" />

        <div className="relative z-10 flex h-full items-center justify-center">
          <div className="mx-auto max-w-4xl px-6 text-center text-white">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 text-sm font-semibold uppercase tracking-[0.4em] text-white/80"
            >
              Premium Instrument Accessories
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-bold md:text-7xl"
            >
              Crafted for Every
              <br />
              Musician
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto mt-6 max-w-2xl text-lg text-white/90"
            >
              Discover premium guitar cases, straps and accessories designed
              to protect your instrument and elevate every performance.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10 flex justify-center gap-4"
            >
              <Link
                to="/products"
                className="rounded-full bg-white px-8 py-4 font-semibold text-black hover:bg-gray-200"
              >
                Shop Now
              </Link>

              <a
                href="#gallery"
                className="rounded-full border border-white px-8 py-4 font-semibold text-white hover:bg-white hover:text-black"
              >
                Explore Collection
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 flex justify-between">
            <h2 className="text-4xl font-bold">
              Shop by Category
            </h2>

            <Link
              to="/products"
              className="text-primary"
            >
              View all →
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.name}
                to="/products"
                className="group relative overflow-hidden rounded-3xl"
              >
                <img
                  src={category.image}
                  alt={category.name}
                  className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

                <div className="absolute bottom-5 left-5 text-white">
                  <h3 className="text-2xl font-semibold">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* WHY KAILO */}
      <section className="bg-[var(--bg-soft)] py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-3">
          {[
            {
              Icon: Sparkles,
              title: "Premium Craftsmanship",
              body: "Handpicked materials for durability and elegance.",
            },
            {
              Icon: Music,
              title: "Made for Musicians",
              body: "Designed with professional artists.",
            },
            {
              Icon: Truck,
              title: "Fast Delivery",
              body: "Ships worldwide in 3–5 business days.",
            },
          ].map(({ Icon, title, body }) => (
            <div
              key={title}
              className="text-center"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-6 w-6" />
              </div>

              <h3 className="mt-5 text-xl font-semibold">
                {title}
              </h3>

              <p className="mt-2 text-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* BEST SELLERS */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mb-10 text-center text-4xl font-bold">
            Our Best Sellers
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {bestSellers.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section
        id="gallery"
        className="bg-gray-50 py-24"
      >
        <GalleryGrid images={galleryImages} />
      </section>
    </SiteLayout>
  );
}