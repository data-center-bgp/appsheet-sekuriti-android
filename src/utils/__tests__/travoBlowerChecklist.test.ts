import {
  validateChecklist,
  buildCheckRows,
  groupChecksBySession,
  MasterItem,
  ChecklistEntry,
  ChecklistHeader,
  CheckRecord,
} from "../travoBlowerChecklist";

const items: MasterItem[] = [
  { id: "m1", jenis: "Travo A" },
  { id: "m2", jenis: "Blower B" },
];
const header: ChecklistHeader = { tanggal: "2026-07-29", jam: "08:00:00", sekuriti: "Budi" };

describe("validateChecklist", () => {
  it("invalid saat ada item belum dipilih", () => {
    const entries: Record<string, ChecklistEntry> = {
      m1: { kondisi: "Baik", keterangan: "" },
      m2: { kondisi: null, keterangan: "" },
    };
    const r = validateChecklist(items, entries, header);
    expect(r.valid).toBe(false);
    expect(r.unselectedIds).toEqual(["m2"]);
  });

  it("invalid saat sekuriti kosong", () => {
    const entries: Record<string, ChecklistEntry> = {
      m1: { kondisi: "Baik", keterangan: "" },
      m2: { kondisi: "Rusak", keterangan: "x" },
    };
    const r = validateChecklist(items, entries, { ...header, sekuriti: "" });
    expect(r.sekuritiMissing).toBe(true);
    expect(r.valid).toBe(false);
  });

  it("invalid + noItems saat master kosong", () => {
    const r = validateChecklist([], {}, header);
    expect(r.noItems).toBe(true);
    expect(r.valid).toBe(false);
  });

  it("valid saat semua item dipilih dan sekuriti ada", () => {
    const entries: Record<string, ChecklistEntry> = {
      m1: { kondisi: "Baik", keterangan: "" },
      m2: { kondisi: "Rusak", keterangan: "bising" },
    };
    expect(validateChecklist(items, entries, header).valid).toBe(true);
  });
});

describe("buildCheckRows", () => {
  it("membuat satu baris per item dengan field yang benar", () => {
    const entries: Record<string, ChecklistEntry> = {
      m1: { kondisi: "Baik", keterangan: "  ok  " },
      m2: { kondisi: "Rusak", keterangan: "bising" },
    };
    const rows = buildCheckRows(items, entries, header);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      master_travo_blower_id: "m1",
      kondisi: "Baik",
      keterangan: "ok",
      tanggal: "2026-07-29",
      jam: "08:00:00",
      sekuriti: "Budi",
    });
    expect(rows[1].kondisi).toBe("Rusak");
    expect(rows[0].id).toMatch(/^[0-9a-f-]{36}$/);
    expect(rows[0].id).not.toBe(rows[1].id);
  });
});

describe("groupChecksBySession", () => {
  it("mengelompokkan per tanggal+jam+sekuriti dan menghitung baik/rusak", () => {
    const checks: CheckRecord[] = [
      { id: "a", master_travo_blower_id: "m1", kondisi: "Baik", keterangan: "", tanggal: "2026-07-29", jam: "08:00:00", sekuriti: "Budi", created_at: "2026-07-29T01:00:00Z", master_travo_blower: { jenis: "Travo A", business_unit: "unit-x" } },
      { id: "b", master_travo_blower_id: "m2", kondisi: "Rusak", keterangan: "x", tanggal: "2026-07-29", jam: "08:00:00", sekuriti: "Budi", created_at: "2026-07-29T01:00:01Z", master_travo_blower: { jenis: "Blower B", business_unit: "unit-x" } },
      { id: "c", master_travo_blower_id: "m1", kondisi: "Baik", keterangan: "", tanggal: "2026-07-28", jam: "09:00:00", sekuriti: "Ani", created_at: "2026-07-28T02:00:00Z", master_travo_blower: { jenis: "Travo A", business_unit: "unit-x" } },
    ];
    const groups = groupChecksBySession(checks);
    expect(groups).toHaveLength(2);
    expect(groups[0].sekuriti).toBe("Budi"); // terbaru dulu
    expect(groups[0].items).toHaveLength(2);
    expect(groups[0].baikCount).toBe(1);
    expect(groups[0].rusakCount).toBe(1);
    expect(groups[0].business_unit).toBe("unit-x");
  });
});
