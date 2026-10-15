import test from "node:test";
import assert from "node:assert/strict";
import {
  blank,
  normalize,
  addHour,
  totals,
  validate,
  DEPARTMENTS,
} from "../src/model.js";
import { makeCombinedPdf } from "../src/pdf.js";
import { PDFDocument } from "pdf-lib";
import { mkdir, writeFile } from "node:fs/promises";
const complete = (id) => {
  const r = blank(id);
  Object.assign(r.general, {
    article: "Flacon Élégance",
    of: "OF-2026-1042",
    chain: "P03",
    shift: "Équipe A",
    client: "MYC",
    matricule: "1024",
    cadence: "500",
    lot: "LOT-26-1015",
  });
  return r;
};
test("chaque département dispose de son propre modèle", () => {
  for (const d of DEPARTMENTS) {
    const r = blank(d.id);
    assert.equal(r.department, d.id);
    assert.equal(r.quality[0].name, d.defects[0]);
    assert.ok(r.quality.every((q) => q.values.length === r.hours.length));
  }
});
test("migration des anciennes fiches de métallisation", () => {
  const r = blank();
  delete r.department;
  r.quality[0].values = ["2"];
  const fixed = normalize(r);
  assert.equal(fixed.department, "metallisation");
  assert.equal(fixed.quality[0].values[0], "2");
  assert.equal(fixed.quality[0].values.length, 8);
});
test("ajout de créneau synchronisé avec la qualité et passage à minuit", () => {
  const r = blank();
  r.hours.at(-1).time = "23:00";
  const next = addHour(r);
  assert.equal(next.hours.at(-1).time, "00:00");
  assert.equal(next.hours.length, 9);
  assert.ok(next.quality.every((q) => q.values.length === 9));
  assert.equal(r.hours.length, 8);
});
test("le taux de rebut compte les pièces NOK, pas les occurrences", () => {
  const r = complete();
  r.hours[0].ok = "90";
  r.hours[0].nok = "10";
  r.quality[0].values[0] = "25";
  assert.deepEqual(totals(r), {
    ok: 90,
    nok: 10,
    produced: 100,
    stops: 0,
    defects: 25,
    rate: 10,
  });
  assert.equal(totals(blank()).rate, 0);
});
test("validation des champs, quantités, compteurs et arrêts", () => {
  const r = complete();
  assert.equal(validate(r), "");
  r.hours[0].ok = "-1";
  assert.match(validate(r), /entiers/);
  r.hours[0].ok = "1.5";
  assert.match(validate(r), /entiers/);
  r.hours[0].ok = "90";
  r.hours[0].stoppages = [
    { code: "C1", duration: "40" },
    { code: "C2", duration: "25" },
  ];
  assert.match(validate(r), /60 minutes/);
  r.hours[0].stoppages = [{ code: "", duration: "10" }];
  assert.match(validate(r), /code/);
});
test("rapport paginé avec accents et longues observations", async () => {
  let r = complete("injection");
  r.hours = r.hours.map((h, i) => ({
    ...h,
    ok: String(420 + i * 12),
    nok: String(i + 2),
    comment:
      i === 0
        ? "Contrôle de démarrage et validation de la première pièce."
        : "",
  }));
  r.hours[1].stoppages = [
    {
      code: "C1",
      duration: "12",
      comment: "Réglage de la presse et contrôle des paramètres.",
    },
  ];
  r.quality[0].values = ["1", "2", "3", "1", "2", "1", "2", "1"];
  r.quality[1].values = ["0", "1", "1", "0", "1", "0", "1", "0"];
  r.general.notes =
    "EXEMPLE DE DÉMONSTRATION — données fictives.\nContrôle visuel réalisé à chaque heure. Transmission des consignes à l’équipe suivante.";
  await mkdir("output/pdf", { recursive: true });
  const bytes = await makeCombinedPdf(r);
  await writeFile("output/pdf/MYC-exemple-injection.pdf", bytes);
  const doc = await PDFDocument.load(bytes);
  assert.ok(doc.getPageCount() >= 5);
  while (r.hours.length < 24) r = addHour(r);
  r.general.notes =
    "Observation détaillée avec accent : qualité, équipe, contrôle. ".repeat(
      100,
    );
  r.hours[0].comment = "TexteLongSansEspace".repeat(70);
  r.hours[1].stoppages[0].comment = "Réglage détaillé. ".repeat(120);
  for (let i = 0; i < 25; i++)
    r.quality.push({
      name: `Défaut supplémentaire ${i} avec un libellé particulièrement détaillé`,
      values: r.hours.map(() => "1"),
    });
  const stress = await makeCombinedPdf(r);
  await mkdir("tmp/pdfs", { recursive: true });
  await writeFile("tmp/pdfs/stress.pdf", stress);
  assert.ok((await PDFDocument.load(stress)).getPageCount() > 8);
});
