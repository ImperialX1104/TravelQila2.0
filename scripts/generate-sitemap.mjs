#!/usr/bin/env node
/**
 * Generate sitemap.xml from canonical, indexable HTML pages.
 *
 * Run from the repository root:
 *   node scripts/generate-sitemap.mjs
 *
 * The generator intentionally:
 * - uses each page's canonical URL (never guesses a URL from its filename);
 * - skips pages marked noindex;
 * - skips 404 pages and account pages without public canonicals;
 * - does not fabricate lastmod, changefreq or priority values.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const SITE_ORIGIN = "https://travelqila.com";
const ROOT = process.cwd();
const OUTPUT = join(ROOT, "sitemap.xml");
const SKIP_DIRS = new Set([
  ".git", "node_modules", "lib", "css", "js", "img", "scss", "supabase"
]);

async function collectHtml(directory) {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || (entry.isDirectory() && SKIP_DIRS.has(entry.name))) continue;
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...await collectHtml(fullPath));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) found.push(fullPath);
  }
  return found;
}

function getAttribute(tag, attribute) {
  const escaped = attribute.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = tag.match(new RegExp("\\b" + escaped + "\\s*=\\s*([\\"'])(.*?)\\1", "i"));
  return match?.[2]?.trim() ?? "";
}

function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

const urls = new Set();
for (const file of await collectHtml(ROOT)) {
  const relativePath = relative(ROOT, file).split(sep).join("/");
  if (relativePath === "404.html") continue;

  const html = await readFile(file, "utf8");
  const robotsTag = html.match(/<meta\b[^>]*\bname\s*=\s*["']robots["'][^>]*>/i)?.[0] ?? "";
  const robots = getAttribute(robotsTag, "content").toLowerCase();
  if (robots.split(",").map(value => value.trim()).includes("noindex")) continue;

  const canonicalTag = html.match(/<link\b(?=[^>]*\brel\s*=\s*["']canonical["'])[^>]*>/i)?.[0];
  if (!canonicalTag) continue;

  const canonical = getAttribute(canonicalTag, "href");
  if (!canonical.startsWith(SITE_ORIGIN + "/") && canonical !== SITE_ORIGIN) {
    throw new Error(`Canonical URL outside configured site origin in ${relativePath}: ${canonical}`);
  }
  urls.add(canonical);
}

const sortedUrls = [...urls].sort((a, b) => a.localeCompare(b));
if (sortedUrls.length === 0) throw new Error("No canonical, indexable HTML pages found.");

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...sortedUrls.map(url => `  <url><loc>${escapeXml(url)}</loc></url>`),
  '</urlset>',
  ''
].join("\n");

await writeFile(OUTPUT, xml, "utf8");
console.log(`Generated sitemap.xml with ${sortedUrls.length} canonical, indexable URLs.`);
