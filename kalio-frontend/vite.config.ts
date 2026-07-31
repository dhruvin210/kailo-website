import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import viteReact from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

// Deploy target: Vercel. Nitro builds the Vercel Build Output API layout under
// `.vercel/output` (which Vercel auto-detects). The preset can be overridden at
// build time via NITRO_PRESET.
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
        preset: process.env.NITRO_PRESET ?? "vercel",
        output: {
          dir: ".vercel/output",
          serverDir: ".vercel/output/functions/__server.func",
          publicDir: ".vercel/output/static",
        },
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
