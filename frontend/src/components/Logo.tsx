import { Link } from "@tanstack/react-router";
import { useGlobal } from "@/lib/site";
import { mediaAlt, mediaUrl } from "@/lib/strapi";
import fallbackLogoUrl from "@/assets/logo/kailo-logo.png";

/**
 * Kailo logo — the wave-in-circle mark plus the "Kailo" wordmark.
 *
 * `light` renders the mark for use on dark or teal backgrounds such as the footer.
 * The CMS can supply a dedicated light variant; when it does not (the seed points
 * `logoLight` at the same file as `logo`), the teal artwork is pushed to white with
 * a brightness/invert filter, exactly as it was before the CMS. The image has a
 * transparent background so it sits cleanly on any surface.
 */
export function Logo({ light = false }: { light?: boolean }) {
  const global = useGlobal();

  const hasDistinctLightMark = !!global?.logoLight && global.logoLight.id !== global.logo?.id;
  const media = light && hasDistinctLightMark ? global?.logoLight : global?.logo;

  const src = mediaUrl(media) || fallbackLogoUrl;
  const siteName = global?.siteName?.trim() || "Kailo";
  // Only filter the teal artwork; a purpose-made light mark is already white.
  const needsInvertFilter = light && !hasDistinctLightMark;

  return (
    <Link to="/" className="flex items-center gap-2 select-none" aria-label={`${siteName} home`}>
      <img
        src={src}
        alt={mediaAlt(media, siteName)}
        className={`h-10 w-auto ${needsInvertFilter ? "brightness-0 invert" : ""}`}
        draggable={false}
      />
      <span
        className={`text-2xl font-semibold tracking-tight ${light ? "text-white" : "text-primary"}`}
      >
        {siteName}
      </span>
    </Link>
  );
}
