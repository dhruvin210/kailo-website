import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  ChevronDown,
  Navigation,
  ArrowRight,
} from "lucide-react";

import { SiteLayout } from "@/components/SiteLayout";
import workbenchImg from "@/assets/lifestyle/workbench.png";
import artisanImg from "@/assets/lifestyle/artisan.png";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Kailo" },
      {
        name: "description",
        content:
          "Get in touch with Kailo. Support, wholesale, press — we'd love to hear from you.",
      },
      { property: "og:title", content: "Contact Kailo" },
      { property: "og:description", content: "Get in touch with our team." },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: Contact,
});

const schema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Please enter a valid email"),
  subject: z.enum(["General Inquiry", "Order Support", "Wholesale", "Press"]),
  message: z.string().min(20, "Message should be at least 20 characters"),
});
type FormValues = z.infer<typeof schema>;

const DETAILS = [
  { Icon: Mail, label: "Email", value: "hello@kailo.com" },
  { Icon: Phone, label: "Phone", value: "+1 (800) KAILO-01" },
  { Icon: MapPin, label: "Address", value: "123 Music Lane, Nashville, TN" },
  { Icon: Clock, label: "Hours", value: "Mon–Fri 9AM–6PM EST" },
];

const FAQS = [
  { q: "What's your return policy?", a: "30-day no-questions-asked returns on unused products." },
  { q: "Do you ship internationally?", a: "Yes — we ship to 40+ countries in 3-7 business days." },
  { q: "Are products covered by warranty?", a: "Every Kailo product carries a 2-year manufacturing warranty." },
  { q: "Do you offer wholesale pricing?", a: "Yes. Email wholesale@kailo.com for our trade catalogue." },
  { q: "Can I track my order?", a: "You'll receive a tracking link by email as soon as it ships." },
];

/** Shared scroll-reveal defaults — matches the homepage. */
const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const fieldBase =
  "w-full rounded-full border bg-[var(--bg-soft)] px-5 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:bg-card";

function Contact() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { subject: "General Inquiry" },
  });

  const onSubmit = async (data: FormValues) => {
    await new Promise((r) => setTimeout(r, 600));
    toast.success("Thanks! We'll be in touch shortly.");
    reset();
    void data;
  };

  const borderFor = (invalid: boolean) =>
    invalid ? "border-destructive" : "border-border focus:border-primary";

  return (
    <SiteLayout>
      {/* ───────────────────────── HEADER ──────────────────────── */}
      <section className="relative flex h-[70vh] min-h-[520px] items-center overflow-hidden bg-black">
        {/* Full-bleed workshop hero */}
        <img
          src={workbenchImg}
          alt="The Kailo workshop bench in Nashville"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Legibility grade — dark on the left where the text sits */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/25" />

        <motion.div
          {...reveal}
          className="relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-8"
        >
          <div className="max-w-2xl text-white">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              Contact
            </p>
            <h1 className="text-4xl font-semibold md:text-6xl">Let's talk</h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/90">
              Questions, partnerships, press — drop us a line and we'll get back
              within one business day.
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
                  <option>General Inquiry</option>
                  <option>Order Support</option>
                  <option>Wholesale</option>
                  <option>Press</option>
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
                  !!errors.message
                )}`}
              />
              {errors.message && (
                <p id="message-error" className="mt-1.5 text-xs text-destructive">
                  {errors.message.message}
                </p>
              )}
            </div>

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
            {DETAILS.map(({ Icon, label, value }) => (
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
            ))}

            {/* Workshop block */}
            <div className="relative overflow-hidden rounded-3xl border border-border bg-[var(--bg-soft)]">
              {/* Our Nashville workshop */}
              <img
                src={artisanImg}
                alt="A Kailo craftsperson hand-stitching leather at the Nashville workshop"
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
              {/* Address overlay */}
              <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/90 px-4 py-3 backdrop-blur">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Find us
                  </p>
                  <p className="text-sm font-medium">Nashville, TN</p>
                </div>
                <a
                  href="https://maps.google.com/?q=Nashville,TN"
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

      {/* ─────────────────────────── FAQ ────────────────────────── */}
      <section className="bg-[var(--bg-soft)] py-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <motion.div {...reveal} className="mb-12 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              Good to know
            </p>
            <h2 className="text-4xl font-semibold md:text-5xl">
              Frequently asked
            </h2>
          </motion.div>

          <div className="space-y-3">
            {FAQS.map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={f.q}
                  className="overflow-hidden rounded-3xl border border-border bg-card"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq((o) => (o === i ? null : i))}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-medium"
                  >
                    {f.q}
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-primary transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <p className="px-6 pb-5 leading-relaxed text-muted-foreground">
                          {f.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────────── CTA ────────────────────────── */}
      <section className="px-6 py-24 lg:px-8">
        <motion.div
          {...reveal}
          className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary to-[var(--primary-dark)] px-8 py-16 text-center text-white shadow-2xl md:px-16 md:py-20"
        >
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-black/10 blur-3xl" />

          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold md:text-4xl">
              Prefer to talk it through?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/85">
              Our team is around Monday to Friday, 9AM–6PM EST. Call us or drop
              an email — a real person will always reply.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href="mailto:hello@kailo.com"
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 font-semibold text-primary transition hover:bg-white/90"
              >
                <Mail className="h-4 w-4" />
                hello@kailo.com
              </a>
              <a
                href="tel:+18005245601"
                className="inline-flex items-center gap-2 rounded-full border border-white/60 px-8 py-4 font-semibold text-white backdrop-blur transition hover:bg-white hover:text-primary"
              >
                <Phone className="h-4 w-4" />
                Call us
              </a>
            </div>
          </div>
        </motion.div>
      </section>
    </SiteLayout>
  );
}
