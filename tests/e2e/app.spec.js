import { test, expect } from "@playwright/test";
test("saisie, qualité, PDF et historique sans connexion", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "La production, en clair." }),
  ).toBeVisible();
  await page.screenshot({
    path: "output/screenshots/desktop.png",
    fullPage: true,
  });
  await page
    .locator(".department-card")
    .filter({ hasText: "Injection" })
    .click();
  await page.getByLabel("Référence article").fill("FLACON-TEST");
  await page.getByLabel("Ordre de fabrication").fill("OF-TEST-42");
  await page.getByLabel("Presse", { exact: false }).fill("P03");
  await page.getByLabel("Équipe / shift").fill("Équipe A");
  await page.getByLabel("Quantité OK 07:00", { exact: true }).fill("90");
  await page.getByLabel("Quantité NOK 07:00", { exact: true }).fill("10");
  await page
    .locator(".hour-row")
    .first()
    .getByRole("button", { name: "Arrêt", exact: true })
    .click();
  await page
    .getByLabel("Code arrêt 1 à 07:00", { exact: true })
    .selectOption("C1");
  await page.getByLabel("Durée arrêt 1 à 07:00", { exact: true }).fill("12");
  await page.getByRole("button", { name: "Ajouter un créneau" }).click();
  await page.getByRole("tab", { name: /Contrôle qualité/ }).click();
  await expect(
    page.getByRole("columnheader", { name: "15:00", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Bavure à 07:00", { exact: true }).fill("25");
  await expect(page.locator(".metrics-grid .metric").nth(2)).toContainText(
    "10",
  );
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Rapport PDF", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain("MYC-INJ");
  expect(await download.failure()).toBeNull();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("myc-records") || "[]").length,
    ),
  ).toBe(0);
  await page
    .getByRole("button", { name: "Enregistrer la fiche", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Fiche enregistrée");
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Rapports & historique" })
    .click();
  await expect(page.locator(".history-table")).toContainText("OF-TEST-42");
  await page.getByRole("button", { name: "Ouvrir", exact: false }).click();
  await page.getByRole("tab", { name: /Contrôle qualité/ }).click();
  await expect(page.getByLabel("Bavure à 07:00", { exact: true })).toHaveValue(
    "25",
  );
  await page
    .locator(".side-departments")
    .getByRole("button", { name: "Assemblage" })
    .click();
  await expect(page.getByLabel("Référence article")).toHaveValue("");
  await page.getByLabel("Référence article").fill("ASSEMBLAGE-BROUILLON");
  await page
    .locator(".side-departments")
    .getByRole("button", { name: "Injection" })
    .click();
  await expect(page.getByLabel("Référence article")).toHaveValue("FLACON-TEST");
  expect(errors).toEqual([]);
});
test("mobile : champs lisibles, pas de débordement et conservation du brouillon", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.screenshot({
    path: "output/screenshots/mobile-home.png",
    fullPage: true,
  });
  await page
    .locator(".department-card")
    .filter({ hasText: "Sérigraphie" })
    .click();
  await page.getByLabel("Référence article").fill("SER-MOBILE");
  await page.getByLabel("Ordre de fabrication").fill("OF-MOBILE-01");
  await page.getByLabel("Machine", { exact: false }).fill("S01");
  await page.getByLabel("Équipe / shift").fill("Équipe A");
  await page.screenshot({
    path: "output/screenshots/mobile-entry.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Rapport PDF", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Votre rapport PDF est prêt",
  );
  await expect(
    page.getByTitle("Aperçu du rapport de production"),
  ).toHaveAttribute("src", /^blob:/);
  const mobileDownload = page.waitForEvent("download");
  await page.getByRole("link", { name: /Télécharger le PDF/ }).click();
  expect((await mobileDownload).suggestedFilename()).toContain("MYC-SER");
  for (const width of [320, 360, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.reload();
  await page
    .locator(".department-card")
    .filter({ hasText: "Sérigraphie" })
    .click();
  await expect(page.getByLabel("Référence article")).toHaveValue("SER-MOBILE");
});
test("PWA : manifeste, cache et rechargement sans réseau", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  const manifest = await (
    await page.request.get("/manifest.webmanifest")
  ).json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons).toHaveLength(2);
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "La production, en clair." }),
  ).toBeVisible();
  await expect(page.locator(".network-banner")).toContainText("hors connexion");
  await page
    .locator(".department-card")
    .filter({ hasText: "Métallisation" })
    .click();
  await page.getByLabel("Référence article").fill("HORS-LIGNE");
  await page.reload();
  await page
    .locator(".department-card")
    .filter({ hasText: "Métallisation" })
    .click();
  await expect(page.getByLabel("Référence article")).toHaveValue("HORS-LIGNE");
});
