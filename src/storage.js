import { supabase, configured } from "./supabase";
import { normalize } from "./model";
export function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
export function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
export const localRecords = () => read("myc-records", []).map(normalize);
export const draftKey = (id) => `myc-draft-${id}`;
export function draft(id) {
  const saved = read(draftKey(id), null);
  if (saved) return normalize(saved);
  const legacy = read("myc-draft", null);
  return id === "metallisation" && legacy ? normalize(legacy) : null;
}
function cache(record) {
  const all = [record, ...localRecords().filter((r) => r.id !== record.id)];
  write("myc-records", all);
  return all;
}
export async function saveRecord(form) {
  const payload = {
    ...form,
    id: form.id || crypto.randomUUID(),
    updated_at: new Date().toISOString(),
    _pending: configured,
  };
  cache(payload); // Preserve data on device before attempting the network.
  if (configured && navigator.onLine) {
    try {
      const { error } = await supabase.rpc("save_myc_metallisation_report", {
        payload,
      });
      if (error) throw error;
      payload._pending = false;
      // A newer edit may have been saved while this request was in flight.
      if (
        localRecords().find((r) => r.id === payload.id)?.updated_at ===
        payload.updated_at
      )
        cache(payload);
    } catch (error) {
      return {
        record: payload,
        warning: `Conservé sur cet appareil. Synchronisation en attente : ${error.message}`,
      };
    }
  }
  return {
    record: payload,
    warning: payload._pending
      ? "Conservé hors connexion. Synchronisez au retour du réseau."
      : "",
  };
}
export async function loadRecords() {
  if (!configured || !navigator.onLine) return localRecords();
  const before = new Map(localRecords().map((r) => [r.id, r.updated_at]));
  let result = [],
    from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("myc_metallisation_reports")
      .select("id,record_data,created_at,updated_at")
      .order("created_at", { ascending: false })
      .order("id")
      .range(from, from + 499);
    if (error) throw error;
    result.push(
      ...data.map((x) =>
        normalize({
          ...x.record_data,
          id: x.id,
          created_at: x.created_at,
          updated_at: x.updated_at,
          _pending: false,
        }),
      ),
    );
    if (data.length < 500) break;
    from += 500;
  }
  const pending = localRecords().filter(
    (r) => r._pending || r.updated_at !== before.get(r.id),
  );
  result = [
    ...pending,
    ...result.filter((r) => !pending.some((p) => p.id === r.id)),
  ];
  write("myc-records", result);
  return result;
}
let synchronization;
export function syncRecords() {
  if (!configured || !navigator.onLine) return Promise.resolve();
  if (synchronization) return synchronization;
  synchronization = (async () => {
    for (const record of localRecords().filter((r) => r._pending)) {
      const latest = localRecords().find((r) => r.id === record.id);
      if (!latest?._pending) continue;
      const result = await saveRecord(latest);
      if (result.warning) throw new Error(result.warning);
    }
  })().finally(() => {
    synchronization = undefined;
  });
  return synchronization;
}
export async function removeRecord(record) {
  if (configured) {
    if (!navigator.onLine)
      throw new Error("Reconnectez-vous pour supprimer une fiche partagée.");
    const { error } = await supabase
      .from("myc_metallisation_reports")
      .delete()
      .eq("id", record.id);
    if (error) throw error;
  }
  write(
    "myc-records",
    localRecords().filter((r) => r.id !== record.id),
  );
}
