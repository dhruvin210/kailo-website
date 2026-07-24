import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Kailo" },
      { name: "description", content: "Sign in to your Kailo account." },
    ],
  }),
  component: () => (
    <SiteLayout>
      <div className="mx-auto max-w-md px-4 py-24">
        <div className="rounded-3xl border border-border bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-semibold">Accounts coming soon</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Login, signup and order history will arrive in the next phase once the backend is enabled.
          </p>
          <Link
            to="/products"
            className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-[var(--primary-dark)]"
          >
            Keep shopping
          </Link>
        </div>
      </div>
    </SiteLayout>
  ),
});
