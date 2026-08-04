import { generateUUID } from "./uuid";

// Nilai tersimpan di DB (lowercase, sama konvensi dengan tabel lain).
export type Kondisi = "nyala" | "mati";

/** Label tampilan untuk nilai kondisi. */
export function kondisiLabel(kondisi: string): string {
  if (kondisi === "nyala") return "Nyala";
  if (kondisi === "mati") return "Mati";
  return kondisi;
}

export interface MasterItem {
  id: string;
  jenis: string;
  pemilik?: string | null;
  nomor_unit?: string | number | null;
}

/**
 * Label item checklist yang lebih detail: jenis, pemilik, dan nomor unit.
 * Contoh: "Travo - PT ABC (No. 3)". Bagian yang kosong diabaikan.
 */
export function formatTravoLabel(item: {
  jenis?: string | null;
  pemilik?: string | null;
  nomor_unit?: string | number | null;
}): string {
  const parts: string[] = [];
  const jenis = (item.jenis ?? "").trim();
  parts.push(jenis || "Travo");
  const pemilik = (item.pemilik ?? "").toString().trim();
  if (pemilik) parts.push(pemilik);
  let label = parts.join(" - ");
  const nomor = item.nomor_unit == null ? "" : item.nomor_unit.toString().trim();
  if (nomor) label += ` (No. ${nomor})`;
  return label;
}

export interface MasterGroup {
  key: string;
  pemilik: string;
  items: MasterItem[];
}

/**
 * Kelompokkan item master per pemilik (untuk tampilan accordion).
 * Item tanpa pemilik masuk grup "Tanpa Pemilik". Grup diurutkan
 * alfabetis; urutan item dalam grup mengikuti urutan input.
 */
export function groupMasterByPemilik(items: MasterItem[]): MasterGroup[] {
  const map = new Map<string, MasterGroup>();
  for (const it of items) {
    const label = (it.pemilik ?? "").toString().trim() || "Tanpa Pemilik";
    const key = label.toLowerCase();
    let g = map.get(key);
    if (!g) {
      g = { key, pemilik: label, items: [] };
      map.set(key, g);
    }
    g.items.push(it);
  }
  return Array.from(map.values()).sort((a, b) =>
    a.pemilik.localeCompare(b.pemilik)
  );
}

export interface ChecklistEntry {
  kondisi: Kondisi | null;
  keterangan: string;
}

export interface ChecklistHeader {
  tanggal: string;
  jam: string;
  sekuriti: string;
}

export interface CheckRow {
  id: string;
  master_travo_blower_id: string;
  kondisi: Kondisi;
  keterangan: string;
  tanggal: string;
  jam: string;
  sekuriti: string;
}

export interface ChecklistValidation {
  valid: boolean;
  unselectedIds: string[];
  sekuritiMissing: boolean;
  noItems: boolean;
}

export function validateChecklist(
  items: MasterItem[],
  entries: Record<string, ChecklistEntry>,
  header: ChecklistHeader
): ChecklistValidation {
  const noItems = items.length === 0;
  const unselectedIds = items
    .filter((it) => entries[it.id]?.kondisi == null)
    .map((it) => it.id);
  const sekuritiMissing = !header.sekuriti || !header.sekuriti.trim();
  return {
    valid: !noItems && unselectedIds.length === 0 && !sekuritiMissing,
    unselectedIds,
    sekuritiMissing,
    noItems,
  };
}

export function buildCheckRows(
  items: MasterItem[],
  entries: Record<string, ChecklistEntry>,
  header: ChecklistHeader
): CheckRow[] {
  return items.map((it) => {
    const entry = entries[it.id];
    return {
      id: generateUUID(),
      master_travo_blower_id: it.id,
      kondisi: entry.kondisi as Kondisi,
      keterangan: (entry.keterangan || "").trim(),
      tanggal: header.tanggal,
      jam: header.jam,
      sekuriti: header.sekuriti,
    };
  });
}

export interface CheckRecord {
  id: string;
  master_travo_blower_id: string;
  kondisi: string;
  keterangan: string;
  tanggal: string;
  jam: string;
  sekuriti: string;
  created_at: string;
  master_travo_blower?: {
    jenis: string;
    business_unit: string;
    pemilik?: string | null;
    nomor_unit?: string | number | null;
  } | null;
}

export interface ChecklistSession {
  key: string;
  tanggal: string;
  jam: string;
  sekuriti: string;
  business_unit: string | null;
  created_at: string;
  items: CheckRecord[];
  nyalaCount: number;
  matiCount: number;
}

export function groupChecksBySession(checks: CheckRecord[]): ChecklistSession[] {
  const map = new Map<string, ChecklistSession>();
  for (const c of checks) {
    const key = `${c.tanggal}|${c.jam}|${c.sekuriti}`;
    let s = map.get(key);
    if (!s) {
      s = {
        key,
        tanggal: c.tanggal,
        jam: c.jam,
        sekuriti: c.sekuriti,
        business_unit: c.master_travo_blower?.business_unit ?? null,
        created_at: c.created_at,
        items: [],
        nyalaCount: 0,
        matiCount: 0,
      };
      map.set(key, s);
    }
    s.items.push(c);
    if (c.kondisi === "nyala") s.nyalaCount++;
    else if (c.kondisi === "mati") s.matiCount++;
    if (c.created_at > s.created_at) s.created_at = c.created_at;
  }
  return Array.from(map.values()).sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1
  );
}
