import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Layers3,
  Component,
  Factory,
  Paintbrush,
  LayoutGrid,
  ClipboardPenLine,
  FolderOpen,
  Download,
  Plus,
  Trash2,
  Save,
  Check,
  X,
  Search,
  RefreshCw,
  WifiOff,
  Smartphone,
  FileText,
  ChevronRight,
  Clock3,
  CircleCheck,
  TriangleAlert,
  BarChart3,
} from "lucide-react";
import {
  DEPARTMENTS,
  department,
  blank,
  normalize,
  totals,
  addHour,
  validate,
  format,
  dateLabel,
  localDate,
  number,
} from "./model";
import { configured } from "./supabase";
import {
  read,
  write,
  draft,
  draftKey,
  localRecords,
  saveRecord,
  loadRecords,
  syncRecords,
  removeRecord,
} from "./storage";
const ICONS = {
  metallisation: Layers3,
  assemblage: Component,
  injection: Factory,
  serigraphie: Paintbrush,
};
const CODES = Array.from({ length: 11 }, (_, i) => `C${i + 1}`);
function Metric({ label, value, unit, accent }) {
  return (
    <div className={`metric ${accent || ""}`}>
      <span>{label}</span>
      <strong>
        {value}
        <small>{unit}</small>
      </strong>
    </div>
  );
}
function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}) {
  return (
    <label className="field">
      <span>
        {label}
        {required && <b> *</b>}
      </span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? 1 : undefined}
        required={required}
        placeholder={placeholder}
      />
    </label>
  );
}
function Modal({ title, onClose, children }) {
  const ref = useRef();
  useEffect(() => {
    const previous = document.activeElement;
    ref.current.showModal();
    return () => previous?.focus();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="Fermer">
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export default function App() {
  const [page, setPage] = useState("home"),
    [dep, setDep] = useState(read("myc-department", "metallisation"));
  const [form, setForm] = useState(() => draft(dep) || blank(dep)),
    [records, setRecords] = useState(localRecords);
  const [tab, setTab] = useState("production"),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(null),
    [online, setOnline] = useState(navigator.onLine);
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all"),
    [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const [modal, setModal] = useState(null),
    [pendingDelete, setPendingDelete] = useState(null),
    [installPrompt, setInstallPrompt] = useState(
      () => window.__mycInstallPrompt || null,
    ),
    [exporting, setExporting] = useState(false),
    [pdfPreview, setPdfPreview] = useState(null);
  const [installed, setInstalled] = useState(
    () =>
      matchMedia("(display-mode: standalone)").matches ||
      Boolean(navigator.standalone) ||
      /MYCAndroid\//.test(navigator.userAgent),
  );
  const [updateReady, setUpdateReady] = useState(null);
  const [versionActive, setVersionActive] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [checkingInstall, setCheckingInstall] = useState(false);
  const [installStatus, setInstallStatus] = useState("");
  const timer = useRef(),
    storageWarned = useRef(false),
    d = department(form.department),
    stats = totals(form),
    today = localDate();
  const notify = (text, error = false) => {
    setNotice({ text, error });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(null), 7500);
  };
  useEffect(() => {
    try {
      write(draftKey(form.department), form);
    } catch {
      if (!storageWarned.current) {
        storageWarned.current = true;
        notify(
          "Stockage de l’appareil indisponible ou plein. Exportez votre PDF avant de quitter.",
          true,
        );
      }
    }
  }, [form]);
  useEffect(() => {
    const on = () => setOnline(true),
      off = () => setOnline(false),
      install = () => {
        setInstallPrompt(window.__mycInstallPrompt || null);
      },
      installed = () => {
        setInstalled(true);
        setInstallPrompt(null);
        setModal(null);
      },
      update = (e) => setUpdateReady(e.detail),
      activated = () => setVersionActive(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    window.addEventListener("myc-install-ready", install);
    install();
    window.addEventListener("appinstalled", installed);
    window.addEventListener("myc-update-ready", update);
    window.addEventListener("myc-version-active", activated);
    loadRecords()
      .then(setRecords)
      .catch(() =>
        notify(
          "Serveur indisponible : affichage des fiches conservées sur cet appareil.",
          true,
        ),
      );
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      window.removeEventListener("myc-install-ready", install);
      window.removeEventListener("appinstalled", installed);
      window.removeEventListener("myc-update-ready", update);
      window.removeEventListener("myc-version-active", activated);
      clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    if (!configured) return;
    let disposed = false,
      running = false;
    const sync = async () => {
      if (
        running ||
        !navigator.onLine ||
        document.visibilityState !== "visible"
      )
        return;
      running = true;
      try {
        await syncRecords();
        const all = await loadRecords();
        if (!disposed) setRecords(all);
      } catch {
        // Keep local records and retry on the next foreground/network tick.
      } finally {
        running = false;
      }
    };
    sync();
    const interval = setInterval(sync, 30000);
    window.addEventListener("online", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      disposed = true;
      clearInterval(interval);
      window.removeEventListener("online", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);
  const applyUpdate = () => {
    if ((!updateReady?.waiting && !versionActive) || updating) return;
    try {
      write(draftKey(form.department), form);
    } catch {
      notify(
        "Impossible de conserver la saisie. Libérez du stockage avant la mise à jour.",
        true,
      );
      return;
    }
    setUpdating(true);
    if (versionActive) {
      location.reload();
      return;
    }
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => location.reload(),
      { once: true },
    );
    updateReady.waiting.postMessage({ type: "SKIP_WAITING" });
  };
  const navigate = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const choose = (id) => {
    setDep(id);
    try {
      write("myc-department", id);
    } catch {}
    setForm(draft(id) || blank(id));
    setTab("production");
    navigate("entry");
  };
  const setGeneral = (k, v) =>
    setForm((f) => ({ ...f, general: { ...f.general, [k]: v } }));
  const setHour = (i, k, v) =>
    setForm((f) => ({
      ...f,
      hours: f.hours.map((h, j) => (j === i ? { ...h, [k]: v } : h)),
    }));
  const setStop = (i, j, k, v) =>
    setForm((f) => ({
      ...f,
      hours: f.hours.map((h, x) =>
        x === i
          ? {
              ...h,
              stoppages: h.stoppages.map((s, y) =>
                y === j ? { ...s, [k]: v } : s,
              ),
            }
          : h,
      ),
    }));
  const field = (
    label,
    key,
    type = "text",
    required = false,
    placeholder = "",
  ) => (
    <Field
      label={label}
      value={form.general[key]}
      onChange={(v) => setGeneral(key, v)}
      type={type}
      required={required}
      placeholder={placeholder}
    />
  );
  const save = async () => {
    const error = validate(form);
    if (error) {
      notify(error, true);
      return;
    }
    setBusy(true);
    try {
      const result = await saveRecord(form);
      setForm(result.record);
      setRecords(localRecords());
      notify(
        result.warning ||
          (configured
            ? "Fiche enregistrée et synchronisée."
            : "Fiche enregistrée sur cet appareil."),
        Boolean(result.warning),
      );
    } catch (e) {
      notify(`Enregistrement impossible : ${e.message}`, true);
    } finally {
      setBusy(false);
    }
  };
  const refresh = async () => {
    setBusy(true);
    try {
      await syncRecords();
      setRecords(await loadRecords());
      notify("Les fiches sont à jour.");
    } catch (e) {
      notify(e.message, true);
    } finally {
      setBusy(false);
    }
  };
  const exportPdf = async (record) => {
    const error = validate(record);
    if (error) {
      notify(error, true);
      return;
    }
    setExporting(true);
    try {
      const pdf = await import("./pdf");
      if (window.MYCNative) {
        const bytes = await pdf.makeCombinedPdf(record);
        await window.MYCNative.saveBlob(
          new Blob([bytes], { type: "application/pdf" }),
          pdf.combinedPdfFilename(record),
        );
      } else if (
        matchMedia("(max-width: 760px)").matches ||
        navigator.maxTouchPoints > 0
      ) {
        const url = await pdf.prepareCombinedPdf(record);
        setPdfPreview({
          url,
          filename: pdf.combinedPdfFilename(record),
        });
      } else {
        await pdf.downloadCombinedPdf(record);
      }
    } catch (e) {
      notify(`PDF impossible : ${e.message}`, true);
    } finally {
      setExporting(false);
    }
  };
  const open = (r) => {
    setDep(r.department);
    setForm(normalize(r));
    setTab("production");
    navigate("entry");
  };
  const fresh = () => {
    localStorage.removeItem("myc-draft");
    setForm(blank(form.department));
    setModal(null);
    setTab("production");
  };
  const install = async () => {
    if (installed) {
      notify("MYC est déjà ouverte comme application sur cet appareil.");
      return;
    }
    if (
      /Android/.test(navigator.userAgent) ||
      navigator.userAgentData?.platform === "Android"
    ) {
      const link = document.createElement("a");
      link.href = "/downloads/MYC-Production-1.0.0.apk";
      link.download = "MYC-Production-1.0.0.apk";
      document.body.appendChild(link);
      link.click();
      link.remove();
      notify(
        "Téléchargement de MYC Android. Ouvrez le fichier APK téléchargé, puis confirmez Installer.",
      );
      return;
    }
    const prompt = installPrompt || window.__mycInstallPrompt;
    if (prompt) {
      window.__mycInstallPrompt = null;
      setInstallPrompt(null);
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        if (choice.outcome === "accepted") setModal(null);
        else {
          setInstallStatus(
            "La proposition a été fermée. Vous pouvez installer MYC depuis le menu ⋮ de Chrome.",
          );
          setModal("install");
        }
      } catch {
        setInstallStatus(
          "La proposition a expiré. Utilisez le menu ⋮ du navigateur pour installer MYC.",
        );
        setModal("install");
      }
    } else setModal("install");
  };
  const checkInstallation = async () => {
    if (checkingInstall) return;
    setCheckingInstall(true);
    setInstallStatus("Vérification de la version en ligne…");
    try {
      if (!navigator.onLine)
        throw new Error("Reconnectez le téléphone à Internet, puis réessayez.");
      if (!isSecureContext || !("serviceWorker" in navigator))
        throw new Error(
          "Ouvrez le lien HTTPS dans Chrome ou Safari pour installer MYC.",
        );
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration)
        throw new Error(
          "Rechargez la page pour préparer l’application, puis réessayez.",
        );
      await registration.update();
      const worker = registration.installing;
      if (
        worker &&
        worker.state !== "installed" &&
        worker.state !== "redundant"
      ) {
        await new Promise((resolve) => {
          const finish = () => {
            clearTimeout(timeout);
            worker.removeEventListener("statechange", changed);
            resolve();
          };
          const changed = () => {
            if (["installed", "redundant"].includes(worker.state)) finish();
          };
          const timeout = setTimeout(finish, 10000);
          worker.addEventListener("statechange", changed);
        });
      }
      if (registration.waiting) {
        setUpdateReady(registration);
        setInstallStatus(
          "Une mise à jour est prête. Appliquez-la ci-dessous, puis relancez l’installation.",
        );
      } else {
        setInstallPrompt(window.__mycInstallPrompt || null);
        setInstallStatus(
          window.__mycInstallPrompt
            ? "Installation disponible. Touchez Installer MYC maintenant."
            : "La vérification est terminée. Si aucun bouton d’installation n’apparaît, utilisez le menu ⋮ de Chrome : Ajouter à l’écran d’accueil → Installer.",
        );
      }
    } catch (error) {
      setInstallStatus(error.message);
    } finally {
      setCheckingInstall(false);
    }
  };
  const filtered = records.filter(
    (r) =>
      (filter === "all" || r.department === filter) &&
      (!from || r.general.date >= from) &&
      (!to || r.general.date <= to) &&
      [
        r.general.of,
        r.general.article,
        r.general.client,
        r.general.chain,
        department(r.department).name,
      ]
        .join(" ")
        .toLocaleLowerCase("fr")
        .includes(search.toLocaleLowerCase("fr")),
  );
  const daily = records.filter((r) => r.general.date === today),
    dailyTotal = daily.reduce((s, r) => s + totals(r).produced, 0),
    pending = records.filter((r) => r._pending).length;
  const csv = () => {
    const cell = (v) =>
      '"' +
      String(v ?? "")
        .replace(/^[=+@\-\t\r]/, "'$&")
        .replaceAll('"', '""') +
      '"';
    const rows = [
      [
        "Date",
        "Département",
        "OF",
        "Article",
        "Poste",
        "Équipe",
        "OK",
        "NOK",
        "Taux de rebut (%)",
        "Arrêts (min)",
      ],
      ...filtered.map((r) => {
        const t = totals(r);
        return [
          r.general.date,
          department(r.department).name,
          r.general.of,
          r.general.article,
          r.general.chain,
          r.general.shift,
          t.ok,
          t.nok,
          t.rate.toFixed(2),
          t.stops,
        ];
      }),
    ];
    const url = URL.createObjectURL(
      new Blob(
        ["\ufeff" + rows.map((row) => row.map(cell).join(";")).join("\r\n")],
        { type: "text/csv;charset=utf-8" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `MYC-registre-${today}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };
  return (
    <div className="app">
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => navigate("home")}
          aria-label="Accueil MYC"
        >
          <span className="brand-mark">
            MYC<span>®</span>
          </span>
          <span className="brand-caption">BEAUTY INNOVATION</span>
        </button>
        <div className="workspace-label">ESPACE PRODUCTION</div>
        <nav>
          {[
            ["home", LayoutGrid, "Vue d’ensemble"],
            ["entry", ClipboardPenLine, "Saisie de production"],
            ["history", FolderOpen, "Rapports & historique"],
          ].map(([id, Icon, label]) => (
            <button
              key={id}
              className={page === id ? "active" : ""}
              onClick={() => navigate(id)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {page === id && <i />}
            </button>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <div className="workspace-label">LES DÉPARTEMENTS</div>
        <div className="side-departments">
          {DEPARTMENTS.map((x) => (
            <button
              key={x.id}
              onClick={() => choose(x.id)}
              className={
                page === "entry" && form.department === x.id ? "selected" : ""
              }
            >
              <i style={{ background: x.color }} />
              {x.name}
              <ChevronRight size={14} />
            </button>
          ))}
        </div>
        <div className="sidebar-bottom">
          <div className="plant-mark">
            <Factory size={22} />
            <span>
              MYC · Tunisie<small>Suivi des ateliers</small>
            </span>
          </div>
          <button className="install-link" onClick={install}>
            <Smartphone size={17} />{" "}
            {installed ? "Application installée" : "Installer l’application"}{" "}
            <Download size={14} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            Espace production <ChevronRight size={14} />
            <strong>
              {page === "home"
                ? "Vue d’ensemble"
                : page === "entry"
                  ? d.name
                  : "Rapports"}
            </strong>
          </div>
          <div className="topbar-right">
            <span className={`connection ${!online ? "offline" : ""}`}>
              <i />
              {!online
                ? "Hors connexion"
                : configured
                  ? "Espace partagé"
                  : "Sur cet appareil"}
            </span>
            <span className="today">
              {new Date().toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span className="avatar">MYC</span>
          </div>
        </header>
        {(!online || pending > 0) && (
          <div className="network-banner">
            <WifiOff size={16} />
            {!online
              ? "Vous pouvez continuer la saisie hors connexion."
              : `${pending} fiche(s) en attente de synchronisation.`}
            {online && pending > 0 && (
              <button disabled={busy} onClick={refresh}>
                Synchroniser
              </button>
            )}
          </div>
        )}
        {(updateReady || versionActive) && (
          <div className="network-banner" role="status">
            <RefreshCw size={16} /> Une nouvelle version de MYC est prête. Votre
            brouillon sera conservé.
            <button onClick={applyUpdate} disabled={updating}>
              {updating ? "Mise à jour…" : "Mettre à jour"}
            </button>
          </div>
        )}
        <main>
          {page === "home" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">ATELIERS & PERFORMANCE</div>
                  <h1>
                    La production, en clair<span>.</span>
                  </h1>
                  <p>Un espace pour vos équipes. Chaque saisie compte.</p>
                </div>
                <span className="access-pill">
                  <CircleCheck size={16} /> Accès direct · sans connexion
                </span>
              </div>
              <section className="welcome-panel">
                <div className="welcome-copy">
                  <span className="kicker">DU TERRAIN AU RAPPORT</span>
                  <h2>
                    Votre atelier.
                    <br />
                    Votre suivi quotidien.
                  </h2>
                  <p>
                    Sélectionnez un département, renseignez votre production et
                    retrouvez un rapport prêt à partager.
                  </p>
                  <a href="#departments" className="primary">
                    Choisir mon département <ArrowRight size={17} />
                  </a>
                  <div className="welcome-foot">
                    <span>
                      <Check size={14} /> Production & qualité
                    </span>
                    <span>
                      <Check size={14} /> PDF en un clic
                    </span>
                  </div>
                </div>
                <div className="report-illustration" aria-hidden="true">
                  <div className="paper">
                    <div className="paper-head">
                      <strong>MYC</strong>
                      <span>RAPPORT D’ATELIER</span>
                    </div>
                    <div className="paper-label">PRODUCTION JOURNALIÈRE</div>
                    <h3>La précision à chaque étape.</h3>
                    <div className="paper-lines">
                      <i />
                      <i />
                    </div>
                    <div className="paper-chart">
                      {[38, 61, 48, 78, 67, 90, 74, 100].map((n, i) => (
                        <span key={i} style={{ height: n + "%" }} />
                      ))}
                    </div>
                    <div className="paper-bottom">
                      <span>PRODUCTION</span>
                      <span>QUALITÉ</span>
                      <span>TRAÇABILITÉ</span>
                    </div>
                  </div>
                  <div className="floating-label">
                    <span>
                      <FileText size={22} />
                    </span>
                    <div>
                      Des rapports soignés
                      <small>Prêts à télécharger et à imprimer</small>
                    </div>
                    <CircleCheck size={20} />
                  </div>
                </div>
              </section>
              <section id="departments">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">01 / COMMENCER</span>
                    <h2>Choisissez votre département</h2>
                  </div>
                  <span className="muted">4 ateliers, un même outil</span>
                </div>
                <div className="department-grid">
                  {DEPARTMENTS.map((x, i) => {
                    const Icon = ICONS[x.id];
                    return (
                      <button
                        className="department-card"
                        key={x.id}
                        style={{ "--department": x.color }}
                        onClick={() => choose(x.id)}
                      >
                        <div className="department-card-top">
                          <span className="department-icon">
                            <Icon size={26} />
                          </span>
                          <span className="department-code">
                            0{i + 1} / {x.short}
                          </span>
                        </div>
                        <h3>{x.name}</h3>
                        <p>{x.description}</p>
                        <div className="department-card-bottom">
                          <span>
                            {draft(x.id)
                              ? "Reprendre la saisie"
                              : "Commencer la saisie"}
                          </span>
                          <ArrowRight size={18} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
              <section className="activity-strip">
                <div>
                  <span className="activity-icon">
                    <BarChart3 size={23} />
                  </span>
                  <div>
                    <h3>Le point du jour</h3>
                    <p>
                      {dateLabel(today)} ·{" "}
                      {configured
                        ? "Fiches disponibles"
                        : "Données de cet appareil"}
                    </p>
                  </div>
                </div>
                <Metric
                  label="Fiches enregistrées"
                  value={format(daily.length)}
                />
                <Metric label="Pièces produites" value={format(dailyTotal)} />
                <button
                  className="text-button"
                  onClick={() => navigate("history")}
                >
                  Voir les rapports <ArrowRight size={16} />
                </button>
              </section>
            </>
          )}
          {page === "entry" && (
            <>
              <div className="page-heading">
                <div>
                  <button
                    className="back-link"
                    onClick={() => navigate("home")}
                  >
                    <ArrowLeft size={14} /> Changer de département
                  </button>
                  <div className="eyebrow">{d.short} / FICHE D’ATELIER</div>
                  <h1>
                    {d.name}
                    <span>.</span>
                  </h1>
                  <p>
                    {form.id
                      ? "Modification de votre fiche de production."
                      : "Votre production, heure par heure."}
                  </p>
                </div>
                <div className="heading-actions">
                  <span className="draft-badge">
                    <i />
                    {form.id ? "Fiche enregistrée" : "Brouillon automatique"}
                  </span>
                  <button className="secondary" onClick={() => setModal("new")}>
                    <Plus size={16} /> Nouvelle fiche
                  </button>
                </div>
              </div>
              <div className="metrics-grid">
                <Metric
                  label="Pièces conformes"
                  value={format(stats.ok)}
                  unit="OK"
                  accent="green"
                />
                <Metric
                  label="Pièces rejetées"
                  value={format(stats.nok)}
                  unit="NOK"
                />
                <Metric
                  label="Taux de rebut"
                  value={format(stats.rate)}
                  unit="%"
                />
                <Metric
                  label="Temps d’arrêt"
                  value={format(stats.stops)}
                  unit="min"
                />
              </div>
              <div
                className="tabs"
                role="tablist"
                aria-label="Étapes de saisie"
              >
                {[
                  ["production", "01", "Production"],
                  ["quality", "02", "Contrôle qualité"],
                  ["summary", "03", "Synthèse & rapport"],
                ].map(([id, n, label]) => (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={tab === id}
                    className={tab === id ? "active" : ""}
                    onClick={() => setTab(id)}
                  >
                    <span>{n}</span>
                    {label}
                  </button>
                ))}
              </div>
              {tab === "production" && (
                <>
                  <section className="card">
                    <div className="card-heading">
                      <div>
                        <span className="eyebrow">IDENTIFICATION</span>
                        <h2>Informations générales</h2>
                      </div>
                      <span className="muted small">* Champs obligatoires</span>
                    </div>
                    <div className="field-grid">
                      {field("Date", "date", "date", true)}
                      {field(
                        "Référence article",
                        "article",
                        "text",
                        true,
                        "Ex. MYC-2048",
                      )}
                      {field(
                        "Ordre de fabrication",
                        "of",
                        "text",
                        true,
                        "Ex. OF-2026-001",
                      )}
                      {field(
                        d.machine,
                        "chain",
                        "text",
                        true,
                        `Ex. ${d.example}`,
                      )}
                      {field(
                        "Équipe / shift",
                        "shift",
                        "text",
                        true,
                        "Ex. Équipe A",
                      )}
                      {field(
                        "Matricule opérateur",
                        "matricule",
                        "text",
                        false,
                        "Ex. 1024",
                      )}
                      {field(
                        "Client",
                        "client",
                        "text",
                        false,
                        "Nom du client",
                      )}
                      {field(
                        "Objectif / heure",
                        "cadence",
                        "number",
                        false,
                        "Pièces / h",
                      )}
                    </div>
                    <details className="more-fields">
                      <summary>Informations complémentaires</summary>
                      <div className="field-grid">
                        {field("Lot matière", "lot")}
                        {field("Compteur début", "counterStart", "number")}
                        {field("Compteur fin", "counterEnd", "number")}
                        {field("Numéro de carton", "carton")}
                        {form.department === "injection" && (
                          <>
                            {field("Référence moule", "mold")}
                            {field("Matière", "material")}
                          </>
                        )}
                        {form.department === "metallisation" &&
                          field("Vitesse de ligne", "speed", "number")}
                        {form.department === "serigraphie" &&
                          field("Couleur / encre", "color")}
                      </div>
                    </details>
                  </section>
                  <section className="card hourly-section">
                    <div className="card-heading">
                      <div>
                        <span className="eyebrow">RELEVÉS TERRAIN</span>
                        <h2>Production par heure</h2>
                      </div>
                      <span className="small muted">
                        <Clock3 size={14} /> {form.hours.length} créneaux
                      </span>
                    </div>
                    <div className="hour-table-head">
                      <span>CRÉNEAU</span>
                      <span>QUANTITÉ OK</span>
                      <span>QUANTITÉ NOK</span>
                      <span>OBSERVATIONS & ARRÊTS</span>
                      <span />
                    </div>
                    <div className="hours">
                      {form.hours.map((h, i) => (
                        <div className="hour-row" key={i}>
                          <div className="hour-main">
                            <label className="hour-time">
                              <span>Heure</span>
                              <input
                                aria-label={`Heure du relevé ${i + 1}`}
                                type="time"
                                value={h.time}
                                onChange={(e) =>
                                  setHour(i, "time", e.target.value)
                                }
                              />
                            </label>
                            <label>
                              <span>Quantité OK</span>
                              <input
                                aria-label={`Quantité OK ${h.time}`}
                                type="number"
                                min="0"
                                step="1"
                                placeholder="0"
                                value={h.ok}
                                onChange={(e) =>
                                  setHour(i, "ok", e.target.value)
                                }
                              />
                            </label>
                            <label>
                              <span>Quantité NOK</span>
                              <input
                                aria-label={`Quantité NOK ${h.time}`}
                                type="number"
                                min="0"
                                step="1"
                                placeholder="0"
                                value={h.nok}
                                onChange={(e) =>
                                  setHour(i, "nok", e.target.value)
                                }
                              />
                            </label>
                            <div className="hour-comment">
                              <input
                                aria-label={`Observation ${h.time}`}
                                placeholder="Une observation à ajouter…"
                                value={h.comment}
                                onChange={(e) =>
                                  setHour(i, "comment", e.target.value)
                                }
                              />
                              <button
                                className="text-button"
                                onClick={() =>
                                  setHour(i, "stoppages", [
                                    ...h.stoppages,
                                    { code: "", duration: "", comment: "" },
                                  ])
                                }
                              >
                                <Plus size={14} /> Arrêt
                              </button>
                            </div>
                            <button
                              className="icon-button remove-hour"
                              aria-label={`Supprimer le créneau ${h.time}`}
                              onClick={() => setModal({ removeHour: i })}
                              disabled={form.hours.length === 1}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                          {h.stoppages.length > 0 && (
                            <div className="stoppages">
                              {h.stoppages.map((s, j) => (
                                <div className="stop-row" key={j}>
                                  <span className="small muted">
                                    Arrêt {j + 1}
                                  </span>
                                  <select
                                    aria-label={`Code arrêt ${j + 1} à ${h.time}`}
                                    value={s.code}
                                    onChange={(e) =>
                                      setStop(i, j, "code", e.target.value)
                                    }
                                  >
                                    <option value="">Code</option>
                                    {CODES.map((c) => (
                                      <option key={c}>{c}</option>
                                    ))}
                                  </select>
                                  <input
                                    aria-label={`Durée arrêt ${j + 1} à ${h.time}`}
                                    type="number"
                                    min="1"
                                    max="60"
                                    placeholder="Minutes"
                                    value={s.duration}
                                    onChange={(e) =>
                                      setStop(i, j, "duration", e.target.value)
                                    }
                                  />
                                  <input
                                    aria-label={`Motif arrêt ${j + 1} à ${h.time}`}
                                    placeholder="Motif de l’arrêt"
                                    value={s.comment}
                                    onChange={(e) =>
                                      setStop(i, j, "comment", e.target.value)
                                    }
                                  />
                                  <button
                                    className="icon-button"
                                    aria-label={`Supprimer arrêt ${j + 1} à ${h.time}`}
                                    onClick={() =>
                                      setHour(
                                        i,
                                        "stoppages",
                                        h.stoppages.filter((_, k) => k !== j),
                                      )
                                    }
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="table-footer">
                      <button
                        className="secondary"
                        disabled={form.hours.length >= 24}
                        onClick={() => setForm(addHour)}
                      >
                        <Plus size={16} /> Ajouter un créneau
                      </button>
                      <span>{format(stats.produced)} pièces au total</span>
                    </div>
                  </section>
                </>
              )}
              {tab === "quality" && (
                <section className="card">
                  <div className="card-heading">
                    <div>
                      <span className="eyebrow">CONTRÔLE QUALITÉ</span>
                      <h2>Les défauts observés</h2>
                      <p>
                        Relevez les occurrences par créneau. Une pièce peut
                        présenter plusieurs défauts.
                      </p>
                    </div>
                    <button
                      className="secondary"
                      onClick={() => setModal("defect")}
                    >
                      <Plus size={16} /> Ajouter un défaut
                    </button>
                  </div>
                  <div className="table-scroll">
                    <table className="quality-table">
                      <thead>
                        <tr>
                          <th>Type de défaut</th>
                          {form.hours.map((h, i) => (
                            <th key={i}>{h.time}</th>
                          ))}
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.quality.map((q, qi) => (
                          <tr key={qi}>
                            <th>{q.name}</th>
                            {q.values.map((v, vi) => (
                              <td key={vi}>
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  placeholder="—"
                                  aria-label={`${q.name} à ${form.hours[vi]?.time}`}
                                  value={v}
                                  onChange={(e) =>
                                    setForm((f) => ({
                                      ...f,
                                      quality: f.quality.map((row, k) =>
                                        k === qi
                                          ? {
                                              ...row,
                                              values: row.values.map((n, l) =>
                                                l === vi ? e.target.value : n,
                                              ),
                                            }
                                          : row,
                                      ),
                                    }))
                                  }
                                />
                              </td>
                            ))}
                            <td>
                              <strong>
                                {format(
                                  q.values.reduce((a, v) => a + number(v), 0),
                                )}
                              </strong>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <th>Total des occurrences</th>
                          {form.hours.map((_, i) => (
                            <td key={i}>
                              {format(
                                form.quality.reduce(
                                  (a, q) => a + number(q.values[i]),
                                  0,
                                ),
                              )}
                            </td>
                          ))}
                          <td>{format(stats.defects)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <div className="info-note">
                    <FileText size={17} />
                    <span>
                      Le taux de rebut est calculé sur les pièces NOK / (OK +
                      NOK). Les occurrences de défauts sont comptées séparément.
                    </span>
                  </div>
                </section>
              )}
              {tab === "summary" && (
                <>
                  <div className="summary-grid">
                    <section className="card">
                      <div className="card-heading">
                        <div>
                          <span className="eyebrow">VOTRE DOCUMENT</span>
                          <h2>Un rapport prêt à partager</h2>
                        </div>
                        <FileText size={28} />
                      </div>
                      <div className="report-id">
                        <span>
                          {d.name} · {dateLabel(form.general.date)}
                        </span>
                        <strong>
                          {form.general.of ||
                            "Ordre de fabrication à renseigner"}
                        </strong>
                        <p>
                          {form.general.article || "Article à renseigner"} ·{" "}
                          {form.general.chain || "Poste à renseigner"} ·{" "}
                          {form.general.shift || "Équipe à renseigner"}
                        </p>
                      </div>
                      <ul className="report-features">
                        <li>
                          <Check size={17} /> Synthèse de production et
                          indicateurs
                        </li>
                        <li>
                          <Check size={17} /> Relevés horaires et détail des
                          arrêts
                        </li>
                        <li>
                          <Check size={17} /> Grille qualité et principaux
                          défauts
                        </li>
                        <li>
                          <Check size={17} /> Pagination automatique et zones de
                          visa
                        </li>
                      </ul>
                      <button
                        className="primary"
                        disabled={exporting}
                        onClick={() => exportPdf(form)}
                      >
                        <Download size={17} />
                        {exporting
                          ? "Préparation…"
                          : "Télécharger le rapport PDF"}
                      </button>
                    </section>
                    <section className="card">
                      <div className="card-heading">
                        <div>
                          <span className="eyebrow">LECTURE RAPIDE</span>
                          <h2>Répartition de la production</h2>
                        </div>
                      </div>
                      <div className="yield-value">
                        {format(stats.produced ? 100 - stats.rate : 0)}
                        <small>% conformes</small>
                      </div>
                      <div className="yield-track">
                        <span
                          style={{
                            width: `${stats.produced ? 100 - stats.rate : 0}%`,
                          }}
                        />
                      </div>
                      <div className="legend">
                        <span>
                          <i />
                          {format(stats.ok)} pièces OK
                        </span>
                        <span>
                          <i />
                          {format(stats.nok)} pièces NOK
                        </span>
                      </div>
                      <div className="summary-line">
                        <span>Occurrences de défauts</span>
                        <strong>{format(stats.defects)}</strong>
                      </div>
                      <div className="summary-line">
                        <span>Arrêts de production</span>
                        <strong>{format(stats.stops)} min</strong>
                      </div>
                      <div className="summary-line">
                        <span>Créneaux renseignés</span>
                        <strong>
                          {
                            form.hours.filter(
                              (h) => h.ok !== "" || h.nok !== "",
                            ).length
                          }{" "}
                          / {form.hours.length}
                        </strong>
                      </div>
                    </section>
                  </div>
                  <section className="card">
                    <label className="field">
                      <span>Observations de fin de poste</span>
                      <textarea
                        rows={4}
                        value={form.general.notes}
                        placeholder="Événements marquants, consignes pour l’équipe suivante…"
                        onChange={(e) => setGeneral("notes", e.target.value)}
                      />
                    </label>
                  </section>
                </>
              )}
              <div className="actionbar">
                <span className="small muted">
                  <CircleCheck size={16} /> Brouillon conservé sur cet appareil
                </span>
                <div>
                  <button
                    className="secondary"
                    disabled={exporting}
                    onClick={() => exportPdf(form)}
                  >
                    <Download size={17} />
                    <span>Rapport PDF</span>
                  </button>
                  {tab !== "summary" && (
                    <button
                      className="secondary next-step"
                      onClick={() =>
                        setTab(tab === "production" ? "quality" : "summary")
                      }
                    >
                      Continuer
                      <ArrowRight size={16} />
                    </button>
                  )}
                  <button className="primary" disabled={busy} onClick={save}>
                    <Save size={17} />
                    {busy ? "Enregistrement…" : "Enregistrer la fiche"}
                  </button>
                </div>
              </div>
            </>
          )}
          {page === "history" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">TRAÇABILITÉ / TOUS LES ATELIERS</div>
                  <h1>
                    Rapports & historique<span>.</span>
                  </h1>
                  <p>
                    Retrouvez vos fiches, consultez les résultats et partagez
                    vos rapports.
                  </p>
                </div>
                <button className="primary" onClick={() => navigate("home")}>
                  <Plus size={17} /> Nouvelle saisie
                </button>
              </div>
              <section className="card history-card">
                <div className="card-heading">
                  <h2>
                    Registre de production{" "}
                    <span className="count">{filtered.length}</span>
                  </h2>
                  <div className="heading-actions">
                    <button
                      className="secondary"
                      onClick={refresh}
                      disabled={busy}
                    >
                      <RefreshCw size={16} className={busy ? "spin" : ""} />{" "}
                      Actualiser
                    </button>
                    <button
                      className="secondary"
                      onClick={csv}
                      disabled={!filtered.length}
                    >
                      <Download size={16} /> CSV
                    </button>
                  </div>
                </div>
                <div className="filters">
                  <label className="search">
                    <Search size={17} />
                    <input
                      aria-label="Rechercher une fiche"
                      placeholder="Rechercher un OF, article, client…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Département</span>
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option value="all">Tous les départements</option>
                      {DEPARTMENTS.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Field
                    label="Du"
                    type="date"
                    value={from}
                    onChange={setFrom}
                  />
                  <Field label="Au" type="date" value={to} onChange={setTo} />
                </div>
                <div className="table-scroll">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Date / OF</th>
                        <th>Département</th>
                        <th>Article / poste</th>
                        <th>Production</th>
                        <th>Rebut</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => {
                        const t = totals(r),
                          rd = department(r.department);
                        return (
                          <tr key={r.id}>
                            <td data-label="Date / OF">
                              <strong>{r.general.of}</strong>
                              <small>
                                {dateLabel(r.general.date)}
                                {r._pending ? " · En attente" : ""}
                              </small>
                            </td>
                            <td data-label="Département">
                              <span
                                className="department-tag"
                                style={{ "--department": rd.color }}
                              >
                                <i />
                                {rd.name}
                              </span>
                            </td>
                            <td data-label="Article / poste">
                              <strong>{r.general.article}</strong>
                              <small>
                                {r.general.chain} · {r.general.shift}
                              </small>
                            </td>
                            <td data-label="Production">
                              <strong>{format(t.produced)}</strong>
                              <small>
                                {format(t.ok)} OK / {format(t.nok)} NOK
                              </small>
                            </td>
                            <td data-label="Rebut">
                              <span
                                className={t.rate > 5 ? "rate warning" : "rate"}
                              >
                                {format(t.rate)} %
                              </span>
                            </td>
                            <td className="row-actions">
                              <button
                                className="text-button"
                                onClick={() => open(r)}
                              >
                                Ouvrir <ArrowRight size={14} />
                              </button>
                              <button
                                className="icon-button"
                                aria-label={`PDF ${r.general.of}`}
                                disabled={exporting}
                                onClick={() => exportPdf(r)}
                              >
                                <Download size={18} />
                              </button>
                              <button
                                className="icon-button danger"
                                aria-label={`Supprimer ${r.general.of}`}
                                onClick={() => setPendingDelete(r)}
                              >
                                <Trash2 size={17} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {!filtered.length && (
                  <div className="empty-state">
                    <FolderOpen size={38} />
                    <h3>
                      {records.length
                        ? "Aucune fiche pour ces critères"
                        : "Votre historique commence ici"}
                    </h3>
                    <p>
                      {records.length
                        ? "Modifiez vos filtres pour retrouver vos saisies."
                        : "Les fiches enregistrées apparaîtront dans ce registre."}
                    </p>
                    <button
                      className="secondary"
                      onClick={() => navigate("home")}
                    >
                      Choisir un département <ArrowRight size={16} />
                    </button>
                  </div>
                )}
                <div className="registry-footer">
                  {filtered.length} fiche(s) ·{" "}
                  {format(filtered.reduce((a, r) => a + totals(r).produced, 0))}{" "}
                  pièces produites
                  <span>
                    {configured
                      ? "Données partagées entre ateliers"
                      : "Données conservées sur cet appareil"}
                  </span>
                </div>
              </section>
            </>
          )}
          <footer>
            <span>
              MYC <b>BEAUTY INNOVATION</b>
              <i /> Tunisie
            </span>
            <span>La précision, à chaque étape.</span>
          </footer>
        </main>
      </div>
      <nav className="mobile-nav">
        {[
          ["home", LayoutGrid, "Ateliers"],
          ["entry", ClipboardPenLine, "Saisie"],
          ["history", FolderOpen, "Rapports"],
        ].map(([id, Icon, label]) => (
          <button
            key={id}
            className={page === id ? "active" : ""}
            onClick={() => navigate(id)}
          >
            <Icon size={21} />
            <span>{label}</span>
          </button>
        ))}
        <button onClick={install}>
          <Smartphone size={21} />
          <span>{installed ? "Installée" : "Installer"}</span>
        </button>
      </nav>
      {notice && (
        <div
          role={notice.error ? "alert" : "status"}
          className={`toast ${notice.error ? "toast-error" : ""}`}
        >
          {notice.error ? (
            <TriangleAlert size={20} />
          ) : (
            <CircleCheck size={20} />
          )}
          <span>{notice.text}</span>
          <button
            onClick={() => setNotice(null)}
            aria-label="Fermer la notification"
          >
            <X size={17} />
          </button>
        </div>
      )}
      {pendingDelete && (
        <Modal
          title="Supprimer cette fiche ?"
          onClose={() => setPendingDelete(null)}
        >
          <p>
            La fiche <strong>{pendingDelete.general.of}</strong> du{" "}
            {dateLabel(pendingDelete.general.date)} et ses relevés seront
            supprimés définitivement.
          </p>
          <div className="modal-actions">
            <button
              className="secondary"
              onClick={() => setPendingDelete(null)}
            >
              Annuler
            </button>
            <button
              className="primary destructive"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await removeRecord(pendingDelete);
                  setRecords(localRecords());
                  if (form.id === pendingDelete.id)
                    setForm(blank(form.department));
                  setPendingDelete(null);
                  notify("Fiche supprimée.");
                } catch (e) {
                  notify(e.message, true);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Supprimer la fiche
            </button>
          </div>
        </Modal>
      )}
      {modal === "new" && (
        <Modal
          title="Commencer une nouvelle fiche ?"
          onClose={() => setModal(null)}
        >
          <p>
            Le brouillon actuel de {d.name} sera remplacé. Enregistrez-le
            d’abord si vous souhaitez le conserver dans l’historique.
          </p>
          <div className="modal-actions">
            <button className="secondary" onClick={() => setModal(null)}>
              Revenir à la saisie
            </button>
            <button className="primary" onClick={fresh}>
              Nouvelle fiche
            </button>
          </div>
        </Modal>
      )}
      {modal === "install" && (
        <Modal title="MYC sur votre téléphone" onClose={() => setModal(null)}>
          <div className="install-visual">
            <Smartphone size={42} />
            <span>Votre atelier, à portée de main.</span>
          </div>
          <div className="modal-actions">
            <a
              className="primary"
              href="/downloads/MYC-Production-1.0.0.apk"
              download="MYC-Production-1.0.0.apk"
            >
              <Download size={16} /> Télécharger MYC Android (.apk)
            </a>
          </div>
          <p>
            Sur Android : ouvrez le fichier téléchargé, autorisez cette source
            si Android le demande, puis touchez <strong>Installer</strong>. Sur
            iPhone, utilisez le parcours Safari ci-dessous.
          </p>
          {installPrompt && (
            <div className="modal-actions">
              <button className="primary" onClick={install}>
                <Download size={16} /> Installer MYC maintenant
              </button>
            </div>
          )}
          {!installPrompt && window.isSecureContext && (
            <p>
              Votre navigateur n’a pas proposé l’installation. Vous pouvez aussi
              l’installer directement depuis son menu :
            </p>
          )}
          {/iPhone|iPad|iPod/.test(navigator.userAgent) ||
          (navigator.platform === "MacIntel" &&
            navigator.maxTouchPoints > 1) ? (
            <ol className="install-steps">
              <li>
                Ouvrez MYC dans <strong>Safari</strong>.
              </li>
              <li>
                Touchez <strong>Partager</strong>, puis{" "}
                <strong>Sur l’écran d’accueil</strong>.
              </li>
              <li>
                Confirmez avec <strong>Ajouter</strong>.
              </li>
            </ol>
          ) : (
            <ol className="install-steps">
              <li>
                Dans Chrome, ouvrez le menu <strong>⋮ en haut à droite</strong>.
              </li>
              <li>
                Touchez <strong>Ajouter à l’écran d’accueil</strong> ou{" "}
                <strong>Installer l’application</strong>.
              </li>
              <li>
                Choisissez <strong>Installer</strong> et confirmez.
              </li>
            </ol>
          )}
          <p>
            L’icône MYC apparaîtra sur votre téléphone. Ouvrez-la pour utiliser
            l’application.
          </p>
          {!window.isSecureContext && (
            <p role="alert">
              <strong>Installation indisponible à cette adresse.</strong> Ouvrez
              la version HTTPS de MYC pour installer l’application. Le lien
              Wi-Fi en HTTP permet seulement de consulter le site.
            </p>
          )}
          {window.isSecureContext && import.meta.env.DEV && (
            <p>
              Vous consultez le serveur de développement. L’installation et le
              mode hors connexion sont disponibles dans la version compilée et
              publiée en HTTPS.
            </p>
          )}
          <p>
            <strong>Sur Android, si l’installation ne s’affiche pas :</strong>{" "}
            ouvrez ce lien dans Chrome en navigation normale, désactivez «
            Version pour ordinateur » dans le menu ⋮, puis rechargez la page. Si
            MYC est déjà installée, ouvrez-la depuis son icône.
          </p>
          <p role="status" aria-live="polite">
            {installStatus}
          </p>
          <p>
            <a href="/installer.html">Ouvrir la page d’installation dédiée</a>
          </p>
          <div className="modal-actions">
            {updateReady?.waiting || versionActive ? (
              <button
                className="primary"
                disabled={updating}
                onClick={applyUpdate}
              >
                {updating ? "Mise à jour…" : "Appliquer la mise à jour"}
              </button>
            ) : (
              <button
                className="secondary"
                disabled={checkingInstall}
                onClick={checkInstallation}
              >
                <RefreshCw size={16} />{" "}
                {checkingInstall ? "Vérification…" : "Vérifier la mise à jour"}
              </button>
            )}
          </div>
        </Modal>
      )}
      {modal === "defect" && (
        <Modal title="Ajouter un type de défaut" onClose={() => setModal(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const name = new FormData(e.currentTarget).get("name").trim();
              if (!name) return;
              if (
                form.quality.some(
                  (q) =>
                    q.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
                )
              ) {
                notify("Ce défaut existe déjà.", true);
                return;
              }
              setForm((f) => ({
                ...f,
                quality: [
                  ...f.quality,
                  { name, values: f.hours.map(() => "") },
                ],
              }));
              setModal(null);
            }}
          >
            <label className="field">
              <span>Libellé du défaut</span>
              <input
                name="name"
                required
                maxLength={80}
                autoFocus
                placeholder="Ex. Défaut d’adhérence"
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setModal(null)}
              >
                Annuler
              </button>
              <button className="primary">Ajouter le défaut</button>
            </div>
          </form>
        </Modal>
      )}
      {modal && typeof modal === "object" && "removeHour" in modal && (
        <Modal title="Supprimer ce créneau ?" onClose={() => setModal(null)}>
          <p>
            Les quantités, arrêts et défauts associés à{" "}
            {form.hours[modal.removeHour].time} seront retirés de la fiche.
          </p>
          <div className="modal-actions">
            <button className="secondary" onClick={() => setModal(null)}>
              Annuler
            </button>
            <button
              className="primary destructive"
              onClick={() => {
                const index = modal.removeHour;
                setForm((f) => ({
                  ...f,
                  hours: f.hours.filter((_, i) => i !== index),
                  quality: f.quality.map((q) => ({
                    ...q,
                    values: q.values.filter((_, i) => i !== index),
                  })),
                }));
                setModal(null);
              }}
            >
              Supprimer le créneau
            </button>
          </div>
        </Modal>
      )}
      {pdfPreview && (
        <Modal
          title="Votre rapport PDF est prêt"
          onClose={() => {
            URL.revokeObjectURL(pdfPreview.url);
            setPdfPreview(null);
          }}
        >
          <p className="pdf-preview-help">
            Téléchargez le fichier ou ouvrez-le dans votre navigateur. Sur
            iPhone ou iPad, utilisez ensuite <strong>Partager</strong> puis
            <strong> Enregistrer dans Fichiers</strong>.
          </p>
          <iframe
            className="pdf-preview-frame"
            src={pdfPreview.url}
            title="Aperçu du rapport de production"
          />
          <div className="modal-actions pdf-preview-actions">
            <a
              className="primary"
              href={pdfPreview.url}
              download={pdfPreview.filename}
            >
              <Download size={16} /> Télécharger le PDF
            </a>
            <a
              className="secondary"
              href={pdfPreview.url}
              target="_blank"
              rel="noreferrer"
            >
              Ouvrir le rapport
            </a>
          </div>
        </Modal>
      )}
    </div>
  );
}
