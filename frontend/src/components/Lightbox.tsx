import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type LightboxProps = {
  src: string;
  alt: string;
  index: number;
  total: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  /** A film plays here with its sound and its own controls. Default is a still. */
  kind?: "image" | "video";
  /** The film's poster, so the frame is filled before the first bytes land. */
  poster?: string;
};

/**
 * Full-screen media viewer with keyboard nav, a focus trap and scroll lock.
 * Shared by the homepage gallery and film sections and the gallery page.
 */
export function Lightbox({
  src,
  alt,
  index,
  total,
  onClose,
  onNext,
  onPrev,
  kind = "image",
  poster,
}: LightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const noun = kind === "video" ? "Film" : "Image";

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";

    // Move focus into the dialog for screen readers / keyboard users.
    dialogRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      // With the player focused the arrows belong to it, for scrubbing.
      const scrubbing = e.target instanceof HTMLVideoElement;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight" && !scrubbing) {
        onNext();
      } else if (e.key === "ArrowLeft" && !scrubbing) {
        onPrev();
      } else if (e.key === "Tab") {
        // Trap focus within the dialog's focusable controls.
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
          "button, [href], [tabindex]:not([tabindex='-1'])",
        );
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      previouslyFocused?.focus?.();
    };
  }, [onClose, onNext, onPrev]);

  return (
    <motion.div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${noun} ${index + 1} of ${total}`}
      tabIndex={-1}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md outline-none sm:p-8"
    >
      {/* Counter */}
      <div className="absolute left-1/2 top-5 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur">
        {index + 1} / {total}
      </div>

      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 sm:right-6 sm:top-6"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Prev */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        aria-label={`Previous ${noun.toLowerCase()}`}
        className="absolute left-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 sm:left-6"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      {/* Media. The film opens playing — the click that got here is the gesture
          that lets it start with sound — and loops until it is dismissed. */}
      {kind === "video" ? (
        <motion.video
          key={src}
          src={src}
          poster={poster}
          aria-label={alt}
          controls
          autoPlay
          loop
          playsInline
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="max-h-[85vh] w-full max-w-5xl rounded-2xl shadow-2xl"
        />
      ) : (
        <motion.img
          key={src}
          src={src}
          alt={alt}
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
        />
      )}

      {/* Next */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        aria-label={`Next ${noun.toLowerCase()}`}
        className="absolute right-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 sm:right-6"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </motion.div>
  );
}
