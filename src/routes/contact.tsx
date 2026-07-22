import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Clock, ChevronDown } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Kailo" },
      { name: "description", content: "Get in touch with Kailo. Support, wholesale, press — we'd love to hear from you." },
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

const FAQS = [
  { q: "What's your return policy?", a: "30-day no-questions-asked returns on unused products." },
  { q: "Do you ship internationally?", a: "Yes — we ship to 40+ countries in 3-7 business days." },
  { q: "Are products covered by warranty?", a: "Every Kailo product carries a 2-year manufacturing warranty." },
  { q: "Do you offer wholesale pricing?", a: "Yes. Email wholesale@kailo.com for our trade catalogue." },
  { q: "Can I track my order?", a: "You'll receive a tracking link by email as soon as it ships." },
];

function Contact() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { subject: "General Inquiry" } });

  const onSubmit = async (data: FormValues) => {
    await new Promise((r) => setTimeout(r, 600));
    toast.success("Thanks! We'll be in touch shortly.");
    reset();
    void data;
  };

  return (
    <SiteLayout>
      <section className="bg-[var(--bg-soft)] py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">Contact</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Let's talk</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Questions, partnerships, press — drop us a line and we'll get back within one business day.
          </p>
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 md:grid-cols-[1.3fr_1fr] lg:px-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-3xl border border-border bg-white p-8 shadow-sm">
            <div>
              <label className="text-sm font-medium">Name</label>
              <input
                {...register("name")}
                className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
              />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                {...register("email")}
                type="email"
                className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
              />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Subject</label>
              <select
                {...register("subject")}
                className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
              >
                <option>General Inquiry</option>
                <option>Order Support</option>
                <option>Wholesale</option>
                <option>Press</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <textarea
                {...register("message")}
                rows={5}
                className="mt-1 w-full resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
              />
              {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message.message}</p>}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-60"
            >
              {isSubmitting ? "Sending…" : "Send message"}
            </button>
          </form>

          <div className="space-y-4">
            {[
              { Icon: Mail, label: "Email", value: "hello@kailo.com" },
              { Icon: Phone, label: "Phone", value: "+1 (800) KAILO-01" },
              { Icon: MapPin, label: "Address", value: "123 Music Lane, Nashville, TN" },
              { Icon: Clock, label: "Hours", value: "Mon–Fri 9AM–6PM EST" },
            ].map(({ Icon, label, value }) => (
              <div key={label} className="flex items-start gap-4 rounded-2xl border border-border bg-white p-5">
                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
                  <p className="mt-1 font-medium">{value}</p>
                </div>
              </div>
            ))}
            <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <MapPin className="h-10 w-10 text-primary" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--bg-soft)] py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-center text-3xl font-semibold">Frequently asked</h2>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <div key={f.q} className="rounded-2xl border border-border bg-white">
                <button
                  onClick={() => setOpenFaq((o) => (o === i ? null : i))}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium"
                >
                  {f.q}
                  <ChevronDown className={`h-4 w-4 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <p className="px-5 pb-5 text-sm text-muted-foreground">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
