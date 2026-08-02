/**
 * Captures the CMS into the frontend so the site can be deployed without one.
 *
 *     node scripts/snapshot-cms.mjs            # reads VITE_STRAPI_URL, or :1338
 *     CMS=http://localhost:1337 node scripts/snapshot-cms.mjs
 *
 * Writes two things, both committed:
 *
 *   • `src/lib/cms-snapshot/*.json` — one raw `{ data, meta }` envelope per
 *     endpoint, exactly as Strapi returned it. `strapi.ts` serves these instead
 *     of fetching whenever VITE_STRAPI_URL is unset.
 *   • `public/uploads/**` — every image those payloads reference, copied out of
 *     the CMS's own upload folder. Media URLs in the payloads are root-relative
 *     (`/uploads/foo.png`), so once the files sit in `public/` the site's own
 *     origin serves them and the payloads need no rewriting.
 *
 * Re-run it whenever the seeded content changes. It is a build-time tool, never
 * imported by the app.
 */

import { mkdir, writeFile, copyFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontend = path.join(here, "..");
const uploadsSource = path.join(frontend, "..", "cms", "public", "uploads");
const snapshotDir = path.join(frontend, "src", "lib", "cms-snapshot");
const uploadsTarget = path.join(frontend, "public", "uploads");

const CMS = (process.env.CMS ?? process.env.VITE_STRAPI_URL ?? "http://localhost:1338").replace(
  /\/+$/,
  "",
);

/**
 * `file` is the snapshot name; `query` must match what `queries.ts` sends, or the
 * snapshot would differ from the live payload in sort order or page size.
 */
const ENDPOINTS = [
  { file: "global", query: "/global" },
  { file: "categories", query: "/categories?sort=order:asc" },
  {
    file: "products",
    query: "/products?sort[0]=category.order:asc&sort[1]=id:asc&pagination[pageSize]=100",
  },
  { file: "gallery-images", query: "/gallery-images?sort=order:asc&pagination[pageSize]=100" },
  { file: "home-page", query: "/home-page" },
  { file: "about-page", query: "/about-page" },
  { file: "contact-page", query: "/contact-page" },
];

const main = async () => {
  if (!existsSync(uploadsSource)) {
    throw new Error(`No CMS uploads at ${uploadsSource} — is cms checked out?`);
  }

  console.log(`snapshotting ${CMS}`);
  await mkdir(snapshotDir, { recursive: true });

  const payloads = [];

  for (const { file, query } of ENDPOINTS) {
    const res = await fetch(`${CMS}/api${query}`);
    if (!res.ok) {
      throw new Error(`${query} → ${res.status}. Is the CMS running and seeded?`);
    }

    const body = await res.text();
    payloads.push(body);
    await writeFile(path.join(snapshotDir, `${file}.json`), `${body}\n`, "utf8");
    console.log(`  ${file}.json  ${(body.length / 1024).toFixed(1)} KB`);
  }

  // Every distinct /uploads/... path across all payloads, derivatives included.
  const referenced = [
    ...new Set(payloads.join("").match(/\/uploads\/[A-Za-z0-9_\-.]+/g) ?? []),
  ].map((url) => url.replace(/^\/uploads\//, ""));

  // Rebuilt from scratch so an image dropped in the CMS does not linger here.
  await rm(uploadsTarget, { recursive: true, force: true });
  await mkdir(uploadsTarget, { recursive: true });

  let bytes = 0;
  const missing = [];

  for (const name of referenced) {
    const from = path.join(uploadsSource, name);
    if (!existsSync(from)) {
      missing.push(name);
      continue;
    }
    await copyFile(from, path.join(uploadsTarget, name));
    bytes += (await import("node:fs")).statSync(from).size;
  }

  console.log(
    `  public/uploads  ${referenced.length - missing.length} files  ${(bytes / 1024 / 1024).toFixed(1)} MB`,
  );

  if (missing.length) {
    console.warn(`  ${missing.length} referenced file(s) missing: ${missing.join(", ")}`);
  }
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
