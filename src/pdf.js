import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { department, normalize, totals, dateLabel, number } from "./model.js";

const C = {
  navy: rgb(0.09, 0.18, 0.28),
  blue: rgb(0.13, 0.34, 0.77),
  muted: rgb(0.43, 0.5, 0.58),
  line: rgb(0.88, 0.91, 0.94),
  pale: rgb(0.96, 0.97, 0.99),
  green: rgb(0.15, 0.51, 0.42),
  white: rgb(1, 1, 1),
};
const W = 842,
  H = 595,
  M = 36,
  CW = W - M * 2;
const safe = (value) =>
  String(value ?? "")
    .normalize("NFC")
    .replace(/[\u202f\u00a0]/g, " ")
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(
      /[^\x20-\x7e\xa0-\xff\u0152\u0153\u0160\u0161\u0178\u017d\u017e\u0192\u02c6\u02dc\u2018-\u201e\u2020-\u2022\u2026\u2030\u2039\u203a\u20ac\n]/gu,
      "?",
    );
const fmt = (n) =>
  safe(new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(n));
export async function makeCombinedPdf(input) {
  const record = normalize(input),
    d = department(record.department),
    g = record.general,
    t = totals(record);
  const doc = await PDFDocument.create();
  doc.setTitle(`MYC - ${d.name} - ${g.of}`);
  doc.setAuthor("MYC Beauty Innovation");
  doc.setSubject("Rapport de production et de contrôle qualité");
  const regular = await doc.embedFont(StandardFonts.Helvetica),
    bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page,
    y,
    section = "";
  const text = (v, x, yy, size = 9, font = regular, color = C.navy) =>
    page.drawText(safe(v), { x, y: yy, size, font, color });
  const box = (x, yy, width, height, color = C.pale) =>
    page.drawRectangle({ x, y: yy, width, height, color });
  const line = (x, yy, x2) =>
    page.drawLine({
      start: { x, y: yy },
      end: { x: x2, y: yy },
      thickness: 0.6,
      color: C.line,
    });
  function wrap(value, width, size = 9, font = regular) {
    const result = [];
    for (const paragraph of safe(value).split("\n")) {
      let current = "";
      for (const word of paragraph.split(/\s+/)) {
        if (!word) continue;
        if (
          font.widthOfTextAtSize(current + (current ? " " : "") + word, size) <=
          width
        ) {
          current += (current ? " " : "") + word;
          continue;
        }
        if (current) {
          result.push(current);
          current = "";
        }
        for (const ch of word) {
          if (font.widthOfTextAtSize(current + ch, size) > width) {
            result.push(current);
            current = "";
          }
          current += ch;
        }
      }
      result.push(current);
    }
    return result.length ? result : [""];
  }
  function newPage(title = section) {
    section = title;
    page = doc.addPage([W, H]);
    text("MYC", M, H - 51, 29, bold);
    text("BEAUTY INNOVATION / TUNISIE", M + 87, H - 37, 7, bold, C.muted);
    text(d.name.toUpperCase(), M + 87, H - 52, 8, regular, C.blue);
    text("RAPPORT DE PRODUCTION", W - 230, H - 36, 9, bold);
    text(
      `${dateLabel(g.date)}  /  ${d.short}`,
      W - 230,
      H - 52,
      8,
      regular,
      C.muted,
    );
    line(M, H - 70, W - M);
    box(M, H - 74, 38, 3, C.blue);
    text(title, M, H - 101, 17, bold);
    const ref = `OF ${g.of || "-"}  |  ${g.article || "-"}  |  ${g.chain || "-"}  |  ${g.shift || "-"}`;
    const lines = wrap(ref, CW, 8);
    lines.forEach((s, i) => text(s, M, H - 118 - i * 11, 8, regular, C.muted));
    y = H - 136 - lines.length * 11;
  }
  function ensure(height) {
    if (y - height < 48) newPage();
  }
  function paragraph(value, label) {
    if (!value) return;
    ensure(40);
    if (label) {
      text(label.toUpperCase(), M, y, 8, bold, C.blue);
      y -= 18;
    }
    for (const s of wrap(value, CW, 9)) {
      ensure(14);
      text(s, M, y, 9);
      y -= 14;
    }
    y -= 12;
  }
  function table(headers, rows, widths) {
    const header = () => {
      box(M, y - 26, CW, 26);
      let x = M;
      headers.forEach((h, i) => {
        text(h, x + 8, y - 17, 8, bold, C.muted);
        x += widths[i];
      });
      y -= 26;
    };
    ensure(65);
    header();
    for (const row of rows) {
      const cells = row.map((v, i) => wrap(v, widths[i] - 16, 8));
      let offset = 0,
        max = Math.max(...cells.map((c) => c.length));
      while (offset < max) {
        if (y - 30 < 48) {
          newPage();
          header();
        }
        const count = Math.min(
            max - offset,
            Math.max(1, Math.floor((y - 48 - 16) / 12)),
          ),
          height = count * 12 + 16;
        if (rows.indexOf(row) % 2 === 1)
          box(M, y - height, CW, height, rgb(0.985, 0.989, 0.995));
        let x = M;
        cells.forEach((lines, i) => {
          lines
            .slice(offset, offset + count)
            .forEach((s, j) =>
              text(s, x + 8, y - 17 - j * 12, 8, i === 0 ? bold : regular),
            );
          x += widths[i];
        });
        y -= height;
        line(M, y, W - M);
        offset += count;
        if (offset < max) {
          newPage();
          header();
        }
      }
    }
    y -= 20;
  }
  newPage("01 / Synthèse de la journée");
  const meta = [
    ["DATE", dateLabel(g.date)],
    ["ORDRE DE FABRICATION", g.of],
    ["ARTICLE", g.article],
    ["CLIENT", g.client],
    [d.machine.toUpperCase(), g.chain],
    ["ÉQUIPE", g.shift],
    ["MATRICULE", g.matricule],
    ["OBJECTIF / HEURE", g.cadence ? `${g.cadence} pièces` : "-"],
  ];
  for (let r = 0; r < 2; r++) {
    const values = meta
        .slice(r * 4, r * 4 + 4)
        .map(([label, v]) => [label, wrap(v || "-", CW / 4 - 22, 10)]),
      height = Math.max(...values.map((v) => v[1].length)) * 13 + 30;
    ensure(height);
    values.forEach(([label, lines], i) => {
      const x = M + (i * CW) / 4;
      text(label, x + 10, y - 12, 7, bold, C.muted);
      lines.forEach((s, j) => text(s, x + 10, y - 31 - j * 13, 10));
    });
    y -= height;
    line(M, y, W - M);
  }
  y -= 22;
  ensure(77);
  [
    ["PIÈCES CONFORMES", fmt(t.ok), "OK"],
    ["PIÈCES REJETÉES", fmt(t.nok), "NOK"],
    ["TAUX DE REBUT", fmt(t.rate), "%"],
    ["TEMPS D’ARRÊT", fmt(t.stops), "min"],
  ].forEach(([label, value, unit], i) => {
    const x = M + (i * CW) / 4;
    box(x, y - 64, CW / 4 - 9, 64);
    text(label, x + 13, y - 17, 7, bold, C.muted);
    text(value, x + 13, y - 44, 22, bold, i === 0 ? C.green : C.navy);
    text(unit, x + CW / 4 - 42, y - 44, 8, regular, C.muted);
  });
  y -= 87;
  paragraph(
    "Taux de rebut = pièces NOK / (pièces OK + pièces NOK) × 100. Les occurrences de défauts sont comptabilisées séparément.",
  );
  const extra = [
    ["Lot", g.lot],
    ["Carton", g.carton],
    ["Compteur début", g.counterStart],
    ["Compteur fin", g.counterEnd],
    ["Vitesse de ligne", g.speed],
    ["Moule", g.mold],
    ["Matière", g.material],
    ["Couleur / encre", g.color],
  ].filter(([, v]) => v !== "" && v != null);
  if (extra.length)
    paragraph(
      extra.map(([k, v]) => `${k} : ${v}`).join("   /   "),
      "Informations complémentaires",
    );
  paragraph(
    g.notes || "Aucune observation renseignée.",
    "Observations de fin de poste",
  );
  ensure(66);
  line(M, y - 48, M + CW / 2 - 15);
  line(M + CW / 2 + 15, y - 48, W - M);
  text("VISA OPÉRATEUR", M, y - 5, 7, bold, C.muted);
  text("VISA RESPONSABLE", M + CW / 2 + 15, y - 5, 7, bold, C.muted);
  newPage("02 / Relevés horaires de production");
  table(
    ["HEURE", "QTÉ OK", "QTÉ NOK", "ARRÊTS (MIN)", "OBSERVATIONS"],
    record.hours.map((h) => [
      h.time,
      h.ok === "" ? "-" : fmt(number(h.ok)),
      h.nok === "" ? "-" : fmt(number(h.nok)),
      fmt(h.stoppages.reduce((a, s) => a + number(s.duration), 0)),
      h.comment || "-",
    ]),
    [65, 83, 83, 105, CW - 336],
  );
  paragraph(
    `Total produit : ${fmt(t.produced)} pièces   /   Conformes : ${fmt(t.ok)}   /   Rejetées : ${fmt(t.nok)}   /   Arrêts : ${fmt(t.stops)} min`,
    "Totaux",
  );
  const stops = record.hours.flatMap((h) =>
    h.stoppages.map((s) => [
      h.time,
      s.code,
      `${s.duration} min`,
      s.comment || "-",
    ]),
  );
  if (stops.length) {
    newPage("03 / Détail des arrêts");
    table(["HEURE", "CODE", "DURÉE", "MOTIF / COMMENTAIRE"], stops, [
      70,
      70,
      85,
      CW - 225,
    ]);
  }
  for (let start = 0; start < record.hours.length; start += 10) {
    const hs = record.hours.slice(start, start + 10),
      width = (CW - 225) / hs.length;
    newPage(
      `04 / Contrôle qualité${record.hours.length > 10 ? ` - créneaux ${start + 1} à ${start + hs.length}` : ""}`,
    );
    table(
      ["TYPE DE DÉFAUT", ...hs.map((h) => h.time), "TOTAL"],
      record.quality.map((q) => [
        q.name,
        ...hs.map((_, i) => number(q.values[start + i]) || "-"),
        fmt(
          q.values
            .slice(start, start + hs.length)
            .reduce((s, v) => s + number(v), 0),
        ),
      ]),
      [170, ...hs.map(() => width), 55],
    );
    paragraph(
      `Occurrences sur ces créneaux : ${fmt(record.quality.reduce((a, q) => a + q.values.slice(start, start + hs.length).reduce((s, v) => s + number(v), 0), 0))}. Une pièce peut présenter plusieurs défauts.`,
    );
  }
  newPage("05 / Analyse qualité");
  const ranked = record.quality
    .map((q) => ({
      name: q.name,
      total: q.values.reduce((a, v) => a + number(v), 0),
    }))
    .filter((q) => q.total > 0)
    .sort((a, b) => b.total - a.total);
  paragraph(
    `${fmt(t.defects)} occurrences de défauts   /   ${fmt(t.nok)} pièces rejetées   /   ${fmt(t.rate)} % de rebut`,
    "Indicateurs qualité",
  );
  if (!ranked.length) paragraph("Aucun défaut renseigné pour cette fiche.");
  else {
    text("PRINCIPAUX DÉFAUTS - OCCURRENCES", M, y, 8, bold, C.blue);
    y -= 24;
    const max = ranked[0].total;
    for (const q of ranked.slice(0, 6)) {
      ensure(36);
      const labels = wrap(q.name, 185, 9);
      labels.forEach((s, i) => text(s, M, y - i * 12, 9));
      box(M + 205, y - 2, 440, 10);
      box(M + 205, y - 2, (440 * q.total) / max, 10, C.blue);
      text(fmt(q.total), M + 665, y, 9, bold);
      y -= Math.max(32, labels.length * 12 + 10);
    }
    y -= 12;
    table(
      ["DÉFAUT", "OCCURRENCES", "PART DES OCCURRENCES"],
      ranked.map((q) => [
        q.name,
        fmt(q.total),
        `${fmt((100 * q.total) / t.defects)} %`,
      ]),
      [400, 150, CW - 550],
    );
  }
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    page = p;
    line(M, 31, W - M);
    text(
      `MYC / ${d.short} - Document généré à partir des données saisies`,
      M,
      18,
      7,
      regular,
      C.muted,
    );
    text(`${i + 1} / ${pages.length}`, W - M - 35, 18, 7, bold, C.muted);
  });
  return doc.save();
}
export async function downloadCombinedPdf(record) {
  const bytes = await makeCombinedPdf(record);
  const url = URL.createObjectURL(
    new Blob([bytes], { type: "application/pdf" }),
  );
  const a = document.createElement("a");
  a.href = url;
  const of = String(record.general.of || "fiche")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .slice(0, 60);
  a.download = `MYC-${department(record.department).short}-${record.general.date}-${of}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
