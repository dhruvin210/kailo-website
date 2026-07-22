import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Heart, Sparkles, Globe } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Kailo" },
      { name: "description", content: "Kailo was founded by musicians, for musicians. Learn our story, mission and the team behind every accessory." },
      { property: "og:title", content: "About Kailo" },
      { property: "og:description", content: "Founded by musicians, for musicians." },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: About,
});

function About() {
  return (
    <SiteLayout>
      <section className="relative h-[60vh] min-h-[420px] w-full overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1800&q=80"
          alt="Studio"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70" />
        <div className="relative z-10 mx-auto flex h-full max-w-4xl flex-col items-center justify-center px-4 text-center text-white">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/80">Our Story</p>
          <h1 className="mt-4 text-5xl font-semibold sm:text-6xl">Built for the moments that matter</h1>
        </div>
      </section>

      <section className="bg-background py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
          <div>
            <h2 className="text-3xl font-semibold sm:text-4xl">Founded by musicians, for musicians.</h2>
            <p className="mt-5 text-muted-foreground">
              Kailo started in a Nashville garage in 2020 with a simple belief: every accessory should
              be as thoughtful as the instrument it serves. We obsess over the small things — the
              stitching on a strap, the lining of a case, the click of a capo — so you can stay in
              the music.
            </p>
            <p className="mt-4 text-muted-foreground">
              Today our gear travels with touring artists, bedroom songwriters and conservatory
              students in over forty countries. Same obsession, same workshop.
            </p>
          </div>
          <img
            src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80"
            alt="Workshop"
            className="aspect-[4/5] w-full rounded-3xl object-cover"
          />
        </div>
      </section>

      <section className="bg-[var(--bg-soft)] py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-3xl font-semibold sm:text-4xl">Mission & values</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { Icon: Heart, title: "Made with care", body: "Every product is hand-checked before it ships." },
              { Icon: Sparkles, title: "Materials matter", body: "Full-grain leather, real brass, recycled fabrics." },
              { Icon: Globe, title: "For the long haul", body: "Repair-friendly designs that age beautifully." },
            ].map(({ Icon, title, body }) => (
              <div key={title} className="rounded-2xl bg-white p-6 shadow-sm">
                <Icon className="h-7 w-7 text-primary" />
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-3xl font-semibold sm:text-4xl">Meet the team</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: "Aria Chen", r: "Founder & CEO" },
              { n: "Marcus Reid", r: "Head of Design" },
              { n: "Jules Park", r: "Master Leatherworker" },
              { n: "Sam Okafor", r: "Engineering Lead" },
            ].map((m) => (
              <div key={m.n} className="text-center">
                <div className="mx-auto aspect-square w-full max-w-[200px] rounded-full bg-gradient-to-br from-primary/20 to-primary/5" />
                <h3 className="mt-4 font-semibold">{m.n}</h3>
                <p className="text-sm text-muted-foreground">{m.r}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--bg-soft)] py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-3xl font-semibold sm:text-4xl">Milestones</h2>
          <ol className="relative space-y-10 border-l-2 border-primary/30 pl-8">
            {[
              { y: "2020", t: "Founded in a Nashville garage" },
              { y: "2021", t: "First leather strap collection" },
              { y: "2022", t: "International shipping launches" },
              { y: "2023", t: "100,000 musicians served" },
            ].map((m) => (
              <li key={m.y} className="relative">
                <span className="absolute -left-[42px] flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                  ●
                </span>
                <p className="text-sm font-semibold text-primary">{m.y}</p>
                <p className="mt-1 text-lg">{m.t}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </SiteLayout>
  );
}
