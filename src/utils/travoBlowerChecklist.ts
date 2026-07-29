import { generateUUID } from "./uuid";

export type Kondisi = "Baik" | "Rusak";

export interface MasterItem {
  id: string;
  jenis: string;
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
  master_travo_blower?: { jenis: string; business_unit: string } | null;
}

export interface ChecklistSession {
  key: string;
  tanggal: string;
  jam: string;
  sekuriti: string;
  business_unit: string | null;
  created_at: string;
  items: CheckRecord[];
  baikCount: number;
  rusakCount: number;
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
        baikCount: 0,
        rusakCount: 0,
      };
      map.set(key, s);
    }
    s.items.push(c);
    if (c.kondisi === "Baik") s.baikCount++;
    else if (c.kondisi === "Rusak") s.rusakCount++;
    if (c.created_at > s.created_at) s.created_at = c.created_at;
  }
  return Array.from(map.values()).sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1
  );
}
