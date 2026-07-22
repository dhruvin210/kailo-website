import { Link } from "@tanstack/react-router";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link
      to="/"
      className="flex items-center gap-3"
      aria-label="Kailo home"
    >
      <svg viewBox="0 0 40 40" className="h-9 w-9" aria-hidden="true">
        <circle cx="20" cy="20" r="20" fill="var(--primary)" />
        <path
          d="M13 25c0-6 4-10 10-10 3 0 5 2 5 4.5S26 24 23 24c-1.5 0-2.5-1-2.5-2.2 0-1.2 1-2.3 2.3-2.3"
          stroke="white"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="13" cy="25" r="1.8" fill="white" />
      </svg>

      <span
        className="text-3xl font-bold tracking-tight"
        style={{
          fontFamily: '"Playfair Display", serif',
          color: "var(--primary)",
        }}
      >
        Kailo
      </span>
    </Link>
  );
}