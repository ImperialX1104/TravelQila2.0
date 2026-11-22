import { test, expect } from "@playwright/test";

const future = days => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

test("flight form preserves QA round-trip, one-way, saved recheck and query contracts", async ({ page }) => {
  await page.goto("/services.html");
  await page.locator("#origin").fill("New Delhi (DEL)");
  await page.locator("#destination").fill("Mumbai (BOM)");
  await page.locator("#departDate").fill(future(7));
  await page.locator("#returnDate").fill(future(10));
  await page.locator("#flightSearchForm button[type=submit][value=search]").click();
  await expect(page.locator("#flightResults")).toBeVisible();
  await expect(page.locator(".flight-result-card")).toHaveCount(8);
  const outbound = page.locator('.flight-result-card [data-select-leg="outbound"]');
  await expect(outbound).toHaveCount(8);
  await outbound.first().click();
  await expect(page.locator("#resultRoute")).toContainText("return flight");
  await expect(page.locator('.flight-result-card [data-select-leg="return"]')).toHaveCount(8);
  const routeCities = await page.locator(".flight-result-card").first().locator(".flight-city").allTextContents();
  expect(routeCities[0]).toContain("Mumbai");
  expect(routeCities[1]).toContain("New Delhi");
  await page.locator('.flight-result-card [data-select-leg="return"]').first().click();
  await expect(page.locator(".tq-summary-leg")).toHaveCount(2);
  await expect(page.locator(".tq-price-breakdown")).toContainText("Estimated taxes");
  await expect(page.locator("[data-save-wishlist]")).toHaveCount(1);
  await expect(page.locator("[data-book-itinerary]")).toHaveCount(1);
  await expect(page.locator("[data-share-itinerary]")).toHaveCount(2);

  await page.locator('input[name="tripType"][value="One way"]').check();
  await expect(page.locator("#returnDate")).not.toHaveAttribute("required");
  await page.locator("#flightSearchForm button[type=submit][value=search]").click();
  await page.locator('.flight-result-card [data-select-leg="outbound"]').first().click();
  await expect(page.locator(".tq-summary-leg")).toHaveCount(1);
  await expect(page.locator(".tq-summary-leg-title")).not.toContainText("Return");
  await expect(page.locator("[data-save-wishlist]")).toHaveCount(1);
  await expect(page.locator("[data-book-itinerary]")).toHaveCount(1);
  await expect(page.locator("[data-share-itinerary]")).toHaveCount(2);

  const savedUrl = "/services.html?origin=New%20Delhi%20(DEL)&destination=Mumbai%20(BOM)&tripType=Round%20trip&departureDate="+future(12)+"&returnDate="+future(16)+"&adults=2&children=0&infants=0&cabin=Economy&wishlistId=sample-saved-id";
  await page.goto(savedUrl);
  await expect(page.locator("#origin")).toHaveValue("New Delhi (DEL)");
  await expect(page.locator("#destination")).toHaveValue("Mumbai (BOM)");
  await expect(page.locator('input[name="tripType"][value="Round trip"]')).toBeChecked();
  await expect(page.locator("#returnDate")).toHaveValue(future(16));
  await page.locator("#flightSearchForm button[type=submit][value=search]").click();
  await page.locator('.flight-result-card [data-select-leg="outbound"]').first().click();
  await page.locator('.flight-result-card [data-select-leg="return"]').first().click();
  await expect(page.locator("[data-save-wishlist]")).toContainText("Update saved trip");

  const queryUrl = "/services.html?tripType=Round+trip&origin=Chennai+(MAA)&destination=New+Delhi+(DEL)&departureDate="+future(20)+"&returnDate="+future(28)+"&cabin=Economy&adults=1&children=0&infants=0&stops=Non-stop+only&maximumBudget=50000&dateFlexibility=1+day+before+or+after&additionalPreferences=Window+seat";
  await page.goto(queryUrl);
  await expect(page.locator("#flightResults")).toBeVisible();
  await expect(page.locator("#origin")).toHaveValue("Chennai (MAA)");
  await expect(page.locator("#destination")).toHaveValue("New Delhi (DEL)");
  await expect(page.locator("#stops")).toHaveValue("Non-stop only");
  await expect(page.locator("#maxPrice")).toHaveValue("50000");
  await expect(page.locator("#flexibility")).toHaveValue("1 day before or after");
  await expect(page.locator("#notes")).toHaveValue("Window seat");
  await expect(page.locator(".flight-result-card")).toHaveCount(5);
  await expect(page.locator(".flight-result-card .flight-flight-number").filter({ hasNotText: "Non-stop" })).toHaveCount(0);
});

test("hotel and visa pages preserve QA enquiry field and handoff contracts", async ({ page }) => {
  await page.goto("/hotels.html");
  await expect(page.locator('form[data-service="hotel booking"]')).toHaveCount(1);
  for (const id of ["hotelDestination","checkin","checkout","hotelRooms","hotelAdults","hotelCategory"]) {
    await expect(page.locator("#"+id)).toHaveCount(1);
  }
  await expect(page.locator('button[type="submit"][value="whatsapp"]')).toHaveCount(1);
  await expect(page.locator('button[type="submit"][value="email"]')).toHaveCount(1);

  await page.goto("/visa.html");
  await expect(page.locator('form[data-service="visa assistance"]')).toHaveCount(1);
  for (const id of ["visaCountry","visaNationality","visaPurpose","visaTravelDate","visaApplicants"]) {
    await expect(page.locator("#"+id)).toHaveCount(1);
  }
  await expect(page.locator('button[type="submit"][value="whatsapp"]')).toHaveCount(1);
  await expect(page.locator('button[type="submit"][value="email"]')).toHaveCount(1);
});
