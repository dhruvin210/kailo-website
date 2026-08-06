import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import viteReact from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

/**
 * Response headers applied to every document, plus the caching rules Nitro's
 * static file server does not write on its own.
 *
 * Both asset rules are explicit here because the `node-server` preset serves
 * `.output/public` itself and applies no caching policy of its own — unlike the
 * CDN presets, which infer one. `/assets/**` is the build's own hashed output;
 * `/uploads/**` is where every image on the site lives in static-snapshot mode,
 * ~80 MB of it. Both carry a content hash in the file name
 * (`hero1_c7087b304a.webp`), so a changed image is a changed URL and a year of
 * `immutable` is safe.
 *
 * The security headers are the non-breaking set. A Content-Security-Policy is
 * deliberately NOT here: TanStack Start inlines its hydration script, so a
 * useful policy needs per-response nonces rather than a static header, and a
 * wrong one takes the site down rather than degrading. Add it as a deliberate
 * piece of work, not as a default.
 *
 * `Strict-Transport-Security` omits `includeSubDomains` on purpose — the CMS is
 * expected to live on a subdomain, and forcing HTTPS on it from here would break
 * it before its certificate exists.
 */
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  "Strict-Transport-Security": "max-age=31536000",
} as const;

const IMMUTABLE = { "cache-control": "public, max-age=31536000, immutable" };

const routeRules = {
  "/**": { headers: { ...SECURITY_HEADERS } },
  "/assets/**": { headers: { ...IMMUTABLE } },
  "/uploads/**": { headers: { ...IMMUTABLE } },
};

// Deploy target: a container. Nitro's `node-server` preset builds a
// self-contained Node server under `.output` — `.output/server/index.mjs` is the
// entrypoint and `.output/public` the static root — which is what
// frontend/Dockerfile runs. Its dependencies are bundled, so the runtime image
// carries no node_modules.
//
// The output paths are Nitro's defaults and are deliberately not overridden:
// pinning them is what tied the previous build to one host. Another preset can
// still be selected at build time with NITRO_PRESET, and will lay out `.output`
// however that target expects.
export default defineConfig(async ({ command, mode }) => {
  const plugins = [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
      // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
      server: { entry: "server" },
    }),
  ];

  // Nitro only produces the deploy output during `vite build`.
  if (command === "build") {
    const { nitro } = await import("nitro/vite");
    plugins.push(
      nitro({
        preset: process.env.NITRO_PRESET ?? "node-server",
        routeRules,
      }),
    );
  }

  plugins.push(viteReact());

  // Expose VITE_*-prefixed env vars via import.meta.env (client + SSR bundles).
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const define: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    define[`import.meta.env.${key}`] = JSON.stringify(value);
  }

  // Always defined, so `CMS_IS_STATIC` in lib/strapi.ts is a build-time constant
  // rather than a runtime lookup — which lets the unused branch tree-shake, and
  // makes "no CMS configured" mean the snapshot rather than an undefined origin.
  define["import.meta.env.VITE_STRAPI_URL"] ??= JSON.stringify("");

  return {
    define,
    server: { host: "::", port: 8080 },
    resolve: {
      alias: {
        "@": `${process.cwd()}/src`,
      },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    plugins,
  };
});
