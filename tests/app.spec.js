const { test, expect } = require("@playwright/test");

async function openAt(page, date = "2026-09-28T14:08:09Z") {
  await page.clock.install({ time: new Date(date) });
  await page.goto("/");
}

test("local clock uses device time and updates without reloads", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openAt(page);
  await expect(page.locator("#local-hours")).toHaveText("02");
  await expect(page.locator("#local-minutes")).toHaveText("08");
  await expect(page.locator("#local-period")).toHaveText("PM");
  await expect(page.locator("#tanggal")).toHaveText(
    "Monday, September 28, 2026",
  );
  await page.clock.fastForward("00:01");
  await expect(page.locator("#local-seconds")).toHaveText("10");
  await page.getByRole("button", { name: "24h", exact: true }).click();
  await expect(page.locator("#local-hours")).toHaveText("14");
  await expect(page.locator("#local-period")).toBeHidden();
  await expect(page.locator("#overview-clocks .world-card")).toHaveCount(3);
  expect(errors).toEqual([]);
});

test("world times include daylight saving and fractional timezone offsets", async ({
  page,
}) => {
  await openAt(page);
  await expect(
    page.locator('[data-city="new-york"] .city-time').first(),
  ).toContainText("10:08");
  await expect(
    page.locator('[data-city="london"] .city-time').first(),
  ).toContainText("03:08");
  await page.getByRole("button", { name: "Add a city", exact: true }).click();
  await page.getByRole("searchbox").fill("kathmandu");
  await page
    .getByRole("button", { name: "Add Kathmandu", exact: true })
    .click();
  await expect(page).toHaveURL(/#world$/);
  await expect(
    page.locator('#all-clocks [data-city="kathmandu"] .city-time'),
  ).toContainText("07:53");
  await expect(
    page.locator('#all-clocks [data-city="kathmandu"] .city-offset'),
  ).toHaveText("+5h 45m from you");
});

test("city search, add, remove, and saved selection work", async ({ page }) => {
  await page.goto("/#world");
  await page.getByRole("button", { name: "Add a city", exact: true }).click();
  await page.getByRole("searchbox").fill("not-a-city");
  await expect(
    page.getByText("No cities found. Try a nearby city or country."),
  ).toBeVisible();
  await page.getByRole("searchbox").fill("jakarta");
  await page.getByRole("button", { name: "Add Jakarta", exact: true }).click();
  await expect(page.locator("#all-clocks .world-card")).toHaveCount(4);
  await page.reload();
  await expect(page.locator('#all-clocks [data-city="jakarta"]')).toBeVisible();
  await page.getByRole("button", { name: "Remove Jakarta" }).click();
  await expect(page.locator("#all-clocks .world-card")).toHaveCount(3);
  await page.reload();
  await expect(page.locator('#all-clocks [data-city="jakarta"]')).toHaveCount(
    0,
  );
});

test("focus timer can start, pause, resume, reset and finish across navigation", async ({
  page,
}) => {
  await openAt(page);
  await page.getByRole("link", { name: "Focus timer", exact: true }).click();
  await page.getByRole("button", { name: "Break · 5 min" }).click();
  await expect(page.locator("#focus-display")).toHaveText("05:00");
  await page.getByRole("button", { name: "Start focusing" }).click();
  await page.clock.fastForward("00:10");
  await expect(page.locator("#focus-display")).toHaveText("04:50");
  await page.getByRole("button", { name: "Pause session" }).click();
  await page.clock.fastForward("00:10");
  await expect(page.locator("#focus-display")).toHaveText("04:50");
  await page.getByRole("button", { name: "Keep going" }).click();
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await page.clock.fastForward("05:00");
  await page.getByRole("link", { name: "Focus timer", exact: true }).click();
  await expect(page.locator("#focus-display")).toHaveText("00:00");
  await expect(page.getByText("Well done. Take a breath.")).toBeVisible();
  await page.getByRole("button", { name: "Reset focus timer" }).click();
  await expect(page.locator("#focus-display")).toHaveText("05:00");
  await page.getByRole("button", { name: "Deep work · 50 min" }).click();
  await expect(page.locator("#focus-display")).toHaveText("50:00");
});

test("stopwatch records laps and can pause, resume, and reset", async ({
  page,
}) => {
  await openAt(page);
  await page.getByRole("link", { name: "Stopwatch", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Lap", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Start stopwatch" }).click();
  await page.clock.runFor(2300);
  await page.getByRole("button", { name: "Lap", exact: true }).click();
  await expect(page.locator("#laps tr")).toHaveCount(1);
  await page.getByRole("button", { name: "Pause stopwatch" }).click();
  const paused = await page.locator("#stopwatch-display").innerText();
  await page.clock.fastForward("00:10");
  await expect(page.locator("#stopwatch-display")).toHaveText(paused);
  await page.getByRole("button", { name: "Keep going" }).click();
  await page.clock.runFor(1200);
  await page.getByRole("button", { name: "Lap", exact: true }).click();
  await expect(page.locator("#laps tr")).toHaveCount(2);
  await page.getByRole("button", { name: "Reset stopwatch" }).click();
  await expect(page.locator("#stopwatch-display")).toHaveText("00:00.00");
  await expect(page.locator(".laps-table")).toBeHidden();
});

test("appearance and display settings persist after reload", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("switch", { name: /24-hour time/ }).check();
  await page.getByRole("switch", { name: /Show seconds/ }).uncheck();
  await page.getByRole("switch", { name: /Dark appearance/ }).check();
  await page.getByRole("button", { name: "Close settings" }).click();
  await page.reload();
  await expect(page.locator("body")).toHaveClass(/dark/);
  await expect(page.locator("#local-seconds")).toBeHidden();
  await expect(
    page.getByRole("button", { name: "24h", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("animation controls honor system reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("body")).toHaveClass(/reduce-motion/);
  await expect(page.locator(".hero-photo")).toHaveCSS("animation-name", "none");
  await page.getByRole("button", { name: "Enable animations" }).click();
  await expect(page.locator("body")).toHaveClass(/reduce-motion/);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(
    page.getByRole("switch", { name: /Gentle animations/ }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Close settings" }).click();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator("body")).not.toHaveClass(/reduce-motion/);
  await page.getByRole("button", { name: "Pause animations" }).click();
  await expect(page.locator("body")).toHaveClass(/reduce-motion/);
});

test("guided breathing changes phase and dialog restores keyboard focus", async ({
  page,
}) => {
  await openAt(page);
  await page
    .getByRole("button", { name: "Take a breath", exact: true })
    .click();
  await page.clock.runFor(100);
  await expect(page.locator("#breath-instruction")).toHaveText("Breathe in");
  await page.clock.fastForward(4100);
  await expect(page.locator("#breath-instruction")).toHaveText("Gently hold");
  await page.clock.fastForward(4100);
  await expect(page.locator("#breath-instruction")).toHaveText("Breathe out");
  await page.keyboard.press("Escape");
  await expect(page.locator("#breath-dialog")).not.toBeVisible();
  await expect(page.locator("#open-breath")).toBeFocused();
});

test("page routes support browser back and deep linking", async ({ page }) => {
  await page.goto("/#stopwatch");
  await expect(page.locator("#view-stopwatch")).toBeVisible();
  await page.getByRole("link", { name: "World clock", exact: true }).click();
  await expect(page.locator("#view-world")).toBeVisible();
  await page.goBack();
  await expect(page.locator("#view-stopwatch")).toBeVisible();
  await expect(page.locator('[data-view="stopwatch"]')).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("handles unavailable storage without breaking the clock", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error("Storage disabled");
    };
    Storage.prototype.setItem = () => {
      throw new Error("Storage disabled");
    };
  });
  await page.goto("/");
  await expect(page.locator("#tanggal")).not.toBeEmpty();
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator("body")).toHaveClass(/dark/);
});

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`layout fits a ${width}px viewport without horizontal scrolling`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    for (const view of ["overview", "world", "focus", "stopwatch"]) {
      await page.locator(`[data-view="${view}"]`).click();
      const fits = await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      );
      expect(fits, `${view} should fit ${width}px`).toBe(true);
    }
    if (width < 761) {
      await page.getByRole("button", { name: "Open settings" }).click();
      await expect(page.locator("#settings-dialog")).toBeVisible();
    }
  });
}
