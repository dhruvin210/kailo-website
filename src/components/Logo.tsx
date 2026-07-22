import { Link } from "@tanstack/react-router";
import logoUrl from "@/assets/logo/kailo-logo.png";

/**
 * Kailo logo — the wave-in-circle mark plus the "Kailo" wordmark.
 *
 * `light` renders the mark in white (via a brightness/invert filter) for use on
 * dark or teal backgrounds such as the footer; otherwise the teal artwork is
 * shown as-is. The image has a transparent background so it sits cleanly on any
 * surface.
 */
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2 select-none" aria-label="Kailo home">
      <img
        src={logoUrl}
        alt="Kailo"
        className={`h-10 w-auto ${light ? "brightness-0 invert" : ""}`}
        draggable={false}
      />
      <span
        className={`text-2xl font-semibold tracking-tight ${
          light ? "text-white" : "text-primary"
        }`}
      >
        Kailo
      </span>
    </Link>
  );
}
