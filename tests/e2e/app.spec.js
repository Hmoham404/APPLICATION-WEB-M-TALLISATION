import { test, expect } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
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

test("PWA : bouton natif et état après installation (événements simulés)", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Installer l’application", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    event.prompt = async () => {
      window.installRequested = true;
    };
    event.userChoice = Promise.resolve({ outcome: "accepted" });
    window.dispatchEvent(event);
  });
  await page
    .getByRole("button", { name: "Installer MYC maintenant", exact: true })
    .click();
  expect(await page.evaluate(() => window.installRequested)).toBe(true);
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await expect(
    page.getByRole("button", { name: "Application installée", exact: true }),
  ).toBeVisible();
});

test("PWA : proposition reçue avant React et refus explicite", async ({
  page,
}) => {
  await page.route("**/pwa-install.js", async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body:
        (await response.text()) +
        `
      const early = new Event('beforeinstallprompt', {cancelable:true});
      early.prompt = async () => {window.earlyPromptCalled = true;};
      early.userChoice = Promise.resolve({outcome:'dismissed'});
      window.dispatchEvent(early);
    `,
    });
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Installer l’application", exact: true })
    .click();
  expect(await page.evaluate(() => window.earlyPromptCalled)).toBe(true);
  await expect(page.getByRole("dialog")).toContainText(
    "La proposition a été fermée",
  );
  expect(await page.evaluate(() => window.__mycInstallPrompt)).toBeNull();
});

test("PWA : aide mobile et vérification de mise à jour sans proposition native", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.getByRole("button", { name: "Installer", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Ajouter à l’écran d’accueil",
  );
  await page
    .getByRole("button", { name: "Vérifier la mise à jour", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("status")).toContainText(
    "La vérification est terminée",
  );
  await page.screenshot({
    path: "output/screenshots/mobile-install-help.png",
    fullPage: true,
  });
});

test("PWA : page dédiée sur téléphone et confirmation d’installation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/installer.html");
  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("link", { name: "Télécharger MYC Android (.apk)" })
    .click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe("MYC-Production-1.0.0.apk");
  const bytes = await readFile(await download.path());
  expect(bytes.subarray(0, 2).toString()).toBe("PK");
  expect(bytes.length).toBeGreaterThan(10000);
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    event.prompt = async () => {
      window.dedicatedPromptCalled = true;
    };
    event.userChoice = Promise.resolve({ outcome: "accepted" });
    window.dispatchEvent(event);
  });
  await page
    .getByRole("button", {
      name: "Installer la version web (PWA)",
      exact: true,
    })
    .click();
  expect(await page.evaluate(() => window.dedicatedPromptCalled)).toBe(true);
  await expect(page.getByRole("status")).toContainText("Installation demandée");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("Android : le bouton principal télécharge directement l’APK", async ({
  browser,
}) => {
  const context = await browser.newContext({
    baseURL: "http://127.0.0.1:4174",
    userAgent:
      "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36",
    viewport: { width: 390, height: 844 },
  });
  try {
    const page = await context.newPage();
    await page.goto("/");
    const pending = page.waitForEvent("download");
    await page.getByRole("button", { name: "Installer", exact: true }).click();
    expect((await pending).suggestedFilename()).toBe(
      "MYC-Production-1.0.0.apk",
    );
    await expect(page.getByRole("dialog")).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test("Android APK : export PDF transmis au sélecteur de fichiers natif", async ({
  browser,
}) => {
  const context = await browser.newContext({
    baseURL: "http://127.0.0.1:4174",
    userAgent:
      "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36 MYCAndroid/1.0.0",
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  try {
    await page.goto("/");
    await page.evaluate(() => {
      const channel = new MessageChannel();
      channel.port1.onmessage = ({ data }) => {
        window.savedNativeFile = JSON.parse(data);
        channel.port1.postMessage(
          JSON.stringify({ id: window.savedNativeFile.id, ok: true }),
        );
      };
      window.postMessage("MYC_ANDROID_READY", location.origin, [channel.port2]);
    });
    await page.waitForFunction(() => !!window.MYCNative);
    await page
      .locator(".department-card")
      .filter({ hasText: "Injection" })
      .click();
    await page.getByLabel("Référence article").fill("APK-TEST");
    await page.getByLabel("Ordre de fabrication").fill("APK-01");
    await page.getByLabel("Presse").fill("P01");
    await page.getByLabel("Équipe / shift").fill("A");
    await page
      .getByRole("button", { name: "Rapport PDF", exact: true })
      .click();
    await page.waitForFunction(() => !!window.savedNativeFile);
    const saved = await page.evaluate(() => window.savedNativeFile);
    expect(saved.mime).toBe("application/pdf");
    expect(saved.filename).toContain("MYC-INJ");
    expect(Buffer.from(saved.base64, "base64").subarray(0, 5).toString()).toBe(
      "%PDF-",
    );
  } finally {
    await context.close();
  }
});

test("PWA : nouvelle version détectée et brouillon conservé", async ({
  page,
  context,
}) => {
  const swPath = new URL("../../dist/sw.js", import.meta.url);
  const original = await readFile(swPath, "utf8");
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  const otherTab = await context.newPage();
  await otherTab.goto("/");
  await otherTab.evaluate(() => {
    window.previousWorker = navigator.serviceWorker.controller;
  });
  await page
    .locator(".department-card")
    .filter({ hasText: "Injection" })
    .click();
  await page.getByLabel("Référence article").fill("BROUILLON-AVANT-MAJ");
  try {
    await writeFile(
      swPath,
      original.replace(/myc-v2-\d+/, `myc-v2-${Date.now()}-test`),
    );
    await page.evaluate(async () =>
      (await navigator.serviceWorker.getRegistration()).update(),
    );
    await otherTab.waitForFunction(
      () => navigator.serviceWorker.controller !== window.previousWorker,
    );
    await expect(
      page.getByRole("button", { name: "Mettre à jour", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Mettre à jour", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "La production, en clair." }),
    ).toBeVisible();
    await page
      .locator(".department-card")
      .filter({ hasText: "Injection" })
      .click();
    await expect(page.getByLabel("Référence article")).toHaveValue(
      "BROUILLON-AVANT-MAJ",
    );
  } finally {
    await writeFile(swPath, original);
  }
});
