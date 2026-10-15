export const DEPARTMENTS = [
  {
    id: "metallisation",
    name: "Métallisation",
    short: "MET",
    machine: "Chaîne",
    example: "M01",
    description: "Traitement de surface & finition",
    color: "#2563eb",
    defects: [
      "Particule",
      "Bavure",
      "Tache noire",
      "Tache blanche",
      "Rayure",
      "Retassure",
      "Tache d’huile",
      "Effet ombre",
      "Refus",
    ],
  },
  {
    id: "assemblage",
    name: "Assemblage",
    short: "ASM",
    machine: "Ligne / poste",
    example: "A01",
    description: "Montage & contrôle des composants",
    color: "#0b8275",
    defects: [
      "Pièce manquante",
      "Mauvais montage",
      "Déformation",
      "Jeu fonctionnel",
      "Rayure",
      "Défaut de fermeture",
      "Autre",
    ],
  },
  {
    id: "injection",
    name: "Injection",
    short: "INJ",
    machine: "Presse",
    example: "P01",
    description: "Moulage & transformation matière",
    color: "#af6b17",
    defects: [
      "Bavure",
      "Manque matière",
      "Retassure",
      "Brûlure",
      "Point noir",
      "Déformation",
      "Variation couleur",
      "Autre",
    ],
  },
  {
    id: "serigraphie",
    name: "Sérigraphie",
    short: "SER",
    machine: "Machine",
    example: "S01",
    description: "Impression & décoration",
    color: "#7851a9",
    defects: [
      "Décalage impression",
      "Manque encre",
      "Bavure impression",
      "Mauvaise adhérence",
      "Tache",
      "Rayure",
      "Variation couleur",
      "Autre",
    ],
  },
];
export const department = (id) =>
  DEPARTMENTS.find((d) => d.id === id) || DEPARTMENTS[0];
export const localDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const number = (value) => Number(value) || 0;
export const format = (value) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(value);
export const dateLabel = (date) =>
  date ? new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR") : "—";
export function blank(id = "metallisation") {
  const hours = Array.from({ length: 8 }, (_, i) => ({
    time: `${String(i + 7).padStart(2, "0")}:00`,
    ok: "",
    nok: "",
    stoppages: [],
    comment: "",
  }));
  return {
    id: null,
    department: id,
    general: {
      date: localDate(),
      article: "",
      client: "",
      of: "",
      chain: "",
      shift: "",
      matricule: "",
      cadence: "",
      speed: "",
      counterStart: "",
      counterEnd: "",
      carton: "",
      mold: "",
      material: "",
      lot: "",
      color: "",
      notes: "",
    },
    hours,
    quality: department(id).defects.map((name) => ({
      name,
      values: hours.map(() => ""),
    })),
  };
}
export function normalize(record) {
  const base = blank(record.department || "metallisation");
  const hours = (record.hours || base.hours).map((h) => ({
    ...h,
    stoppages: h.stoppages || [],
  }));
  return {
    ...base,
    ...record,
    department: department(record.department).id,
    general: { ...base.general, ...record.general },
    hours,
    quality: (record.quality || base.quality).map((q) => ({
      ...q,
      values: hours.map((_, i) => q.values?.[i] ?? ""),
    })),
  };
}
export function totals(record) {
  const ok = record.hours.reduce((s, h) => s + number(h.ok), 0);
  const nok = record.hours.reduce((s, h) => s + number(h.nok), 0);
  const stops = record.hours.reduce(
    (s, h) => s + h.stoppages.reduce((a, x) => a + number(x.duration), 0),
    0,
  );
  const defects = record.quality.reduce(
    (s, q) => s + q.values.reduce((a, x) => a + number(x), 0),
    0,
  );
  return {
    ok,
    nok,
    stops,
    defects,
    produced: ok + nok,
    rate: ok + nok ? (nok / (ok + nok)) * 100 : 0,
  };
}
export function addHour(record) {
  const last = record.hours.at(-1)?.time || "06:00";
  const [h, m] = last.split(":").map(Number);
  return {
    ...record,
    hours: [
      ...record.hours,
      {
        time: `${String((h + 1) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
        ok: "",
        nok: "",
        stoppages: [],
        comment: "",
      },
    ],
    quality: record.quality.map((q) => ({ ...q, values: [...q.values, ""] })),
  };
}
export function validate(record) {
  const g = record.general;
  if (
    ["date", "article", "of", "chain", "shift"].some(
      (k) => !String(g[k] || "").trim(),
    )
  )
    return "Complétez la date, l’article, l’OF, le poste et l’équipe.";
  const values = [
    ...record.hours.flatMap((h) => [
      h.ok,
      h.nok,
      ...h.stoppages.map((s) => s.duration),
    ]),
    ...record.quality.flatMap((q) => q.values),
    g.cadence,
    g.speed,
    g.counterStart,
    g.counterEnd,
  ];
  if (
    values.some(
      (v) =>
        v !== "" &&
        (!Number.isSafeInteger(Number(v)) ||
          Number(v) < 0 ||
          Number(v) > 2147483647),
    )
  )
    return "Les quantités et durées doivent être des entiers positifs ou nuls (maximum 2 147 483 647).";
  if (record.hours.some((h) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(h.time)))
    return "Renseignez une heure valide pour chaque relevé.";
  if (
    record.hours.some(
      (h) => h.stoppages.reduce((s, x) => s + number(x.duration), 0) > 60,
    )
  )
    return "Les arrêts ne peuvent pas dépasser 60 minutes par créneau.";
  if (
    record.hours.some((h) =>
      h.stoppages.some(
        (s) => !s.code || !s.duration || number(s.duration) <= 0,
      ),
    )
  )
    return "Chaque arrêt doit avoir un code et une durée supérieure à zéro.";
  if (
    g.counterStart !== "" &&
    g.counterEnd !== "" &&
    number(g.counterEnd) < number(g.counterStart)
  )
    return "Le compteur de fin doit être supérieur ou égal au compteur de début.";
  return "";
}
