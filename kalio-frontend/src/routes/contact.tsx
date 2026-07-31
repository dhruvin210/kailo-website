import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ChevronDown, Navigation, ArrowRight, Mail, Phone } from "lucide-react";

import { SiteLayout } from "@/components/SiteLayout";
import { CmsLink } from "@/components/CmsLink";

import { getIcon } from "@/lib/icons";
import { contactPageQuery, type ContactPage } from "@/lib/queries";
import {
  HONEYPOT_FIELD,
  mediaAlt,
  mediaSrcSet,
  mediaUrl,
  SIZES,
  submitContactForm,
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
      "Get in touch with Kailo. Support, wholesale, press — we'd love to hear from you.";
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

/**
 * The four subjects the API accepts.
 *
 * `contactPage.formSubjects` drives the order and the subset that is offered, but
 * this tuple is what validation is built on — it has to stay in sync with the
 * server's allowlist, which falls back to "General Inquiry" for anything else.
 */
const SUBJECTS = ["General Inquiry", "Order Support", "Wholesale", "Press"] as const;

const schema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Please enter a valid email"),
  subject: z.enum(SUBJECTS),
  message: z.string().min(20, "Message should be at least 20 characters"),
  // The honeypot. Left unconstrained on purpose: a bot that fills it in should
  // reach the server, get its 200, and stop retrying — not trip a client error.
  [HONEYPOT_FIELD]: z.string().optional(),
});

type FormValues = z.output<typeof schema>;

/** Shared scroll-reveal defaults — matches the homepage. */
const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const fieldBase =
  "w-full rounded-full border bg-[var(--bg-soft)] px-5 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:bg-card";

/** CMS text with the pre-CMS copy as its fallback, for layout-bearing strings. */
const text = (value: string | null | undefined, fallback: string) => value?.trim() || fallback;

function Contact() {
  const { contact } = Route.useLoaderData();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { subject: "General Inquiry" },
  });

  const details = contact.contactDetails ?? [];

  // Only offer subjects validation will accept — an option added in the CMS without
  // the matching change here would otherwise be selectable but unsubmittable.
  const subjects = (contact.formSubjects ?? SUBJECTS).filter(
    (subject): subject is (typeof SUBJECTS)[number] =>
      (SUBJECTS as readonly string[]).includes(subject),
  );

  const onSubmit = async (values: FormValues) => {
    const result = await submitContactForm(values);

    if (!result.ok) {
      toast.error(
        result.status === 429
          ? "Too many messages just now. Please try again in a minute."
          : "Something went wrong. Please try again or email hello@kailo.com.",
      );
      return;
    }

    // Nothing is sent back automatically, so the confirmation says what will
    // actually happen rather than promising an email that never arrives.
    toast.success("Thanks! We've got your message and will get back to you shortly.");

    reset();
  };

  const borderFor = (invalid: boolean) =>
    invalid ? "border-destructive" : "border-border focus:border-primary";

  return (
    <SiteLayout>
      {/* ───────────────────────── HEADER ──────────────────────── */}
      <section className="relative flex h-[70vh] min-h-[520px] items-center overflow-hidden bg-black">
        {/* Full-bleed workshop hero */}
        <img
          src={mediaUrl(contact.heroImage)}
          srcSet={mediaSrcSet(contact.heroImage)}
          sizes={SIZES.fullWidth}
          alt={mediaAlt(contact.heroImage, "The Kailo workshop bench in Nashville")}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Legibility grade — dark on the left where the text sits */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/25" />

        <motion.div {...reveal} className="relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl text-white">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              {text(contact.heroEyebrow, "Contact")}
            </p>
            <h1 className="text-4xl font-semibold md:text-6xl">
              {text(contact.heroHeading, "Let's talk")}
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/90">
              {contact.heroSubtext}
            </p>
          </div>
        </motion.div>
      </section>

      {/* ─────────────────────── FORM + DETAILS ─────────────────── */}
      <section className="py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1.3fr_1fr] lg:px-8">
          {/* Form */}
          <motion.form
            {...reveal}
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-5 rounded-3xl border border-border bg-card p-8 shadow-sm md:p-10"
          >
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
                Name
              </label>
              <input
                id="name"
                {...register("name")}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
                placeholder="Your name"
                className={`${fieldBase} ${borderFor(!!errors.name)}`}
              />
              {errors.name && (
                <p id="name-error" className="mt-1.5 text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register("email")}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                placeholder="you@example.com"
                className={`${fieldBase} ${borderFor(!!errors.email)}`}
              />
              {errors.email && (
                <p id="email-error" className="mt-1.5 text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="subject" className="mb-1.5 block text-sm font-medium">
                Subject
              </label>
              <div className="relative">
                <select
                  id="subject"
                  {...register("subject")}
                  className={`${fieldBase} appearance-none border-border pr-11 focus:border-primary`}
                >
                  {subjects.map((subject) => (
                    <option key={subject}>{subject}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div>
              <label htmlFor="message" className="mb-1.5 block text-sm font-medium">
                Message
              </label>
              <textarea
                id="message"
                {...register("message")}
                rows={5}
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? "message-error" : undefined}
                placeholder="Tell us how we can help…"
                className={`w-full resize-none rounded-3xl border bg-[var(--bg-soft)] px-5 py-3.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:bg-card ${borderFor(
                  !!errors.message,
                )}`}
              />
              {errors.message && (
                <p id="message-error" className="mt-1.5 text-xs text-destructive">
                  {errors.message.message}
                </p>
              )}
            </div>

            {/* Honeypot — off-screen and hidden from assistive tech, so only a bot
                filling in every field will ever put anything in it. */}
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
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-60"
            >
              {isSubmitting ? "Sending…" : "Send message"}
              {!isSubmitting && (
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              )}
            </button>
          </motion.form>

          {/* Details + map */}
          <motion.div
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.1 }}
            className="space-y-4"
          >
            {details.map(({ icon, label, value }) => {
              // The CMS stores the lucide component's name, not markup.
              const Icon = getIcon(icon);

              return (
                <div
                  key={label}
                  className="group flex items-start gap-4 rounded-3xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      {label}
                    </p>
                    <p className="mt-1 font-medium">{value}</p>
                  </div>
                </div>
              );
            })}

            {/* Workshop block */}
            <div className="relative overflow-hidden rounded-3xl border border-border bg-[var(--bg-soft)]">
              {/* Our Nashville workshop */}
              <img
                src={mediaUrl(contact.workshopImage)}
                srcSet={mediaSrcSet(contact.workshopImage)}
                // Sidebar column: a third of the shell on desktop.
                sizes="(min-width: 1024px) 24rem, 100vw"
                alt={mediaAlt(
                  contact.workshopImage,
                  "A Kailo craftsperson hand-stitching leather at the Nashville workshop",
                )}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
              {/* Address overlay */}
              <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/90 px-4 py-3 backdrop-blur">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {text(contact.workshopLabel, "Find us")}
                  </p>
                  <p className="text-sm font-medium">
                    {text(contact.workshopLocation, "Nashville, TN")}
                  </p>
                </div>
                <a
                  href={contact.workshopDirectionsUrl ?? "https://maps.google.com/?q=Nashville,TN"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-[var(--primary-dark)]"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  Directions
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─────────────────────────── CTA ────────────────────────── */}
      <ClosingCta cta={contact.cta} />
    </SiteLayout>
  );
}

function ClosingCta({ cta }: { cta: ContactPage["cta"] }) {
  return (
    <section className="px-6 py-24 lg:px-8">
      <motion.div
        {...reveal}
        className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary to-[var(--primary-dark)] px-8 py-16 text-center text-white shadow-2xl md:px-16 md:py-20"
      >
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-black/10 blur-3xl" />

        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold md:text-4xl">
            {text(cta?.heading, "Prefer to talk it through?")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/85">{cta?.body}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <CmsLink
              href={cta?.buttonHref}
              fallbackHref="mailto:hello@kailo.com"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 font-semibold text-primary transition hover:bg-white/90"
            >
              <Mail className="h-4 w-4" />
              {text(cta?.buttonLabel, "hello@kailo.com")}
            </CmsLink>
            {cta?.secondaryButtonLabel && (
              <CmsLink
                href={cta.secondaryButtonHref}
                fallbackHref="tel:+18005245601"
                className="inline-flex items-center gap-2 rounded-full border border-white/60 px-8 py-4 font-semibold text-white backdrop-blur transition hover:bg-white hover:text-primary"
              >
                <Phone className="h-4 w-4" />
                {cta.secondaryButtonLabel}
              </CmsLink>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
