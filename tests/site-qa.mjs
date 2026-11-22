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

    if (route === "/dashboard.html") {
      const hasBookings = await page.locator("[data-bookings-list]").count();
      if (hasBookings !== 1) failures.push(`${route}: customer bookings panel is missing`);
      if (await page.locator("[data-wishlist-list]").count() !== 1) failures.push(`${route}: saved flights panel is missing`);
      if (await page.locator("a[href=\"#wishlist\"]").count() !== 1) failures.push(`${route}: saved flights navigation is missing`);
      const navBg = await page.locator(".navbar").evaluate(el => getComputedStyle(el).backgroundColor);
      if (navBg === "rgba(0, 0, 0, 0)" || navBg === "transparent") failures.push(`${route}: dashboard navbar has no solid background`);
      if (await page.locator(".footer").count() !== 1) failures.push(`${route}: shared site footer is missing`);
    }

    if (route === "/services.html") {
      try {
        await page.setViewportSize({ width:1440, height:900 });
        const future = days => {
          const date = new Date();
          date.setDate(date.getDate() + days);
          return date.toISOString().slice(0,10);
        };
        await page.locator("#origin").fill("New Delhi (DEL)");
        await page.locator("#destination").fill("Mumbai (BOM)");
        await page.locator("#departDate").fill(future(7));
        await page.locator("#returnDate").fill(future(10));
        await page.locator("#flightSearchForm button[type=submit]").click();
        await page.locator("#flightResults").waitFor({ state:"visible" });
        const initialCards = await page.locator(".flight-result-card").count();
        if (initialCards !== 8) failures.push(`${route}: expected 8 outbound demo flight cards, received ${initialCards}`);
        const outboundButtons = page.locator('.flight-result-card [data-select-leg="outbound"]');
        if (await outboundButtons.count() !== 8) failures.push(`${route}: each outbound option must have a selection action`);
        await outboundButtons.first().click();
        const returnHeading = await page.locator("#resultRoute").textContent();
        if (!returnHeading.includes("return flight")) failures.push(`${route}: selecting outbound did not open return-flight selection`);
        const returnCards = await page.locator('.flight-result-card [data-select-leg="return"]').count();
        if (returnCards !== 8) failures.push(`${route}: round trip must offer separate return-flight choices`);
        const returnRoute = await page.locator(".flight-result-card").first().locator(".flight-city").allTextContents();
        if (!returnRoute[0]?.includes("Mumbai") || !returnRoute[1]?.includes("New Delhi")) failures.push(`${route}: return route must reverse Mumbai to Delhi`);
        await page.locator('.flight-result-card [data-select-leg="return"]').first().click();
        if (await page.locator(".tq-summary-leg").count() !== 2) failures.push(`${route}: round-trip review must include both selected legs`);
        if (!(await page.locator(".tq-price-breakdown").innerText()).includes("Estimated taxes")) failures.push(`${route}: itinerary review must show estimated taxes`);
        if (await page.locator("[data-save-wishlist]").count() !== 1 || await page.locator("[data-book-itinerary]").count() !== 1) failures.push(`${route}: review must provide booking and wishlist actions`);

        await page.locator('input[name="tripType"][value="One way"]').check();
        const returnRequired = await page.locator("#returnDate").evaluate(el => el.required);
        if (returnRequired) failures.push(`${route}: return date remained required for one-way search`);
        await page.locator("#flightSearchForm button[type=submit]").click();
        await page.locator('.flight-result-card [data-select-leg="outbound"]').first().click();
        if (await page.locator(".tq-summary-leg").count() !== 1) failures.push(`${route}: one-way review must include exactly one selected leg`);
        if (await page.locator(".tq-summary-leg-title").allTextContents().then(x => x.some(t => t.includes("Return")))) failures.push(`${route}: one-way review unexpectedly includes a return leg`);
        if (await page.locator("[data-save-wishlist]").count() !== 1 || await page.locator("[data-book-itinerary]").count() !== 1) failures.push(`${route}: one-way review must provide booking and wishlist actions`);
      } catch (error) {
        failures.push(`${route}: flight search interaction test failed: ${error.message}`);
      }
    }

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
