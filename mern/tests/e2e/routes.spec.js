import { test, expect } from "@playwright/test";

const routes = [
  "/", "/index.html", "/about.html", "/services.html", "/hotels.html", "/visa.html",
  "/packages.html", "/package-details.html?id=bali-discovery",
  "/destination.html", "/tour.html", "/trip-enquiry.html", "/contact.html",
  "/blog.html", "/gallery.html", "/guides.html", "/testimonial.html",
  "/privacy.html", "/terms.html", "/404.html", "/login.html", "/register.html", "/forgot-password.html", "/reset-password.html",
  "/destinations/bali-tour-packages.html", "/destinations/dubai-tour-packages.html",
  "/destinations/europe-tour-packages.html", "/destinations/goa-tour-packages.html",
  "/destinations/kashmir-tour-packages.html", "/destinations/kerala-tour-packages.html",
  "/destinations/malaysia-tour-packages.html", "/destinations/maldives-tour-packages.html",
  "/destinations/singapore-tour-packages.html", "/destinations/thailand-tour-packages.html",
  "/destinations/vietnam-tour-packages.html"
];

for (const route of routes) {
  test(`route renders without server error: ${route}`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response?.status(), route).toBeLessThan(500);
    await expect(page.locator("header.site-header")).toBeVisible();
    await expect(page.locator("footer.site-footer")).toBeVisible();
    await expect(page.locator("main")).toHaveCount(1);
  });
}

test("package details include the nearby attractions section", async ({ page }) => {
  await page.goto("/package-details.html?id=bali-discovery");
  await expect(page.getByRole("heading", { name: /Explore Attractions Nearby/i })).toBeVisible();
  await expect(page.locator("#attractionsStatus")).toBeVisible();
});

test("homepage destination filters, tour tabs and package search work", async ({ page }) => {
  await page.goto("/");
  await page.locator("#homeDestination").fill("Bali");
  await page.getByRole("button",{name:"Search",exact:true}).click();
  await expect(page).toHaveURL(/packages\.html\?search=Bali/);
  await expect(page.locator("#packageSearch")).toHaveValue("Bali");
  await page.goto("/");
  await page.getByRole("button",{name:"Canada",exact:true}).click();
  await expect(page.locator(".home-destination-card")).toHaveCount(2);
  await expect(page.getByText("Toronto")).toBeVisible();
  await page.getByRole("button",{name:"International Tour Category"}).click();
  await expect(page.locator(".home-tour-card").getByText("Bali Discovery")).toBeVisible();
});

test("protected dashboard sends signed-out visitor to sign in", async ({ page }) => {
  await page.goto("/dashboard.html");
  await expect(page).toHaveURL(/login\.html/);
});

test("flight search supports a round-trip selection and review", async ({ page }) => {
  await page.goto("/services.html");
  await page.locator("#origin").fill("New Delhi (DEL)");
  await page.locator("#destination").fill("Mumbai (BOM)");
  await page.getByRole("button", { name: /find flights/i }).click();
  await page.getByRole("button", { name: /select this departure flight/i }).first().click();
  await page.getByRole("button", { name: /select this return flight/i }).first().click();
  await expect(page.getByRole("heading", { name: /review & save/i })).toBeVisible();
  await expect(page.locator(".flight-price-breakdown").getByText(/Demo estimate only/i)).toBeVisible();
});

test("hotel search filters sample stays and renders a price breakdown", async ({ page }) => {
  await page.goto("/hotels.html");
  await page.locator("#hotelDestination").fill("Goa");
  await page.locator("#checkout").fill("2027-02-04");
  await page.locator("#hotelSearchForm button[type=submit][value=search]").click();
  await expect(page.getByText("Seabreeze Resort & Spa")).toBeVisible();
  await expect(page.getByText(/taxes \(12%\)/i).first()).toBeVisible();
});

test("package filters and gallery lightbox are interactive", async ({ page }) => {
  await page.goto("/packages.html");
  await page.locator("#packageSearch").fill("Bali");
  await expect(page.getByText("Bali Discovery")).toBeVisible();
  await expect(page.getByText("Kashmir Escape")).toHaveCount(0);
  await page.goto("/gallery.html");
  await page.locator(".gallery-grid .gallery-tile").first().click();
  await expect(page.getByRole("dialog", { name: "Travel photo viewer" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("mobile layouts do not introduce horizontal overflow on key service pages", async ({ page }) => {
  for (const route of ["/", "/services.html", "/hotels.html", "/visa.html", "/packages.html", "/contact.html"]) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
    expect(overflow, route).toBe(false);
  }
});
