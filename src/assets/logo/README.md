# Logo assets

Save the Kailo logo here as:

- `kailo-logo.png` — the primary logo (teal wave-in-circle + "Kailo" wordmark on transparent/white).

This single file is used everywhere:

- **Navbar** — shown as-is (teal on the white header).
- **Footer** — the same file is rendered white via a CSS `brightness-0 invert` filter,
  so it reads cleanly on the teal footer background. No separate white file needed.

If you'd rather ship a dedicated white/glow variant for the footer instead of the CSS
filter, add `kailo-logo-white.png` here and update `src/components/Logo.tsx`.
