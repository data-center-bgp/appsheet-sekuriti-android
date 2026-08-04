import {
  validateChecklist,
  buildCheckRows,
  groupChecksBySession,
  groupMasterByPemilik,
  formatTravoLabel,
  kondisiLabel,
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
      m1: { kondisi: "nyala", keterangan: "" },
      m2: { kondisi: null, keterangan: "" },
    };
    const r = validateChecklist(items, entries, header);
    expect(r.valid).toBe(false);
    expect(r.unselectedIds).toEqual(["m2"]);
  });

  it("invalid saat sekuriti kosong", () => {
    const entries: Record<string, ChecklistEntry> = {
      m1: { kondisi: "nyala", keterangan: "" },
      m2: { kondisi: "mati", keterangan: "x" },
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
      m1: { kondisi: "nyala", keterangan: "" },
      m2: { kondisi: "mati", keterangan: "bising" },
    };
    expect(validateChecklist(items, entries, header).valid).toBe(true);
  });
});

describe("buildCheckRows", () => {
  it("membuat satu baris per item dengan field yang benar", () => {
    const entries: Record<string, ChecklistEntry> = {
      m1: { kondisi: "nyala", keterangan: "  ok  " },
      m2: { kondisi: "mati", keterangan: "bising" },
    };
    const rows = buildCheckRows(items, entries, header);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      master_travo_blower_id: "m1",
      kondisi: "nyala",
      keterangan: "ok",
      tanggal: "2026-07-29",
      jam: "08:00:00",
      sekuriti: "Budi",
    });
    expect(rows[1].kondisi).toBe("mati");
    expect(rows[0].id).toMatch(/^[0-9a-f-]{36}$/);
    expect(rows[0].id).not.toBe(rows[1].id);
  });
});

describe("groupChecksBySession", () => {
  it("mengelompokkan per tanggal+jam+sekuriti dan menghitung nyala/mati", () => {
    const checks: CheckRecord[] = [
      { id: "a", master_travo_blower_id: "m1", kondisi: "nyala", keterangan: "", tanggal: "2026-07-29", jam: "08:00:00", sekuriti: "Budi", created_at: "2026-07-29T01:00:00Z", master_travo_blower: { jenis: "Travo A", business_unit: "unit-x" } },
      { id: "b", master_travo_blower_id: "m2", kondisi: "mati", keterangan: "x", tanggal: "2026-07-29", jam: "08:00:00", sekuriti: "Budi", created_at: "2026-07-29T01:00:01Z", master_travo_blower: { jenis: "Blower B", business_unit: "unit-x" } },
      { id: "c", master_travo_blower_id: "m1", kondisi: "nyala", keterangan: "", tanggal: "2026-07-28", jam: "09:00:00", sekuriti: "Ani", created_at: "2026-07-28T02:00:00Z", master_travo_blower: { jenis: "Travo A", business_unit: "unit-x" } },
    ];
    const groups = groupChecksBySession(checks);
    expect(groups).toHaveLength(2);
    expect(groups[0].sekuriti).toBe("Budi"); // terbaru dulu
    expect(groups[0].items).toHaveLength(2);
    expect(groups[0].nyalaCount).toBe(1);
    expect(groups[0].matiCount).toBe(1);
    expect(groups[0].business_unit).toBe("unit-x");
  });
});

describe("formatTravoLabel", () => {
  it("menggabungkan jenis, pemilik, dan nomor unit", () => {
    expect(
      formatTravoLabel({ jenis: "Travo", pemilik: "PT ABC", nomor_unit: 3 })
    ).toBe("Travo - PT ABC (No. 3)");
  });

  it("mengabaikan bagian yang kosong/null", () => {
    expect(formatTravoLabel({ jenis: "Travo", pemilik: null, nomor_unit: null })).toBe(
      "Travo"
    );
    expect(formatTravoLabel({ jenis: "Travo", pemilik: "Budi" })).toBe(
      "Travo - Budi"
    );
    expect(
      formatTravoLabel({ jenis: "Travo", nomor_unit: "7A" })
    ).toBe("Travo (No. 7A)");
  });

  it("fallback ke 'Travo' saat jenis kosong", () => {
    expect(formatTravoLabel({ jenis: "", pemilik: "Budi", nomor_unit: 1 })).toBe(
      "Travo - Budi (No. 1)"
    );
  });
});

describe("kondisiLabel", () => {
  it("memetakan nilai tersimpan ke label tampilan", () => {
    expect(kondisiLabel("nyala")).toBe("Nyala");
    expect(kondisiLabel("mati")).toBe("Mati");
    expect(kondisiLabel("apa")).toBe("apa");
  });
});

describe("groupMasterByPemilik", () => {
  it("mengelompokkan item per pemilik dan mengurutkan alfabetis", () => {
    const items: MasterItem[] = [
      { id: "1", jenis: "Travo", pemilik: "PT B", nomor_unit: 1 },
      { id: "2", jenis: "Travo", pemilik: "PT A", nomor_unit: 1 },
      { id: "3", jenis: "Travo", pemilik: "PT B", nomor_unit: 2 },
    ];
    const groups = groupMasterByPemilik(items);
    expect(groups.map((g) => g.pemilik)).toEqual(["PT A", "PT B"]);
    expect(groups[1].items.map((i) => i.id)).toEqual(["1", "3"]);
  });

  it("item tanpa pemilik masuk grup 'Tanpa Pemilik'", () => {
    const items: MasterItem[] = [
      { id: "1", jenis: "Travo", pemilik: null },
      { id: "2", jenis: "Travo", pemilik: "  " },
    ];
    const groups = groupMasterByPemilik(items);
    expect(groups).toHaveLength(1);
    expect(groups[0].pemilik).toBe("Tanpa Pemilik");
    expect(groups[0].items).toHaveLength(2);
  });
});
