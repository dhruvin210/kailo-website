import { motion } from "framer-motion";

type GalleryGridProps = {
  images: string[];
};

const layout = [
  "md:col-span-2 md:row-span-2",
  "",
  "",
  "",
  "",
  "",
];

export default function GalleryGrid({ images }: GalleryGridProps) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="mb-12 text-center">
        <h2 className="text-4xl font-bold text-foreground">
          Our Gallery
        </h2>

        <p className="mt-4 text-muted-foreground">
          Discover our handcrafted instrument accessories.
        </p>
      </div>

      <div className="grid auto-rows-[250px] grid-cols-1 gap-6 md:grid-cols-3">
        {images.map((image, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.3 }}
            className={`overflow-hidden rounded-3xl shadow-lg ${layout[index % layout.length]}`}
          >
            <img
              src={image}
              alt={`Gallery ${index + 1}`}
              className="h-full w-full object-cover transition duration-500 hover:scale-110"
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}