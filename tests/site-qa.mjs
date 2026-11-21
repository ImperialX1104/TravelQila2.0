import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mime = { ".html":"text/html", ".css":"text/css", ".js":"text/javascript", ".json":"application/json", ".png":"image/png", ".jpg":"image/jpeg", ".jpeg":"image/jpeg", ".webp":"image/webp", ".svg":"image/svg+xml", ".woff":"font/woff", ".woff2":"font/woff2", ".ico":"image/x-icon" };

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes:true });
  const out = [];
  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) out.push(full);
  }
  return out;
}

const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const requested = path.resolve(root, "." + pathname);
    if (requested !== root && !requested.startsWith(root + path.sep)) throw new Error("Invalid path");
    let target = requested;
    if ((await stat(target).catch(()=>null))?.isDirectory()) target = path.join(target, "index.html");
    const body = await readFile(target);
    res.writeHead(200, { "content-type": mime[path.extname(target).toLowerCase()] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});

await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless:true });
const failures = [];
const pages = (await walk(root)).sort();

try {
  for (const file of pages) {
    const route = "/" + path.relative(root, file).split(path.sep).join("/");
    const page = await browser.newPage({ viewport:{ width:1440, height:900 } });
    const runtimeErrors = [];
    page.on("pageerror", error => runtimeErrors.push(error.message));
    const response = await page.goto(base + route, { waitUntil:"domcontentloaded" });
    if (!response || response.status() !== 200) failures.push(`${route}: page returned ${response?.status() ?? "no response"}`);

    const references = await page.evaluate(() => {
      const values = [];
      for (const node of document.querySelectorAll("a[href], img[src], script[src], link[rel='stylesheet'][href], source[src]")) {
        const raw = node.getAttribute("href") || node.getAttribute("src");
        if (!raw || raw.startsWith("#") || /^(mailto:|tel:|javascript:|data:)/i.test(raw)) continue;
        const url = new URL(raw, location.href);
        if (url.origin !== location.origin) continue;
        values.push({ url:url.href, tag:node.tagName, raw });
      }
      return [...new Map(values.map(x => [x.url, x])).values()];
    });

    for (const ref of references) {
      const check = await page.request.get(ref.url);
      if (!check.ok()) failures.push(`${route}: broken local ${ref.tag.toLowerCase()} reference ${ref.raw} (HTTP ${check.status()})`);
    }

    await page.setViewportSize({ width:390, height:844 });
    await page.waitForTimeout(100);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
    if (overflow) failures.push(`${route}: horizontal overflow at 390px viewport`);
    if (runtimeErrors.length) failures.push(...runtimeErrors.map(e => `${route}: uncaught browser error: ${e}`));
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}

console.log(`Checked ${pages.length} HTML pages.`);
if (failures.length) {
  console.error(`Found ${failures.length} QA failure(s):\n- ${failures.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log("All automated page, local-reference, runtime-error and mobile-overflow checks passed.");
}
