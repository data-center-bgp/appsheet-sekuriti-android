# Desain: Fitur Checklist Travo/Blower (Mobile App)

Tanggal: 2026-07-29
Status: Draft untuk review

## 1. Latar Belakang

Saat ini laporan Travo/Blower berupa **form satu-record**: sekuriti mengetik
`jenis`, `posisi_travo_blower`, `jumlah`, `status`, `keterangan` untuk satu unit,
lalu disimpan ke tabel `laporan_travo_blower`.

Perubahan yang diminta: ubah menjadi **checklist**. Daftar unit travo/blower yang
harus dicek sudah tersedia di tabel master (`master_travo_blower`), difilter per
`business_unit`. Sekuriti tinggal menandai kondisi tiap unit (**Baik/Rusak**) plus
catatan opsional. Hasil disimpan ke tabel khusus `travo_blower_checks`.

Alasan pindah tabel: `travo_blower_checks` sudah dirancang untuk pola checklist,
sehingga tidak perlu mengisi kolom-kolom lama `laporan_travo_blower` yang tidak
relevan (`jenis`/`posisi_travo_blower`/`jumlah`/`status`).

## 2. Model Data (terverifikasi lewat REST introspection)

### `master_travo_blower` (sumber item checklist — read-only dari app)
| Kolom | Tipe | Catatan |
|---|---|---|
| `id` | uuid | PK, FK target |
| `business_unit` | text | filter per BU |
| `jenis` | text | **label item** yang ditampilkan di checklist |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `travo_blower_checks` (tujuan simpan — app menulis ke sini)
| Kolom | Tipe | Diisi app? | Nilai |
|---|---|---|---|
| `id` | uuid | ya | digenerate `generateUUID()` |
| `master_travo_blower_id` | uuid | ya | id item master |
| `kondisi` | text | ya | **"Baik"** atau **"Rusak"** |
| `keterangan` | text | ya (opsional) | catatan; boleh string kosong |
| `foto` | (nullable) | tidak | dibiarkan null (di luar scope) |
| `tanggal` | date | ya | header sesi |
| `jam` | text/time | ya | header sesi |
| `sekuriti` | text | ya | header sesi |
| `created_at` | timestamptz | tidak | default DB |
| `updated_at` | timestamptz | tidak | default DB |

Catatan: `travo_blower_checks` **tidak punya** kolom `business_unit`, `user_id`,
maupun `session_id`. BU diturunkan lewat join ke master. Satu sesi inspeksi
dikelompokkan secara logis oleh kombinasi (`tanggal`, `jam`, `sekuriti`).

## 3. Fitur A — Layar Checklist (ganti `LaporanTravoBlowerCreate.tsx`)

### Perilaku
1. Saat dibuka, ambil `business_unit` user via `useUserBusinessUnit()`.
2. Muat item: `select id, jenis from master_travo_blower` difilter
   `business_unit` user (lihat Risiko #1 soal casing). Untuk role `master`:
   tampilkan semua item (tanpa filter BU).
3. **Header sesi** (sekali untuk semua item):
   - `tanggal` — date picker (default hari ini), pola sama seperti form lama.
   - `jam` — time picker (default jam sekarang WIB), reuse `timeHandler`.
   - `sekuriti` — `DropdownSelector` dari `useSecurityOptions(businessUnit)`.
4. **Daftar item checklist** — tiap item satu baris/kartu menampilkan `jenis` +:
   - **Kondisi**: dua tombol pilihan **Baik / Rusak** (segmented). **Wajib dipilih
     manual** — tidak ada default.
   - **Keterangan**: `Input` teks opsional per item.
5. **State**: `Map<masterId, { kondisi: "Baik"|"Rusak"|null, keterangan: string }>`.

### Validasi sebelum simpan
- `sekuriti` wajib dipilih.
- Minimal ada 1 item master (kalau kosong → empty state, tombol simpan disabled).
- **Setiap item wajib punya `kondisi`** (Baik atau Rusak). Jika masih ada yang
  kosong, blokir submit dan tampilkan jumlah item yang belum dipilih + tandai
  baris yang belum terisi.
- `keterangan` selalu opsional (termasuk saat "Rusak").

### Simpan
- Bangun array N baris (satu per item), lalu **satu** `insert` batch ke
  `travo_blower_checks`:
  ```
  { id: generateUUID(), master_travo_blower_id, kondisi, keterangan,
    tanggal, jam, sekuriti }
  ```
- Sukses → `Alert` "Berhasil" → `navigation.goBack()`.
- Gagal → tampilkan pesan error (pola sama seperti layar lain).

### Mode edit
- **Di luar scope v1.** Layar ini hanya membuat sesi inspeksi baru. Rute
  `LaporanTravoBlowerCreate` tetap menerima param `editData?` (kompat), tapi tidak
  digunakan. (Edit/koreksi sesi bisa jadi iterasi berikutnya.)

## 4. Fitur B — Layar List (ganti `LaporanTravoBlowerList.tsx`)

### Perilaku
1. Query `travo_blower_checks` di-join ke master untuk label & BU:
   ```
   .select('id, master_travo_blower_id, kondisi, keterangan, tanggal, jam,
            sekuriti, created_at, master_travo_blower!inner(jenis, business_unit)')
   ```
2. Filter BU pada kolom embedded: `.eq('master_travo_blower.business_unit', bu)`
   untuk non-master; master melihat semua.
3. Filter tanggal (reuse `DateFilter` + `applyDateFilter` pada kolom `tanggal`).
4. Urutkan `created_at` desc.
5. **Kelompokkan per sesi** = (`tanggal` + `jam` + `sekuriti`) di sisi klien.
   Tiap grup = satu kartu "laporan":
   - Header: tanggal, jam, sekuriti, badge BU, ringkasan `X Baik / Y Rusak`.
   - Expand: daftar item (`jenis` → badge kondisi berwarna + keterangan).
6. **Hapus sesi**: hapus semua baris `travo_blower_checks` dengan
   (`tanggal`,`jam`,`sekuriti`) grup tsb (dengan konfirmasi).
7. **Search**: filter klien atas `jenis`/`sekuriti`/`kondisi` pada data termuat.
8. Tombol "Tambah" → `navigation.navigate("LaporanTravoBlowerCreate")`.

### Pagination
- Muat berbasis baris (range) seperti sekarang, lalu kelompokkan yang termuat.
  Konsekuensi: satu sesi bisa terpotong antar-halaman. Untuk v1 diterima; kalau
  jadi masalah, ganti ke strategi "muat semua per rentang tanggal". (Lihat Risiko #3)

## 5. Reuse & Perubahan File

| File | Aksi |
|---|---|
| `src/screens/laporan/travo_blower/LaporanTravoBlowerCreate.tsx` | **tulis ulang** jadi checklist |
| `src/screens/laporan/travo_blower/LaporanTravoBlowerList.tsx` | **tulis ulang** baca `travo_blower_checks` |
| `src/hooks/useUserBusinessUnit.ts` | reuse (tanpa ubah) |
| `src/hooks/useSecurityNames.ts` | reuse `useSecurityOptions` |
| `src/hooks/useDataFilter.ts` | reuse untuk List |
| `src/components/DropdownSelector.tsx` | reuse |
| `src/utils/timeHandler.ts`, `dateFilter.ts`, `uuid.ts` | reuse |
| `src/types/navigation.ts` | tetap (nama rute tak berubah) |
| (opsional) hook baru `useTravoBlowerMaster.ts` | muat item master per BU, agar Create ramping |

Tidak ada perubahan skema database dari sisi app (kedua tabel sudah ada).

## 6. Di Luar Scope (YAGNI)
- Upload `foto` per item.
- Edit/koreksi sesi yang sudah tersimpan.
- Migrasi/menampilkan data lama `laporan_travo_blower` (tabel lama dibiarkan;
  tidak dihapus).
- Manajemen isi `master_travo_blower` dari mobile (dikelola dari web).

## 7. Risiko / Perlu Diverifikasi saat Implementasi
1. **Casing `business_unit`**: `applyBusinessUnitFilter` mencocokkan nilai apa
   adanya, sedangkan `useSecurityOptions` memakai `.toLowerCase()`. Perlu
   dipastikan bagaimana `master_travo_blower.business_unit` disimpan agar filter
   Create & List benar. Verifikasi saat implementasi (butuh sesi login/aku uji
   dengan user asli).
2. **Kolom required di `travo_blower_checks`**: kalau `keterangan` NOT NULL, kirim
   string kosong (bukan null). Insert pertama akan mengonfirmasi.
3. **Grouping vs pagination** di List (lihat §4).
4. **Role `master`** melakukan inspeksi: diasumsikan tampil semua item; konfirmasi
   apakah perlu pemilihan BU.

## 8. Kriteria Sukses
- Sekuriti membuka layar Travo/Blower → melihat daftar unit dari master sesuai BU.
- Tiap unit bisa ditandai Baik/Rusak + catatan; submit hanya bisa bila semua unit
  sudah ditandai.
- Setelah simpan, muncul N baris di `travo_blower_checks` (cek via web monitoring).
- List menampilkan hasil checklist per sesi, bisa difilter tanggal & dihapus.
