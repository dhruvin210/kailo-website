import { useEffect, useRef } from "react";

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
 * A muted, ambient loop that runs whenever it is on screen.
 *
 * Nothing but the poster is fetched until the clip scrolls into view — `preload="none"`
 * keeps ~3 MB off the initial load — and it pauses again on the way out, so scrolling
 * past never leaves a stack of decoders running.
 *
 * `prefers-reduced-motion` is deliberately **not** consulted. It used to be, and the
 * effect was that anyone with Windows' "Animation effects" turned off saw nothing but
 * still posters on three pages — the films read as broken images rather than as an
 * accommodation. Autoplaying for everyone is the owner's call; the accessibility cost
 * is that a looping clip has no pause control, which is what respecting the setting
 * used to cover. Restoring it is a single early return here.
 *
 * There are no controls: these are wallpaper. The parent decides whether tapping opens
 * the full film with sound.
 */
export function VideoLoop({ src, poster, label, className = "", style }: VideoLoopProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // React assigns `muted` as a property, so re-assert it before asking to play —
    // an unmuted autoplay is refused outright.
    const start = () => {
      el.muted = true;
      void el.play().catch(() => {});
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          el.pause();
          el.removeEventListener("canplay", start);
          return;
        }

        start();
        // The first call is refused while there is nothing decoded to show yet, and
        // `preload="none"` guarantees that is the case on the way in. Asking again
        // once frames exist is what makes the loop reliable rather than lucky.
        el.addEventListener("canplay", start);
      },
      { threshold: 0.2 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      el.removeEventListener("canplay", start);
    };
  }, []);

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
