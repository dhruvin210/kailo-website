/**
 * CMS icon names → lucide components.
 *
 * `icon` fields (features, About values, contact details) and `socialLinks.platform`
 * hold a component *name*, not markup. The map is an explicit allowlist rather
 * than a dynamic `LucideIcons[name]` lookup: editor input should never be able to
 * reach for an arbitrary export.
 */

import {
  Backpack,
  Clock,
  Facebook,
  Globe,
  GraduationCap,
  Heart,
  Home,
  Instagram,
  Layers,
  Mail,
  MapPin,
  Music,
  Phone,
  Plane,
  Scissors,
  Sparkles,
  Truck,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react";

/** The names the seed writes, plus the four social platforms. */
const ICONS: Record<string, LucideIcon> = {
  Sparkles,
  Music,
  Truck,
  Heart,
  Globe,
  Mail,
  Phone,
  MapPin,
  Clock,
  // About → "Where the detail lives"
  Scissors,
  Backpack,
  Layers,
  // About → "Who carries Kailo"
  Plane,
  Home,
  GraduationCap,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
};

/** Falls back to `Sparkles` so an unmapped name renders a neutral mark, not a hole. */
export const getIcon = (name: string | null | undefined): LucideIcon =>
  (name ? ICONS[name] : undefined) ?? Sparkles;
