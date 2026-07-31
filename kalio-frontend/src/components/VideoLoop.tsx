import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

type VideoLoopProps = {
  /** A bundled `.mp4` — imported, so the URL is content-hashed. */
  src: string;
  /**
   * A still from the clip's own opening second. It carries the frame until the
   * video has data, and stands in for the film entirely under reduced motion.
   */
  poster: string;
  /** What the footage shows, for assistive tech. */
  label: string;
  className?: string;
  /** Passed through for the `object-position` each placement crops to. */
  style?: React.CSSProperties;
};

/**
 * A muted, ambient loop that only runs while it is on screen.
 *
 * Nothing but the poster is fetched until the clip scrolls into view — `preload="none"`
 * keeps ~3 MB off the initial load — and it pauses again on the way out, so scrolling
 * past never leaves a stack of decoders running. A visitor who asked for reduced motion
 * is left with the poster, and so is one whose browser refuses to autoplay.
 *
 * There are no controls: these are wallpaper. The parent decides whether tapping opens
 * the full film with sound.
 */
export function VideoLoop({ src, poster, label, className = "", style }: VideoLoopProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduceMotion) {
      el.pause();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          el.pause();
          return;
        }
        // React assigns `muted` as a property, so re-assert it before asking to
        // play — an unmuted autoplay is refused outright.
        el.muted = true;
        // A refusal (iOS low-power mode, say) is fine; the poster stays put.
        void el.play().catch(() => {});
      },
      { threshold: 0.2 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [reduceMotion]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      aria-label={label}
      muted
      loop
      playsInline
      preload="none"
      disablePictureInPicture
      // Wallpaper: never a tab stop, and never the thing a tap lands on.
      tabIndex={-1}
      className={`pointer-events-none ${className}`}
      style={style}
    />
  );
}
