import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Account — Kailo" }] }),
  component: () => (
    <SiteLayout>
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">Account coming soon</h1>
        <p className="mt-3 text-sm text-muted-foreground">Available once authentication is enabled.</p>
        <Link to="/" className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">
          Home
        </Link>
      </div>
    </SiteLayout>
  ),
});
