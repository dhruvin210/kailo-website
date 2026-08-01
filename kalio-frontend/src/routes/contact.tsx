import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Music,
  Navigation,
  Phone,
  type LucideIcon,
} from "lucide-react";

import { SiteLayout } from "@/components/SiteLayout";
import { CmsLink } from "@/components/CmsLink";

import { getIcon } from "@/lib/icons";
import { contactPageQuery, type ContactDetail, type ContactPage } from "@/lib/queries";
import { useGlobal } from "@/lib/site";
import {
  HONEYPOT_FIELD,
  mediaAlt,
  mediaSrcSet,
  mediaUrl,
  SIZES,
  submitContactForm,
  whatsappUrl,
} from "@/lib/strapi";

export const Route = createFileRoute("/contact")({
  loader: async ({ context }) => ({
    contact: await context.queryClient.ensureQueryData(contactPageQuery()),
  }),
  head: ({ loaderData }) => {
    const seo = loaderData?.contact.seo;

    const title = seo?.metaTitle ?? "Contact — Kailo";
    const description =
      seo?.metaDescription ??
      "Get in touch with Kailo. Product questions, custom orders, wholesale and collaborations — we'd love to hear from you.";
    const ogImage = mediaUrl(seo?.ogImage) || mediaUrl(loaderData?.contact.heroImage);

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        ...(ogImage ? [{ property: "og:image", content: ogImage }] : []),
        { property: "og:url", content: "/contact" },
      ],
      links: [{ rel: "canonical", href: seo?.canonicalUrl ?? "/contact" }],
    };
  },
  component: Contact,
});

/* ──────────────────────────── CONTENT ──────────────────────────── */

/** CMS text with the pre-CMS copy as its fallback, for layout-bearing strings. */
const text = (value: string | null | undefined, fallback: string) => value?.trim() || fallback;

/**
 * The enquiry types the form offers.
 *
 * `contactPage.formSubjects` drives the order and the subset that is offered, but
 * this tuple is what validation is built on, and it has to stay in sync with two
 * other places: `SUBJECTS` in the contact-submission controller, which is the
 * server's allowlist, and `CONTACT_PAGE.formSubjects` in the seed. A type offered
 * by the CMS but missing here is filtered out rather than shown unsubmittable.
 */
const SUBJECTS = [
  "Product Enquiry",
  "Custom Order",
  "Wholesale Enquiry",
  "Collaboration",
  "Order Support",
  "General Enquiry",
] as const;

/** Matches `DEFAULT_SUBJECT` on the server. */
const DEFAULT_SUBJECT = "General Enquiry";

/** Used only when the CMS has no email detail to read. */
const FALLBACK_EMAIL = "abhinavsharma@kailostore.in";

/** The anchor the hero and the closing CTA both scroll to. */
const FORM_ID = "contact-form";

/**
 * The action each kind of contact detail carries, keyed by the lucide name the
 * CMS stores in `icon`. A detail with no entry — `Clock`, the opening hours — is
 * not something you can *do*, so it renders as a plain card with no link rather
 * than promising a click that goes nowhere.
 */
const DETAIL_ACTIONS: Record<string, string> = {
  Mail: "Write to us",
  Phone: "Call us",
  MapPin: "Get directions",
};

/** The text fields, in the order they run. Only their names and copy differ. */
const FIELDS = [
  {
    name: "name",
    label: "Full name",
    placeholder: "Jane Player",
    type: "text",
    autoComplete: "name",
    optional: false,
  },
  {
    name: "email",
    label: "Email address",
    placeholder: "you@example.com",
    type: "email",
    autoComplete: "email",
    optional: false,
  },
  {
    name: "phone",
    label: "Phone number",
    placeholder: "(+91) 00000 00000",
    type: "tel",
    autoComplete: "tel",
    optional: true,
  },
] as const;

/* ──────────────────────────── MOTION ──────────────────────────── */

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The page's scroll-reveal props, flattened to a plain fade for a visitor who
 * asked for less motion. Same two rules the rest of the site settled on: fire
 * before the element arrives (a positive bottom `margin` grows the observer root
 * downwards, so a block has finished moving by the time it can be read), and only
 * ever move up.
 *
 * The stylesheet's `prefers-reduced-motion` block only reaches CSS animations and
 * transitions — framer-motion writes inline transforms, so the offset has to be
 * dropped here instead.
 */
function useReveal() {
  const reduceMotion = useReducedMotion() ?? false;

  return useMemo(() => {
    const hidden = reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 };
    const shown = { opacity: 1, y: 0 };
    const viewport = { once: true, margin: "0px 0px 220px 0px" } as const;

    return {
      reduceMotion,
      reveal: {
        initial: hidden,
        whileInView: shown,
        viewport,
        transition: { duration: reduceMotion ? 0.3 : 0.5, ease: EASE },
      },
      revealItem: (i: number) => ({
        initial: hidden,
        whileInView: shown,
        viewport,
        transition: {
          duration: reduceMotion ? 0.3 : 0.45,
          // Capped: a longer list must not leave its tail still arriving once the
          // reader has caught up with it.
          delay: reduceMotion ? 0 : Math.min(i, 3) * 0.06,
          ease: EASE,
        },
      }),
    };
  }, [reduceMotion]);
}

/* ──────────────────────────── CHANNELS ──────────────────────────── */

type Channel = ContactDetail & { href: string | null; action: string };

/**
 * `contactDetails` turned into things you can actually click, plus WhatsApp.
 *
 * The CMS models a detail as three strings — icon, label, value — with no link, so
 * the destination is derived from the icon: the email address becomes a `mailto:`,
 * the phone number a `tel:` with its spacing and brackets stripped back to digits,
 * and the address the page's own directions URL.
 *
 * WhatsApp is not a CMS detail and deliberately isn't one — it is a second way to
 * reach the same phone number, so it is derived here instead of being a fifth row
 * an editor could set to something that contradicts the fourth. It drops out
 * entirely when there is no number to send anyone to.
 */
function useChannels(contact: ContactPage) {
  const details = contact.contactDetails;
  const directions = contact.workshopDirectionsUrl;
  const location = contact.workshopLocation;

  return useMemo(() => {
    const resolved: Channel[] = (details ?? []).map((detail) => {
      const value = detail.value.trim();

      const href =
        detail.icon === "Mail"
          ? `mailto:${value}`
          : detail.icon === "Phone"
            ? // "(+91) 814 902 7675" → "tel:+918149027675". A dialler wants the
              // digits and the country prefix, nothing in between.
              `tel:${value.replace(/[^\d+]/g, "")}`
            : detail.icon === "MapPin"
              ? (directions ??
                `https://maps.google.com/?q=${encodeURIComponent(location ?? value)}`)
              : null;

      return { ...detail, href, action: DETAIL_ACTIONS[detail.icon] ?? "" };
    });

    const email = resolved.find((c) => c.icon === "Mail")?.value ?? FALLBACK_EMAIL;
    const phone = resolved.find((c) => c.icon === "Phone")?.value ?? null;
    const hours = resolved.find((c) => c.icon === "Clock")?.value ?? null;

    const whatsapp = whatsappUrl(phone, "Hi Kailo — I have a question about your bags and straps.");

    return { channels: resolved, email, phone, hours, whatsapp };
  }, [details, directions, location]);
}

/* ──────────────────────────── PAGE ──────────────────────────── */

/**
 * Six bands, alternating white and the cool light grey so no two neighbours share
 * a ground, and each with a layout of its own so the scroll never repeats itself:
 * an asymmetric hero, the details and the form side by side, three quick channels,
 * the workshop with its map, the FAQs, and a single closing invitation.
 */
function Contact() {
  const { contact } = Route.useLoaderData();

  return (
    <SiteLayout>
      <Hero contact={contact} />
      <Enquiry contact={contact} />
      <Workshop contact={contact} />
      <Faqs contact={contact} />
      <ClosingCta contact={contact} />
    </SiteLayout>
  );
}

/* ─────────────────────────── 1. HERO ─────────────────────────── */

/**
 * A full-bleed cinematic hero, built on the same treatment as the homepage's:
 * the photograph is the ground, graded dark from the left so white type sits on
 * it at full contrast, with a vignette and a little film grain over the top.
 *
 * It replaces a contained portrait plate. That version framed the better
 * photograph — the 4:5 strap-and-ukulele still — but a full-width band can only
 * show that frame by cropping away either the instrument or the leather, so the
 * hero moves to `hero2`, one of the four wide frames the homepage runs on. Its
 * subject sits right of centre, which is what leaves the left of the frame clear.
 *
 * Below `lg` the image and the copy stack rather than overlaying, because a
 * 16:9 frame cropped to a phone's portrait viewport is a face and no context.
 * The section carries the dark ground itself, so the copy panel below the image
 * is continuous with it.
 */
function Hero({ contact }: { contact: ContactPage }) {
  const reduceMotion = useReducedMotion() ?? false;
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // The image drifts down while the copy lifts and fades away — the homepage's
  // pairing. The wrapper is oversized by the distance it can travel, so the
  // drift never pulls an edge into frame.
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "45%"]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  const entrance = (delay: number) => ({
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 22 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduceMotion ? 0.3 : 0.7, delay: reduceMotion ? 0 : delay, ease: EASE },
  });

  const chip =
    "inline-flex items-center gap-2.5 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm text-white/85 backdrop-blur";

  return (
    <section
      ref={sectionRef}
      // Sits below the solid white navbar and fills what is left of the viewport.
      className="relative flex flex-col overflow-hidden bg-[oklch(0.16_0.02_265)] lg:block lg:h-[calc(94svh-4rem)] lg:min-h-[600px] lg:max-h-[900px]"
    >
      <div className="relative aspect-4/3 w-full overflow-hidden sm:aspect-16/10 lg:absolute lg:inset-0 lg:aspect-auto lg:h-full">
        <motion.div
          style={reduceMotion ? undefined : { y: imageY }}
          className="absolute -top-[6%] h-[112%] w-full will-change-transform"
        >
          <img
            src={mediaUrl(contact.heroImage)}
            srcSet={mediaSrcSet(contact.heroImage)}
            // Full-bleed, so the browser must pick from the whole candidate list
            // rather than the half-width one the contained plate asked for.
            sizes={SIZES.fullWidth}
            alt={mediaAlt(
              contact.heroImage,
              "A musician outdoors with a handcrafted Kailo instrument bag",
            )}
            // The one image on the page worth blocking the first paint on.
            fetchPriority="high"
            decoding="async"
            style={{ objectPosition: "55% 50%" }}
            className="h-full w-full origin-center animate-slow-zoom object-cover"
          />
        </motion.div>

        {/* Legibility grade. Below `lg` the copy is under the image, so the frame
            fades into the panel; from `lg` it is over the image, so the grade
            runs left-to-right instead. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[oklch(0.16_0.02_265)] via-black/25 to-transparent lg:hidden" />
        <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-black/90 via-black/55 via-45% to-black/10 lg:block" />
        <div className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(ellipse_at_65%_45%,transparent_35%,rgba(0,0,0,0.5)_100%)] lg:block" />

        {/* Fine film grain, as on the homepage. The filter id has to differ from
            that one's or two heroes in the same document would share a filter. */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.1] mix-blend-overlay"
          aria-hidden="true"
        >
          <filter id="contact-hero-grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="2"
              stitchTiles="stitch"
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#contact-hero-grain)" />
        </svg>
      </div>

      {/* `pointer-events-none` on the overlay from `lg`, re-enabled on the copy
          itself, so the dead space beside the text never eats a click. */}
      <motion.div
        style={reduceMotion ? undefined : { y: textY, opacity: textOpacity }}
        className="relative z-10 w-full px-5 pb-16 pt-9 sm:px-8 lg:pointer-events-none lg:absolute lg:inset-0 lg:flex lg:items-center lg:p-0"
      >
        <div className="mx-auto w-full max-w-7xl lg:px-8">
          <div className="max-w-2xl text-white lg:pointer-events-auto lg:max-w-3xl">
            <motion.p
              {...entrance(0)}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] backdrop-blur sm:text-xs"
            >
              <Music className="h-3.5 w-3.5 text-primary" />
              {text(contact.heroEyebrow, "Contact")}
            </motion.p>

            <motion.h1
              {...entrance(0.08)}
              className="mt-6 text-balance text-[2.5rem] font-semibold leading-[1.08] sm:text-5xl lg:text-6xl xl:text-7xl"
            >
              {text(contact.heroHeading, "Let's make something beautiful together")}
            </motion.h1>

            {contact.heroSubtext && (
              <motion.p
                {...entrance(0.16)}
                className="mt-6 max-w-xl text-lg leading-relaxed text-white/80"
              >
                {contact.heroSubtext}
              </motion.p>
            )}

            {/* The two facts worth having before someone starts writing. Glass
                rather than solid cards: on a photograph they read as part of the
                image, where an opaque tile would read as a panel dropped on it. */}
            <motion.div {...entrance(0.24)} className="mt-8 flex flex-wrap gap-3">
              <span className={chip}>
                <Clock className="h-4 w-4 shrink-0 text-primary" />
                Replies within one business day
              </span>
              <span className={chip}>
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                Made by hand in {text(contact.workshopLocation, "Pune, Maharashtra")}
              </span>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ────────────────── 2. DETAILS, FORM, QUICK LINKS ────────────────── */

const schema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .optional()
    .refine((value) => !value?.trim() || /^[\d\s+()-]{6,20}$/.test(value.trim()), {
      message: "Please enter a valid phone number, or leave it blank",
    }),
  subject: z.enum(SUBJECTS),
  message: z.string().min(20, "Please give us at least 20 characters so we can help"),
  // The honeypot. Left unconstrained on purpose: a bot that fills it in should
  // reach the server, get its 200, and stop retrying — not trip a client error.
  [HONEYPOT_FIELD]: z.string().optional(),
});

type FormValues = z.output<typeof schema>;

/**
 * The page's centre of gravity: what you can reach us on, and the form.
 *
 * The columns are deliberately uneven — the form is the thing being asked for, so
 * it takes the wider half, and the channels beside it read as a sidebar rather
 * than as a competing column.
 */
function Enquiry({ contact }: { contact: ContactPage }) {
  const { reveal } = useReveal();
  const { channels, email, phone, whatsapp } = useChannels(contact);

  return (
    <section className="relative overflow-hidden bg-[var(--bg-soft)] py-20 sm:py-24 lg:py-28">
      <div className="pointer-events-none absolute -right-32 top-1/3 h-[30rem] w-[30rem] rounded-full bg-white opacity-60 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
          <motion.div {...reveal} className="lg:col-span-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              Get in touch
            </p>
            {/* The long question is body copy, not the heading. Set as an h2 it
                ran to four lines of display serif and shouted down the form it is
                supposed to be introducing. */}
            <h2 className="mt-5 text-balance text-3xl font-semibold leading-[1.1] md:text-4xl">
              Talk to the makers
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Have a question about our products, custom orders, collaborations, or wholesale
              opportunities? Our team would love to hear from you.
            </p>

            <ChannelList channels={channels} whatsapp={whatsapp} />
            <SocialRow />
          </motion.div>

          <div className="lg:col-span-7">
            <EnquiryForm contact={contact} email={email} />
            <QuickContact email={email} phone={phone} whatsapp={whatsapp} />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Email, phone, address and hours as cards, with WhatsApp appended. */
function ChannelList({ channels, whatsapp }: { channels: Channel[]; whatsapp: string | null }) {
  const { revealItem } = useReveal();

  if (channels.length === 0 && !whatsapp) return null;

  const card =
    "group flex items-start gap-4 rounded-2xl bg-card p-5 shadow-sm shadow-black/5 ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/10";
  const tile =
    "grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground";

  return (
    <ul className="mt-9 space-y-3">
      {channels.map((channel, i) => {
        // The CMS stores the lucide component's name, not markup.
        const Icon = getIcon(channel.icon);
        // Only the address leaves the site; a mailto:/tel: hands off to a local
        // handler, where a new tab is left behind as a blank window.
        const external = channel.href?.startsWith("http");

        const body = (
          <>
            <span className={tile}>
              <Icon className="h-5 w-5" />
            </span>
            <span className="block min-w-0">
              <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {channel.label}
              </span>
              {/* `break-words`, never a truncation: an address and an email are
                  the two strings here that must not be shown incomplete. */}
              <span className="mt-1 block break-words font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">
                {channel.value}
              </span>
              {channel.action && (
                <span className="mt-1.5 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  {channel.action}
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              )}
            </span>
          </>
        );

        return (
          <motion.li key={channel.label} {...revealItem(i)}>
            {channel.href ? (
              <a
                href={channel.href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className={card}
              >
                {body}
              </a>
            ) : (
              <div className={card}>{body}</div>
            )}
          </motion.li>
        );
      })}

      {whatsapp && (
        <motion.li {...revealItem(channels.length)}>
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={card}>
            <span className={tile}>
              <MessageCircle className="h-5 w-5" />
            </span>
            <span className="block min-w-0">
              <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                WhatsApp
              </span>
              <span className="mt-1 block font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">
                Message us directly
              </span>
              <span className="mt-1.5 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Open WhatsApp
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </span>
          </a>
        </motion.li>
      )}
    </ul>
  );
}

/**
 * The social row, and nothing at all when there is nowhere to send anyone.
 *
 * `global.socialLinks` is seeded with `#` for every platform. A row of icons that
 * jump the page back to the top is worse than no row, so a link only renders once
 * it has a real destination.
 */
function SocialRow() {
  const global = useGlobal();

  const socials = (global?.socialLinks ?? []).filter((social) => {
    const url = social.url?.trim();
    return !!url && url !== "#";
  });

  if (socials.length === 0) return null;

  return (
    <div className="mt-8">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Follow along
      </p>
      <ul className="mt-3.5 flex flex-wrap gap-2.5">
        {socials.map((social) => {
          const Icon = getIcon(social.platform);

          return (
            <li key={social.platform}>
              <a
                href={social.url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.platform}
                className="grid h-11 w-11 place-items-center rounded-full bg-card text-foreground shadow-sm shadow-black/5 ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground hover:shadow-lg"
              >
                <Icon className="h-4.5 w-4.5" />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * The message form, in a card of its own.
 *
 * Every field carries a real `<label>` rather than leaning on its placeholder, so
 * the question survives the moment the visitor starts typing. Errors are wired
 * through `aria-describedby`, and the whole thing is a native form: tab order,
 * `Enter` to submit and the browser's own autofill all work without help.
 *
 * On success the form is replaced in place by an acknowledgement rather than only
 * raising a toast — a toast that has already faded leaves someone wondering
 * whether the message went.
 */
function EnquiryForm({ contact, email }: { contact: ContactPage; email: string }) {
  const { reveal } = useReveal();
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { subject: DEFAULT_SUBJECT, phone: "" },
  });

  // Only offer types validation will accept — one added in the CMS without the
  // matching change here would otherwise be selectable but unsubmittable.
  const subjects = (contact.formSubjects ?? SUBJECTS).filter(
    (subject): subject is (typeof SUBJECTS)[number] =>
      (SUBJECTS as readonly string[]).includes(subject),
  );

  const onSubmit = async (values: FormValues) => {
    const result = await submitContactForm({
      ...values,
      phone: values.phone?.trim() || undefined,
    });

    if (!result.ok) {
      toast.error(
        result.status === 429
          ? "Too many messages just now. Please try again in a minute."
          : `Something went wrong. Please try again or email ${email}.`,
      );
      return;
    }

    setSent(true);
    reset();
  };

  const field = (invalid: boolean) =>
    `w-full rounded-2xl border bg-[var(--bg-soft)] px-5 py-3.5 text-sm text-foreground outline-none transition focus:bg-card focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground/70 ${
      invalid ? "border-destructive" : "border-transparent focus:border-primary"
    }`;

  const labelClass = "mb-2 block text-sm font-medium text-foreground";

  return (
    <motion.div
      {...reveal}
      id={FORM_ID}
      // Clears the sticky navbar when the closing CTA jumps back up here.
      className="scroll-mt-24 rounded-[2rem] bg-card p-7 shadow-xl shadow-black/5 ring-1 ring-black/5 sm:p-9 lg:p-10"
    >
      <AnimatePresence mode="wait" initial={false}>
        {sent ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="py-8 text-center"
            role="status"
          >
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
              <Check className="h-7 w-7" />
            </span>
            <h3 className="mt-6 font-display text-2xl font-semibold">Thank you — message sent</h3>
            <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted-foreground">
              We have it, and you will hear back within one business day. If it is urgent, WhatsApp
              or a call will always be quicker.
            </p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="mt-7 inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
            >
              Send another message
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">Send us a message</h2>
            <p className="mt-2 text-muted-foreground">A few lines is plenty — we read every one.</p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                {FIELDS.map((entry) => {
                  const error = errors[entry.name];

                  return (
                    // Three text fields plus the enquiry type below fill the two
                    // columns exactly, so no cell needs a span of its own.
                    <div key={entry.name}>
                      <label htmlFor={entry.name} className={labelClass}>
                        {entry.label}
                        {entry.optional && (
                          <span className="ml-1.5 font-normal text-muted-foreground">
                            (optional)
                          </span>
                        )}
                      </label>
                      <input
                        id={entry.name}
                        type={entry.type}
                        autoComplete={entry.autoComplete}
                        {...register(entry.name)}
                        aria-invalid={!!error}
                        aria-describedby={error ? `${entry.name}-error` : undefined}
                        placeholder={entry.placeholder}
                        className={field(!!error)}
                      />
                      {error && (
                        <p id={`${entry.name}-error`} className="mt-2 text-xs text-destructive">
                          {error.message}
                        </p>
                      )}
                    </div>
                  );
                })}

                <div>
                  <label htmlFor="subject" className={labelClass}>
                    Enquiry type
                  </label>
                  <div className="relative">
                    {/* Native, not a custom listbox: it is keyboard operable and
                        announced correctly for free, and on a phone it opens the
                        platform picker instead of a scroll trap. */}
                    <select
                      id="subject"
                      {...register("subject")}
                      className={`${field(false)} appearance-none pr-11`}
                    >
                      {subjects.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="message" className={labelClass}>
                  Message
                </label>
                <textarea
                  id="message"
                  rows={6}
                  {...register("message")}
                  aria-invalid={!!errors.message}
                  aria-describedby={errors.message ? "message-error" : undefined}
                  placeholder="Tell us what you play, and what you are after…"
                  className={`resize-none ${field(!!errors.message)}`}
                />
                {errors.message && (
                  <p id="message-error" className="mt-2 text-xs text-destructive">
                    {errors.message.message}
                  </p>
                )}
              </div>

              {/* Honeypot — off-screen and hidden from assistive tech, so only a
                  bot filling in every field will ever put anything in it. */}
              <input
                type="text"
                {...register(HONEYPOT_FIELD)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute left-[-9999px] h-0 w-0 opacity-0"
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="group inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-primary px-8 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--primary-dark)] hover:shadow-xl hover:shadow-primary/30 disabled:pointer-events-none disabled:opacity-60"
              >
                {isSubmitting ? "Sending…" : "Send message"}
                {!isSubmitting && (
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

type QuickOption = {
  icon: LucideIcon;
  title: string;
  body: string;
  href: string;
  external: boolean;
};

/**
 * The three ways to skip the form, directly under it.
 *
 * WhatsApp drops out when no number is configured — see `whatsappUrl` — which is
 * why this is a built list rather than three hard-coded cards.
 */
function QuickContact({
  email,
  phone,
  whatsapp,
}: {
  email: string;
  phone: string | null;
  whatsapp: string | null;
}) {
  const { revealItem } = useReveal();

  // Spread-if rather than build-then-filter: a falsy entry left in the array
  // widens the element type to include `""`, and every read of it then has to be
  // narrowed back.
  const options: QuickOption[] = [
    ...(whatsapp
      ? [
          {
            icon: MessageCircle,
            title: "Chat on WhatsApp",
            body: "Quickest for a short question.",
            href: whatsapp,
            external: true,
          },
        ]
      : []),
    {
      icon: Mail,
      title: "Send an email",
      body: "Best for detail, files and quotes.",
      href: `mailto:${email}`,
      external: false,
    },
    ...(phone
      ? [
          {
            icon: Phone,
            title: "Call us",
            body: "Talk it through during workshop hours.",
            href: `tel:${phone.replace(/[^\d+]/g, "")}`,
            external: false,
          },
        ]
      : []),
  ];

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-3">
      {options.map((option, i) => (
        <motion.a
          key={option.title}
          {...revealItem(i)}
          href={option.href}
          {...(option.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="group rounded-2xl bg-card p-5 shadow-sm shadow-black/5 ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
            <option.icon className="h-5 w-5" />
          </span>
          <span className="mt-4 flex items-center gap-1.5 font-semibold">
            {option.title}
            <ArrowUpRight className="h-4 w-4 text-primary transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
          <span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground">
            {option.body}
          </span>
        </motion.a>
      ))}
    </div>
  );
}

/* ─────────────────────── 3. VISIT OUR WORKSHOP ─────────────────────── */

/**
 * The location band: the address and the workshop photograph on the narrow left
 * column, the map on the wide right one, stacking to a single column on a phone.
 *
 * This is the first thing on the site to read `mapEmbedUrl`, which has been in the
 * CMS unused since it went in. The embed is skipped rather than framed empty when
 * the field is blank, so the band degrades to photograph-and-address.
 */
function Workshop({ contact }: { contact: ContactPage }) {
  const { reveal } = useReveal();
  const { hours } = useChannels(contact);

  const location = text(contact.workshopLocation, "Pune, Maharashtra");
  const address =
    contact.contactDetails?.find((d) => d.icon === "MapPin")?.value.trim() ?? location;
  const directions =
    contact.workshopDirectionsUrl ?? `https://maps.google.com/?q=${encodeURIComponent(location)}`;

  return (
    <section className="py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <motion.div {...reveal} className="lg:col-span-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              {text(contact.workshopLabel, "Visit us")}
            </p>
            <h2 className="mt-5 text-balance text-4xl font-semibold leading-[1.1] md:text-5xl">
              Visit our workshop
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              The bench every Kailo bag and strap is cut, stitched and finished on.
            </p>

            <div className="mt-8 overflow-hidden rounded-[2rem] shadow-xl shadow-black/10">
              <img
                src={mediaUrl(contact.workshopImage)}
                srcSet={mediaSrcSet(contact.workshopImage)}
                sizes={SIZES.editorialHalf}
                alt={mediaAlt(
                  contact.workshopImage,
                  "A Kailo craftsperson hand-stitching leather at the workshop bench",
                )}
                loading="lazy"
                decoding="async"
                className="aspect-4/3 w-full object-cover transition-transform duration-[1200ms] hover:scale-[1.03]"
              />
            </div>

            <dl className="mt-8 space-y-5">
              <div className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  {/* A pin, not the paper plane — that one belongs to the
                      directions button, which is the thing that navigates. */}
                  <MapPin className="h-4 w-4" />
                </span>
                <span className="block">
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Address
                  </dt>
                  <dd className="mt-1 font-semibold">{address}</dd>
                </span>
              </div>

              {hours && (
                <div className="flex gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Clock className="h-4 w-4" />
                  </span>
                  <span className="block">
                    <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Opening hours
                    </dt>
                    <dd className="mt-1 font-semibold">{hours}</dd>
                  </span>
                </div>
              )}
            </dl>

            <a
              href={directions}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-8 inline-flex items-center gap-2.5 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.12em] text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--primary-dark)] hover:shadow-xl hover:shadow-primary/30"
            >
              <Navigation className="h-4 w-4" />
              Get directions
            </a>
          </motion.div>

          <motion.div {...reveal} className="lg:col-span-7">
            {contact.mapEmbedUrl ? (
              <iframe
                src={contact.mapEmbedUrl}
                title={`Map showing the Kailo workshop in ${location}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                className="h-full min-h-[24rem] w-full rounded-[2rem] border-0 shadow-xl shadow-black/10 ring-1 ring-black/5"
              />
            ) : (
              // No embed configured: a framed empty box would read as broken.
              <a
                href={directions}
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-full min-h-[24rem] place-items-center rounded-[2rem] bg-[var(--bg-soft)] p-10 text-center ring-1 ring-black/5 transition-colors hover:bg-[var(--primary-light)]"
              >
                <span className="block">
                  <Navigation className="mx-auto h-8 w-8 text-primary" />
                  <span className="mt-4 block text-lg font-semibold">{location}</span>
                  <span className="mt-1.5 block text-muted-foreground">Open in Google Maps</span>
                </span>
              </a>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── 4. FREQUENTLY ASKED ─────────────────────── */

/**
 * The FAQs, on a controlled accordion rather than `<details>`.
 *
 * `<details>` cannot animate its own open and close — the element snaps — so the
 * panel is a framer-motion height transition instead, and the summary becomes a
 * real `<button>` carrying `aria-expanded` and `aria-controls`. One panel is open
 * at a time: these answers are short, and a page that grows by five paragraphs at
 * once loses the reader's place.
 */
function Faqs({ contact }: { contact: ContactPage }) {
  const { reveal, revealItem, reduceMotion } = useReveal();
  const [open, setOpen] = useState<number | null>(0);

  const faqs = contact.faqs ?? [];
  if (faqs.length === 0) return null;

  return (
    <section className="bg-[var(--bg-soft)] py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <motion.div {...reveal} className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            {text(contact.faqEyebrow, "Good to know")}
          </p>
          <h2 className="mt-5 text-balance text-4xl font-semibold leading-[1.1] md:text-5xl">
            {text(contact.faqHeading, "Frequently asked")}
          </h2>
        </motion.div>

        <div className="mt-12 space-y-3 sm:mt-14">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            const panelId = `faq-panel-${i}`;
            const buttonId = `faq-button-${i}`;

            return (
              <motion.div
                key={faq.question}
                {...revealItem(i)}
                className="overflow-hidden rounded-2xl bg-card shadow-sm shadow-black/5 ring-1 ring-black/5"
              >
                <h3>
                  <button
                    type="button"
                    id={buttonId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-5 p-6 text-left font-semibold transition-colors hover:text-primary sm:p-7"
                  >
                    {faq.question}
                    <ChevronDown
                      aria-hidden="true"
                      className={`h-5 w-5 shrink-0 text-primary transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </h3>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="panel"
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.32, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-6 leading-relaxed text-muted-foreground sm:px-7 sm:pb-7">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── 5. CLOSING ─────────────────────────── */

/**
 * One line, one button, and no contact details — every channel is already on this
 * page, so the close returns the reader to the form rather than listing the
 * address a third time. The button is an in-page anchor, which the stylesheet's
 * `scroll-behavior: smooth` turns into a glide back up.
 */
function ClosingCta({ contact }: { contact: ContactPage }) {
  const { reveal } = useReveal();
  const cta = contact.cta;

  return (
    // Generous below: the card and the footer are both teal, and without the gap
    // the white between them reads as a seam rather than as space.
    <section className="px-6 pb-28 pt-6 sm:pb-32 lg:px-8">
      <motion.div
        {...reveal}
        className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] bg-[var(--film-band)] px-8 py-16 text-center text-[var(--ink)] sm:px-16"
      >
        <div className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full bg-white/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-12 h-72 w-72 rounded-full bg-[var(--primary-dark)]/20 blur-3xl" />

        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-balance text-3xl font-semibold leading-[1.15] md:text-4xl">
            {text(cta?.heading, "Your next favourite accessory starts with a conversation.")}
          </h2>
          {cta?.body && (
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-[var(--ink)]/75">{cta.body}</p>
          )}

          <CmsLink
            href={cta?.buttonHref}
            fallbackHref={`#${FORM_ID}`}
            className="group mt-9 inline-flex items-center gap-2.5 rounded-full bg-white px-8 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-foreground shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:text-primary hover:shadow-xl"
          >
            {text(cta?.buttonLabel, "Start a conversation")}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </CmsLink>
        </div>
      </motion.div>
    </section>
  );
}
