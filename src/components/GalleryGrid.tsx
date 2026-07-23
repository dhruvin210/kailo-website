type GalleryGridProps = {
  images: string[];
};

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

      {/* Masonry columns so every photo shows in full at its natural aspect ratio */}
      <div className="columns-1 gap-6 sm:columns-2 lg:columns-3 [column-fill:balance]">
        {images.map((image, index) => (
          <div
            key={index}
            className="mb-6 break-inside-avoid overflow-hidden rounded-3xl shadow-lg"
          >
            <img
              src={image}
              alt={`Gallery ${index + 1}`}
              loading="lazy"
              decoding="async"
              className="w-full h-auto transition duration-500 hover:scale-105"
            />
          </div>
        ))}
      </div>
    </section>
  );
}