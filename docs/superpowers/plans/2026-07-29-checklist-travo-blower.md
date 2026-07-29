# Checklist Travo/Blower Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ubah laporan Travo/Blower menjadi checklist berbasis `master_travo_blower`, disimpan ke `travo_blower_checks`, dengan layar input checklist dan layar list per-sesi.

**Architecture:** Logika murni (validasi, bangun baris insert, grouping sesi) diekstrak ke satu util yang di-unit-test. Sebuah hook memuat item master per business_unit. Dua layar (Create/List) ditulis ulang memakai util + hook, mengikuti pola RNEUI + Supabase yang sudah ada di codebase.

**Tech Stack:** Expo SDK 52, React Native 0.76, TypeScript, @rneui/themed, @supabase/supabase-js, @react-native-community/datetimepicker. Test: jest-expo (baru, khusus util murni).

## Global Constraints

- Nilai `kondisi` HANYA `"Baik"` atau `"Rusak"` (teks, verbatim).
- Insert ke `travo_blower_checks` kolom: `id, master_travo_blower_id, kondisi, keterangan, tanggal, jam, sekuriti`. `foto` TIDAK diisi (null). Tidak ada kolom `business_unit`/`user_id`/`session_id` di tabel ini.
- `id` digenerate klien via `generateUUID()` dari `src/utils/uuid.ts`.
- Item master: `select id, jenis from master_travo_blower`, label item = `jenis`.
- Filter BU memakai nilai dari `useUserBusinessUnit()` apa adanya; role `master` (case-insensitive) = tanpa filter (lihat Risiko #1 spec — verifikasi casing saat uji login).
- Tiap item WAJIB dipilih manual (Baik/Rusak) sebelum submit; `keterangan` selalu opsional.
- Warna tema layar Travo/Blower: hijau `#20c997` (header), `#c6f7d6` (aksen) — konsisten dengan file lama.
- Install dependency apa pun dengan `--legacy-peer-deps` (konflik peer @rneui/react-native-safe-area-context sudah diketahui).
- Verifikasi bundling via server Metro: `curl "http://localhost:8083/index.bundle?platform=android&dev=true&minify=false"` harus HTTP 200 (dan `platform=web` 200).

---

### Task 1: Setup jest-expo + util logika checklist (TDD)

**Files:**
- Modify: `package.json` (tambah devDeps + script + blok jest)
- Create: `src/utils/travoBlowerChecklist.ts`
- Test: `src/utils/__tests__/travoBlowerChecklist.test.ts`

**Interfaces:**
- Consumes: `generateUUID` dari `src/utils/uuid.ts`.
- Produces (dipakai Task 2–4):
  - `type Kondisi = "Baik" | "Rusak"`
  - `interface MasterItem { id: string; jenis: string }`
  - `interface ChecklistEntry { kondisi: Kondisi | null; keterangan: string }`
  - `interface ChecklistHeader { tanggal: string; jam: string; sekuriti: string }`
  - `interface CheckRow { id, master_travo_blower_id, kondisi: Kondisi, keterangan, tanggal, jam, sekuriti }` (semua string kecuali kondisi)
  - `validateChecklist(items, entries, header) => { valid, unselectedIds, sekuritiMissing, noItems }`
  - `buildCheckRows(items, entries, header) => CheckRow[]`
  - `interface CheckRecord { id, master_travo_blower_id, kondisi, keterangan, tanggal, jam, sekuriti, created_at, master_travo_blower?: { jenis, business_unit } | null }`
  - `interface ChecklistSession { key, tanggal, jam, sekuriti, business_unit, created_at, items: CheckRecord[], baikCount, rusakCount }`
  - `groupChecksBySession(checks: CheckRecord[]) => ChecklistSession[]`

- [ ] **Step 1: Install test deps**

Run:
```bash
npm install -D jest-expo jest react-test-renderer@18.3.1 @types/jest --legacy-peer-deps
```
Expected: "added N packages" tanpa error fatal. (`react-test-renderer` dipin ke 18.3.1 agar cocok dengan `react@18.3.1`.)

- [ ] **Step 2: Tambah script + konfig jest ke `package.json`**

Tambahkan `"test": "jest"` ke `scripts`, dan blok top-level:
```json
"jest": {
  "preset": "jest-expo",
  "transformIgnorePatterns": [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@rneui/.*))"
  ]
}
```

- [ ] **Step 3: Write the failing test**

Create `src/utils/__tests__/travoBlowerChecklist.test.ts`:
```ts
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
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm test -- travoBlowerChecklist`
Expected: FAIL — "Cannot find module '../travoBlowerChecklist'".

- [ ] **Step 5: Write minimal implementation**

Create `src/utils/travoBlowerChecklist.ts`:
```ts
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
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- travoBlowerChecklist`
Expected: PASS (4 describe blocks, semua hijau).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/utils/travoBlowerChecklist.ts src/utils/__tests__/travoBlowerChecklist.test.ts
git commit -m "feat(travo): add checklist logic util + jest-expo test setup"
```

---

### Task 2: Hook `useTravoBlowerMaster`

**Files:**
- Create: `src/hooks/useTravoBlowerMaster.ts`

**Interfaces:**
- Consumes: `supabase` (`src/lib/supabase.ts`), `MasterItem` (Task 1).
- Produces: `useTravoBlowerMaster(businessUnit: string | null | undefined) => { items: MasterItem[]; loading: boolean; error: string | null; refetch: () => void }`.

Catatan verifikasi: hook menyentuh Supabase; tidak ada infra unit-test hook di repo ini. Diverifikasi lewat typecheck (Task 5) + jalan nyata di Task 3. Pola meniru `useSecurityNames.ts`.

- [ ] **Step 1: Tulis hook**

Create `src/hooks/useTravoBlowerMaster.ts`:
```ts
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { MasterItem } from "../utils/travoBlowerChecklist";

export const useTravoBlowerMaster = (
  businessUnit: string | null | undefined
) => {
  const [items, setItems] = useState<MasterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessUnit]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("master_travo_blower")
        .select("id, jenis")
        .order("jenis", { ascending: true });

      // Filter BU kecuali role master (lihat Risiko #1: casing)
      if (businessUnit && businessUnit.toLowerCase() !== "master") {
        query = query.eq("business_unit", businessUnit);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      setItems((data || []) as MasterItem[]);
    } catch (err: any) {
      console.error("Error fetching master travo/blower:", err);
      setError(err.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  return { items, loading, error, refetch: fetchItems };
};
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: tidak ada error terkait `useTravoBlowerMaster.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useTravoBlowerMaster.ts
git commit -m "feat(travo): add useTravoBlowerMaster hook"
```

---

### Task 3: Tulis ulang layar Checklist (`LaporanTravoBlowerCreate.tsx`)

**Files:**
- Modify (replace whole file): `src/screens/laporan/travo_blower/LaporanTravoBlowerCreate.tsx`

**Interfaces:**
- Consumes: `useUserBusinessUnit`, `useSecurityOptions`, `useTravoBlowerMaster`, `DropdownSelector`, `createTimeChangeHandler`/`openTimePicker` (timeHandler), `DateTimePickerAndroid`, `validateChecklist`/`buildCheckRows`/`ChecklistEntry`/`Kondisi`/`MasterItem` (Task 1), `supabase`.
- Produces: komponen default `LaporanTravoBlowerCreate` (rute `LaporanTravoBlowerCreate`, param `editData?` diabaikan).

- [ ] **Step 1: Replace file dengan implementasi checklist**

Replace seluruh isi `src/screens/laporan/travo_blower/LaporanTravoBlowerCreate.tsx`:
```tsx
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Text, Card, Button, Input, Icon, Header } from "@rneui/themed";
import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import DropdownSelector from "../../../components/DropdownSelector";
import { useUserBusinessUnit } from "../../../hooks/useUserBusinessUnit";
import { useSecurityOptions } from "../../../hooks/useSecurityNames";
import { useTravoBlowerMaster } from "../../../hooks/useTravoBlowerMaster";
import {
  createTimeChangeHandler,
  openTimePicker,
} from "../../../utils/timeHandler";
import {
  validateChecklist,
  buildCheckRows,
  ChecklistEntry,
  Kondisi,
} from "../../../utils/travoBlowerChecklist";

export default function LaporanTravoBlowerCreate() {
  const navigation = useNavigation();

  const { businessUnit, loading: businessUnitLoading } = useUserBusinessUnit();
  const {
    items: masterItems,
    loading: masterLoading,
    error: masterError,
  } = useTravoBlowerMaster(businessUnit);
  const { dropdownOptions: securityOptions, loading: securityLoading } =
    useSecurityOptions(businessUnit);

  const [header, setHeader] = useState({
    tanggal: new Date().toISOString().split("T")[0],
    jam: new Date().toLocaleTimeString("en-US", {
      hour12: false,
      timeZone: "Asia/Singapore",
    }),
    sekuriti: "",
  });

  const [entries, setEntries] = useState<Record<string, ChecklistEntry>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  const setKondisi = (id: string, kondisi: Kondisi) => {
    setEntries((prev) => ({
      ...prev,
      [id]: { kondisi, keterangan: prev[id]?.keterangan || "" },
    }));
  };

  const setKeterangan = (id: string, keterangan: string) => {
    setEntries((prev) => ({
      ...prev,
      [id]: { kondisi: prev[id]?.kondisi ?? null, keterangan },
    }));
  };

  const onChangeTime = createTimeChangeHandler(setHeader, "jam");

  const showDatePickerDialog = () => {
    DateTimePickerAndroid.open({
      value: new Date(header.tanggal),
      onChange: (_e, selectedDate?: Date) => {
        if (selectedDate) {
          setHeader((prev) => ({
            ...prev,
            tanggal: selectedDate.toISOString().split("T")[0],
          }));
        }
      },
      mode: "date",
    });
  };

  const showTimePickerDialog = () => {
    try {
      const [h, m] = header.jam.split(":");
      const d = new Date();
      d.setHours(parseInt(h) || 0);
      d.setMinutes(parseInt(m) || 0);
      d.setSeconds(0);
      openTimePicker(d, onChangeTime);
    } catch {
      openTimePicker(new Date(), onChangeTime);
    }
  };

  const validation = validateChecklist(masterItems, entries, header);

  const handleSubmit = async () => {
    setShowValidation(true);
    if (!validation.valid) {
      if (validation.noItems) {
        setError("Tidak ada item travo/blower untuk business unit ini");
      } else if (validation.sekuritiMissing) {
        setError("Pilih nama sekuriti terlebih dahulu");
      } else {
        setError(
          `Masih ada ${validation.unselectedIds.length} item yang belum ditandai`
        );
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User tidak ditemukan");

      const rows = buildCheckRows(masterItems, entries, header);
      const { error: insertError } = await supabase
        .from("travo_blower_checks")
        .insert(rows);
      if (insertError) throw insertError;

      Alert.alert("Berhasil", "Checklist berhasil disimpan", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const DateTimeSelector = ({
    label,
    value,
    onPress,
    icon,
  }: {
    label: string;
    value: string;
    onPress: () => void;
    icon: string;
  }) => (
    <TouchableOpacity style={styles.dateTimeCard} onPress={onPress}>
      <View style={styles.dateTimeContent}>
        <Icon name={icon} type="feather" size={20} color="#20c997" />
        <View style={styles.dateTimeText}>
          <Text style={styles.dateTimeLabel}>{label}</Text>
          <Text style={styles.dateTimeValue}>{value}</Text>
        </View>
        <Icon name="chevron-right" type="feather" size={20} color="#6c757d" />
      </View>
    </TouchableOpacity>
  );

  const initialLoading = businessUnitLoading || masterLoading;

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          centerComponent={{
            text: "Checklist Travo Blower",
            style: { color: "white", fontSize: 18, fontWeight: "bold" },
          }}
          leftComponent={{
            icon: "arrow-left",
            type: "feather",
            color: "white",
            onPress: () => navigation.goBack(),
          }}
          backgroundColor="#20c997"
          barStyle="light-content"
        />
        <View style={styles.loadingContainer}>
          <Icon name="loader" type="feather" size={32} color="#20c997" />
          <Text style={styles.loadingText}>Memuat data checklist...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        centerComponent={{
          text: "Checklist Travo Blower",
          style: { color: "white", fontSize: 18, fontWeight: "bold" },
        }}
        leftComponent={{
          icon: "arrow-left",
          type: "feather",
          color: "white",
          onPress: () => navigation.goBack(),
        }}
        backgroundColor="#20c997"
        barStyle="light-content"
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formHeader}>
            <Icon
              name="check-square"
              type="feather"
              size={32}
              color="#20c997"
              containerStyle={styles.headerIcon}
            />
            <Text style={styles.formTitle}>Checklist Travo/Blower</Text>
            <Text style={styles.formSubtitle}>
              Tandai kondisi tiap unit: Baik atau Rusak
            </Text>
            {businessUnit && (
              <View style={styles.businessUnitInfo}>
                <Icon
                  name="building"
                  type="font-awesome-5"
                  size={16}
                  color="#20c997"
                />
                <Text style={styles.businessUnitText}>
                  Business Unit: {businessUnit}
                </Text>
              </View>
            )}
          </View>

          {/* Header sesi */}
          <Card containerStyle={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="info" type="feather" size={18} color="#495057" />
              <Text style={styles.cardTitle}>Informasi Sesi</Text>
            </View>
            <View style={styles.timeGrid}>
              <DateTimeSelector
                label="Tanggal"
                value={header.tanggal}
                onPress={showDatePickerDialog}
                icon="calendar"
              />
              <DateTimeSelector
                label="Jam"
                value={header.jam}
                onPress={showTimePickerDialog}
                icon="clock"
              />
            </View>
            <View style={{ marginTop: 12 }}>
              <DropdownSelector
                label="Sekuriti *"
                placeholder="Pilih nama sekuriti"
                value={header.sekuriti}
                options={securityOptions}
                onSelect={(value) =>
                  setHeader((prev) => ({ ...prev, sekuriti: value }))
                }
                leftIcon={{
                  name: "shield",
                  type: "feather",
                  size: 20,
                  color: "#6c757d",
                }}
                disabled={securityLoading}
                required
                errorMessage={
                  showValidation && validation.sekuritiMissing
                    ? "Sekuriti wajib dipilih"
                    : undefined
                }
              />
            </View>
          </Card>

          {/* Daftar checklist */}
          {masterError ? (
            <View style={styles.errorContainer}>
              <Icon
                name="alert-circle"
                type="feather"
                size={18}
                color="#dc3545"
              />
              <Text style={styles.errorText}>Error memuat item: {masterError}</Text>
            </View>
          ) : masterItems.length === 0 ? (
            <View style={styles.emptyBox}>
              <Icon name="inbox" type="feather" size={40} color="#6c757d" />
              <Text style={styles.emptyText}>
                Belum ada master travo/blower untuk business unit ini
              </Text>
            </View>
          ) : (
            masterItems.map((item) => {
              const entry = entries[item.id];
              const unselected =
                showValidation && (entry?.kondisi ?? null) === null;
              return (
                <Card
                  key={item.id}
                  containerStyle={[
                    styles.card,
                    unselected ? styles.cardInvalid : null,
                  ]}
                >
                  <Text style={styles.itemTitle}>{item.jenis}</Text>
                  <View style={styles.kondisiRow}>
                    <TouchableOpacity
                      style={[
                        styles.kondisiBtn,
                        entry?.kondisi === "Baik"
                          ? styles.kondisiBaikActive
                          : null,
                      ]}
                      onPress={() => setKondisi(item.id, "Baik")}
                    >
                      <Icon
                        name="check-circle"
                        type="feather"
                        size={16}
                        color={entry?.kondisi === "Baik" ? "white" : "#20c997"}
                      />
                      <Text
                        style={[
                          styles.kondisiText,
                          entry?.kondisi === "Baik"
                            ? styles.kondisiTextActive
                            : { color: "#20c997" },
                        ]}
                      >
                        Baik
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.kondisiBtn,
                        entry?.kondisi === "Rusak"
                          ? styles.kondisiRusakActive
                          : null,
                      ]}
                      onPress={() => setKondisi(item.id, "Rusak")}
                    >
                      <Icon
                        name="x-circle"
                        type="feather"
                        size={16}
                        color={entry?.kondisi === "Rusak" ? "white" : "#dc3545"}
                      />
                      <Text
                        style={[
                          styles.kondisiText,
                          entry?.kondisi === "Rusak"
                            ? styles.kondisiTextActive
                            : { color: "#dc3545" },
                        ]}
                      >
                        Rusak
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Input
                    placeholder="Keterangan (opsional)"
                    value={entry?.keterangan || ""}
                    onChangeText={(text) => setKeterangan(item.id, text)}
                    inputContainerStyle={styles.inputContainer}
                    containerStyle={{ paddingHorizontal: 0, marginTop: 8 }}
                  />
                </Card>
              );
            })
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Icon
                name="alert-circle"
                type="feather"
                size={18}
                color="#dc3545"
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.actionButtons}>
            <Button
              title="Batal"
              onPress={() => navigation.goBack()}
              buttonStyle={styles.cancelButton}
              titleStyle={styles.cancelButtonText}
              type="outline"
              containerStyle={styles.buttonContainer}
            />
            <Button
              title={loading ? "Menyimpan..." : "Simpan"}
              onPress={handleSubmit}
              disabled={loading || masterItems.length === 0}
              buttonStyle={styles.submitButton}
              titleStyle={styles.submitButtonText}
              loading={loading}
              containerStyle={styles.buttonContainer}
              icon={
                loading
                  ? undefined
                  : { name: "save", type: "feather", color: "white", size: 18 }
              }
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: { fontSize: 16, color: "#6c757d", marginTop: 16 },
  formHeader: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerIcon: {
    backgroundColor: "#c6f7d6",
    padding: 12,
    borderRadius: 25,
    marginBottom: 12,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#212529",
    textAlign: "center",
    marginBottom: 4,
  },
  formSubtitle: { fontSize: 14, color: "#6c757d", textAlign: "center" },
  businessUnitInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#c6f7d6",
    borderRadius: 6,
    gap: 6,
  },
  businessUnitText: { fontSize: 12, color: "#0d5d2a", fontWeight: "500" },
  card: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 0,
  },
  cardInvalid: { borderWidth: 1, borderColor: "#dc3545" },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginLeft: 8,
  },
  timeGrid: { flexDirection: "row", gap: 12 },
  dateTimeCard: {
    flex: 1,
    backgroundColor: "#c6f7d6",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  dateTimeContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  dateTimeText: { flex: 1, marginLeft: 8 },
  dateTimeLabel: { fontSize: 12, color: "#6c757d", marginBottom: 2 },
  dateTimeValue: { fontSize: 14, fontWeight: "500", color: "#212529" },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 12,
  },
  kondisiRow: { flexDirection: "row", gap: 12 },
  kondisiBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
    backgroundColor: "white",
  },
  kondisiBaikActive: { backgroundColor: "#20c997", borderColor: "#20c997" },
  kondisiRusakActive: { backgroundColor: "#dc3545", borderColor: "#dc3545" },
  kondisiText: { fontSize: 14, fontWeight: "600" },
  kondisiTextActive: { color: "white" },
  inputContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
    paddingBottom: 4,
  },
  emptyBox: {
    alignItems: "center",
    padding: 32,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6c757d",
    marginTop: 12,
    textAlign: "center",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8d7da",
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#dc3545",
  },
  errorText: { color: "#721c24", marginLeft: 8, flex: 1, fontSize: 14 },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  buttonContainer: { flex: 1 },
  cancelButton: {
    borderColor: "#6c757d",
    borderWidth: 1,
    backgroundColor: "transparent",
    borderRadius: 8,
    height: 48,
  },
  cancelButtonText: { color: "#6c757d", fontWeight: "600" },
  submitButton: { backgroundColor: "#20c997", borderRadius: 8, height: 48 },
  submitButtonText: { fontWeight: "600", marginLeft: 8 },
});
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: tidak ada error di file ini. (Jika `createTimeChangeHandler` mengeluh soal tipe setState, pastikan `setHeader` dipakai dan `header` punya field `jam` — sudah sesuai.)

- [ ] **Step 3: Verifikasi bundling**

Pastikan Metro jalan (`npx expo start --port 8083`), lalu:
Run: `curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:8083/index.bundle?platform=android&dev=true&minify=false"`
Expected: `200`.

- [ ] **Step 4: Commit**

```bash
git add src/screens/laporan/travo_blower/LaporanTravoBlowerCreate.tsx
git commit -m "feat(travo): rewrite create screen as Baik/Rusak checklist"
```

---

### Task 4: Tulis ulang layar List (`LaporanTravoBlowerList.tsx`)

**Files:**
- Modify (replace whole file): `src/screens/laporan/travo_blower/LaporanTravoBlowerList.tsx`

**Interfaces:**
- Consumes: `supabase`, `useDataFilter`, `DateFilter`/`DateFilterState`, `applyDateFilter`/`getDateFilterSummary`, `groupChecksBySession`/`CheckRecord`/`ChecklistSession` (Task 1).
- Produces: komponen default `LaporanTravoBlowerList` (rute `LaporanTravoBlowerList`).

Catatan: pagination row-based dihapus untuk v1 (grouping per sesi butuh set data utuh per rentang). Ambil hingga batas aman (`LIMIT 500`) atas rentang tanggal terfilter, lalu kelompokkan klien. Ditandai di spec §4/Risiko #3.

- [ ] **Step 1: Replace file**

Replace seluruh isi `src/screens/laporan/travo_blower/LaporanTravoBlowerList.tsx`:
```tsx
import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Text, Button, Icon, Badge, SearchBar, Card } from "@rneui/themed";
import { supabase } from "../../../lib/supabase";
import { useDataFilter } from "../../../hooks/useDataFilter";
import DateFilter, { DateFilterState } from "../../../components/DateFilter";
import {
  applyDateFilter,
  getDateFilterSummary,
} from "../../../utils/dateFilter";
import {
  groupChecksBySession,
  CheckRecord,
  ChecklistSession,
} from "../../../utils/travoBlowerChecklist";

const MAX_ROWS = 500;

export default function LaporanTravoBlowerList({
  navigation,
}: {
  navigation: any;
}) {
  const [sessions, setSessions] = useState<ChecklistSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dateFilter, setDateFilter] = useState<DateFilterState>({
    startDate: null,
    endDate: null,
    isActive: false,
  });

  const { dataFilter, canSeeAllData, loading: filterLoading } = useDataFilter();

  useEffect(() => {
    if (!filterLoading) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataFilter, filterLoading, dateFilter]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (!filterLoading) fetchData();
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, filterLoading]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("travo_blower_checks")
        .select(
          `id, master_travo_blower_id, kondisi, keterangan, tanggal, jam,
           sekuriti, created_at,
           master_travo_blower!inner(jenis, business_unit)`
        )
        .order("created_at", { ascending: false })
        .limit(MAX_ROWS);

      // Filter BU pada kolom embedded master (non-master saja)
      if (!canSeeAllData && dataFilter) {
        query = query.eq("master_travo_blower.business_unit", dataFilter);
      }

      query = applyDateFilter(query, dateFilter, "tanggal");

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      const records = (data || []) as unknown as CheckRecord[];
      setSessions(groupChecksBySession(records));
    } catch (err) {
      console.error("Error fetching travo_blower_checks:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const deleteSession = (session: ChecklistSession) => {
    Alert.alert(
      "Konfirmasi Hapus",
      `Hapus checklist ${formatDate(session.tanggal)} ${formatTime(
        session.jam
      )} oleh ${session.sekuriti}? (${session.items.length} item)`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const ids = session.items.map((i) => i.id);
              const { error: delError } = await supabase
                .from("travo_blower_checks")
                .delete()
                .in("id", ids);
              if (delError) throw delError;
              await fetchData();
              Alert.alert("Berhasil", "Checklist berhasil dihapus");
            } catch (e: any) {
              Alert.alert("Error", `Gagal menghapus: ${e.message}`);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) =>
    !timeString ? "-" : timeString.substring(0, 5);

  const filteredSessions = sessions.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (s.sekuriti.toLowerCase().includes(q)) return true;
    return s.items.some(
      (i) =>
        (i.master_travo_blower?.jenis || "").toLowerCase().includes(q) ||
        i.kondisi.toLowerCase().includes(q) ||
        (i.keterangan || "").toLowerCase().includes(q)
    );
  });

  const renderSession = (s: ChecklistSession, index: number) => {
    const isExpanded = expanded.has(s.key);
    return (
      <Card
        key={s.key}
        containerStyle={[styles.itemCard, { marginTop: index === 0 ? 0 : 12 }]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.idNumber}>{s.sekuriti || "-"}</Text>
            <View style={styles.rowCenter}>
              <Icon name="check-square" type="feather" size={12} color="#6c757d" />
              <Text style={styles.subText}>{s.items.length} item</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.dateText}>{formatDate(s.tanggal)}</Text>
            <Text style={styles.timeText}>{formatTime(s.jam)}</Text>
            {s.business_unit && (
              <Badge
                value={s.business_unit}
                status="warning"
                containerStyle={styles.businessUnitBadge}
                textStyle={styles.badgeText}
              />
            )}
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icon name="check-circle" type="feather" size={16} color="#20c997" />
            <Text style={styles.statText}>{s.baikCount} Baik</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Icon name="x-circle" type="feather" size={16} color="#dc3545" />
            <Text style={styles.statText}>{s.rusakCount} Rusak</Text>
          </View>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.expandButton} onPress={() => toggle(s.key)}>
            <Icon
              name={isExpanded ? "chevron-up" : "chevron-down"}
              type="feather"
              size={16}
              color="#6c757d"
            />
            <Text style={styles.expandText}>
              {isExpanded ? "Sembunyikan" : "Detail"}
            </Text>
          </TouchableOpacity>
        </View>

        {isExpanded && (
          <View style={styles.cardContent}>
            {s.items.map((it) => (
              <View key={it.id} style={styles.itemRow}>
                <View style={styles.itemRowLeft}>
                  <Text style={styles.itemName}>
                    {it.master_travo_blower?.jenis || "-"}
                  </Text>
                  {it.keterangan ? (
                    <Text style={styles.itemNote}>{it.keterangan}</Text>
                  ) : null}
                </View>
                <Badge
                  value={it.kondisi}
                  badgeStyle={{
                    backgroundColor:
                      it.kondisi === "Rusak" ? "#dc3545" : "#20c997",
                  }}
                  textStyle={styles.badgeText}
                />
              </View>
            ))}
          </View>
        )}

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => deleteSession(s)}
          >
            <Icon name="trash-2" type="feather" size={16} color="#dc3545" />
            <Text style={[styles.actionButtonText, { color: "#dc3545" }]}>
              Hapus
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  if (filterLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#20c997" />
          <Text style={styles.loadingText}>Loading permissions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Checklist Travo Blower</Text>
        <Text style={styles.headerSubtitle}>
          {filteredSessions.length} sesi checklist
        </Text>
      </View>

      {canSeeAllData && (
        <View style={styles.masterBadge}>
          <Icon name="star" type="feather" size={16} color="#333" />
          <Text style={styles.masterBadgeText}>
            Master View - Semua business unit
          </Text>
        </View>
      )}
      {!canSeeAllData && dataFilter && (
        <View style={styles.filterBadge}>
          <Icon name="filter" type="feather" size={16} color="#1976d2" />
          <Text style={styles.filterBadgeText}>
            Business unit: {dataFilter.toUpperCase()}
          </Text>
        </View>
      )}
      {dateFilter.isActive && (
        <View style={styles.dateFilterBadge}>
          <Icon name="calendar" type="feather" size={16} color="#007bff" />
          <Text style={styles.dateFilterBadgeText}>
            {getDateFilterSummary(dateFilter)}
          </Text>
        </View>
      )}

      <SearchBar
        placeholder="Cari sekuriti, jenis, kondisi, keterangan..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        containerStyle={styles.searchContainer}
        inputContainerStyle={styles.searchInputContainer}
        inputStyle={styles.searchInput}
        searchIcon={{ size: 20 }}
        clearIcon={{ size: 20 }}
        round
        lightTheme
      />

      <DateFilter value={dateFilter} onChange={setDateFilter} themeColor="#007bff" />

      <View style={styles.addButtonContainer}>
        <Button
          title="Buat Checklist Baru"
          onPress={() => navigation.navigate("LaporanTravoBlowerCreate")}
          buttonStyle={styles.addButton}
          titleStyle={styles.addButtonText}
          icon={{ name: "plus", type: "feather", color: "white", size: 18 }}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <Icon name="loader" type="feather" size={32} color="#20c997" />
            <Text style={styles.loadingText}>Memuat data...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Icon name="alert-circle" type="feather" size={48} color="#dc3545" />
            <Text style={styles.errorText}>{error}</Text>
            <Button
              title="Coba Lagi"
              onPress={fetchData}
              buttonStyle={styles.retryButton}
              type="outline"
            />
          </View>
        ) : filteredSessions.length === 0 ? (
          <View style={styles.centerContainer}>
            <Icon name="check-square" type="feather" size={64} color="#6c757d" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? "Tidak ada hasil" : "Belum ada checklist"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? "Coba ubah kata kunci pencarian"
                : "Buat checklist travo/blower pertama"}
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredSessions.map((s, i) => renderSession(s, i))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#212529" },
  headerSubtitle: { fontSize: 14, color: "#6c757d", marginTop: 4 },
  masterBadge: {
    backgroundColor: "#ffd700",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  masterBadgeText: { color: "#333", fontWeight: "600", fontSize: 14, flex: 1 },
  filterBadge: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterBadgeText: { color: "#1976d2", fontWeight: "500", fontSize: 14, flex: 1 },
  dateFilterBadge: {
    backgroundColor: "#cce5ff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateFilterBadgeText: { color: "#007bff", fontWeight: "500", fontSize: 14, flex: 1 },
  searchContainer: {
    backgroundColor: "transparent",
    borderTopWidth: 0,
    borderBottomWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInputContainer: { backgroundColor: "white", height: 44 },
  searchInput: { fontSize: 16 },
  addButtonContainer: { paddingHorizontal: 16, paddingBottom: 8 },
  addButton: { backgroundColor: "#20c997", borderRadius: 8, height: 48 },
  addButtonText: { fontSize: 16, fontWeight: "600", marginLeft: 8 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 20 },
  listContainer: { paddingTop: 8 },
  itemCard: {
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: "white",
    borderWidth: 0,
    padding: 0,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    backgroundColor: "#c6f7d6",
  },
  headerLeft: { flex: 1 },
  idNumber: { fontSize: 18, fontWeight: "bold", color: "#212529", marginBottom: 4 },
  rowCenter: { flexDirection: "row", alignItems: "center" },
  subText: { fontSize: 12, color: "#6c757d", marginLeft: 4 },
  headerRight: { alignItems: "flex-end" },
  dateText: { fontSize: 14, fontWeight: "600", color: "#495057" },
  timeText: { fontSize: 12, color: "#6c757d", marginTop: 2 },
  businessUnitBadge: { marginTop: 4 },
  badgeText: { fontSize: 10 },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#c6f7d6",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { fontSize: 12, color: "#495057", fontWeight: "500" },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: "#dee2e6",
    marginHorizontal: 12,
  },
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
  },
  expandText: { fontSize: 12, color: "#6c757d", fontWeight: "500" },
  cardContent: { padding: 16, backgroundColor: "white" },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f5",
  },
  itemRowLeft: { flex: 1, marginRight: 12 },
  itemName: { fontSize: 14, color: "#212529", fontWeight: "500" },
  itemNote: { fontSize: 12, color: "#6c757d", marginTop: 2 },
  cardFooter: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    backgroundColor: "#c6f7d6",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
  },
  actionButtonText: { fontSize: 14, color: "#20c997", fontWeight: "500" },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: { fontSize: 16, color: "#6c757d", marginTop: 16 },
  errorText: {
    fontSize: 16,
    color: "#dc3545",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: { borderColor: "#dc3545", borderWidth: 1 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#495057",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6c757d",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: tidak ada error. Jika embedded select bikin tipe `master_travo_blower` jadi array, cast `as unknown as CheckRecord[]` (sudah dipakai) menanganinya.

- [ ] **Step 3: Verifikasi bundling (web + android)**

Run:
```bash
curl -s -o /dev/null -w "android:%{http_code}\n" "http://localhost:8083/index.bundle?platform=android&dev=true&minify=false"
curl -s -o /dev/null -w "web:%{http_code}\n" "http://localhost:8083/index.bundle?platform=web&dev=true&minify=false"
```
Expected: `android:200` dan `web:200`.

- [ ] **Step 4: Commit**

```bash
git add src/screens/laporan/travo_blower/LaporanTravoBlowerList.tsx
git commit -m "feat(travo): rewrite list to show checklist sessions from travo_blower_checks"
```

---

### Task 5: Verifikasi integrasi & uji jalan

**Files:** (tidak ada perubahan kode; verifikasi menyeluruh)

- [ ] **Step 1: Typecheck penuh**

Run: `npx tsc --noEmit`
Expected: 0 error.

- [ ] **Step 2: Unit test**

Run: `npm test`
Expected: semua test PASS.

- [ ] **Step 3: Uji manual di perangkat/Expo**

Jalankan `npx expo start`, buka app, login dengan user asli, lalu verifikasi:
- Buka menu Travo/Blower → List menampilkan sesi (atau empty state).
- Tekan "Buat Checklist Baru" → daftar item master muncul sesuai business_unit.
- Coba Simpan tanpa menandai semua → muncul pesan jumlah item belum ditandai + border merah pada item kosong; sekuriti kosong → pesan sekuriti wajib.
- Tandai semua (campur Baik/Rusak), isi keterangan pada yang Rusak, pilih sekuriti → Simpan → "Berhasil".
- Kembali ke List → sesi baru muncul dengan ringkasan `X Baik / Y Rusak`; expand menampilkan tiap item + kondisi + keterangan.
- Hapus sesi → hilang dari daftar.
- **Verifikasi Risiko #1 (casing business_unit):** jika daftar item master kosong padahal seharusnya ada, cek nilai `business_unit` di `master_travo_blower` vs `profiles.business_unit`. Jika casing beda, sesuaikan filter di `useTravoBlowerMaster.ts` dan `.eq("master_travo_blower.business_unit", ...)` di List (mis. tambah `.toLowerCase()` konsisten dengan `useSecurityNames`).
- **Verifikasi Risiko #2 (`keterangan` NOT NULL):** insert pertama sukses membuktikan kolom menerima string kosong. Jika error not-null lain muncul, isi kolom tsb sesuai.

- [ ] **Step 4: Konfirmasi web monitoring**

Pastikan baris baru muncul di web monitoring security (sumber `travo_blower_checks`) dengan `kondisi` = "Baik"/"Rusak".

- [ ] **Step 5: Commit catatan penyesuaian (jika ada)**

Jika Step 3 menuntut penyesuaian casing, commit:
```bash
git add -A
git commit -m "fix(travo): align business_unit casing for master filter"
```

---

## Catatan Penutup
- Tabel lama `laporan_travo_blower` dan datanya dibiarkan (tidak dihapus) — di luar scope.
- Foto & edit sesi di luar scope v1 (lihat spec §6).
