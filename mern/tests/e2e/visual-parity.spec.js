import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const checkpoints = [
  { name: "home", qa: "/index.html", app: "/" },
  { name: "flights", qa: "/services.html", app: "/services.html" },
  { name: "hotels", qa: "/hotels.html", app: "/hotels.html" },
  { name: "visa", qa: "/visa.html", app: "/visa.html" },
  { name: "packages", qa: "/packages.html", app: "/packages.html" },
  { name: "package-detail", qa: "/package-details.html?id=bali-discovery", app: "/package-details.html?id=bali-discovery" }
];

test("capture QA and React visual checkpoints at the same desktop viewport", async ({ page }) => {
  await mkdir("test-results/visual",{recursive:true});
  await page.setViewportSize({width:1440,height:900});
  await page.route("https://*.supabase.co/**",route=>route.abort());
  for (const item of checkpoints) {
    await page.goto("http://127.0.0.1:3001"+item.qa,{waitUntil:"domcontentloaded"});
    await page.waitForTimeout(250);
    await page.screenshot({path:"test-results/visual/qa-"+item.name+".png",fullPage:true,animations:"disabled"});
    await page.goto(item.app,{waitUntil:"domcontentloaded"});
    await page.waitForTimeout(250);
    await page.screenshot({path:"test-results/visual/react-"+item.name+".png",fullPage:true,animations:"disabled"});
  }
  await expect(page.locator("header.site-header")).toBeVisible();
});
