# Encasa-Grouping

Web Tes Diagnostik Online dengan **Sistem Anti-Cheat**, integrasi **Google Sheets**, dan **redirect WhatsApp otomatis**.

## Tech Stack

- **Framework:** Vite + React (JavaScript)
- **Styling:** Tailwind CSS v3 — tema biru flat (tanpa gradient), font **Inter**
- **Icons:** Bootstrap Icons (`react-icons/bi`)
- **Deployment:** Vercel (termasuk Serverless Functions di `/api` untuk FASE 4)

## Roadmap

| Fase | Fitur | Status |
| ---- | ----- | ------ |
| 1 | Setup proyek & UI Form Identitas (Nama + Dropdown Kelas) | ✅ Selesai |
| 2 | Mesin Tes & Fitur Anti-Cheat (timer 60 menit, navigasi soal, deteksi tab, blokir copy-paste) | ✅ Selesai |
| 3 | Halaman Hasil & Redirect WhatsApp otomatis (`wa.me`) — alur ala Wayground/Quizizz | ✅ Selesai (nomor WA masih placeholder) |
| 4 | Backend Serverless `/api/submit-score` + Integrasi Google Sheets | ✅ Selesai (butuh service account, lihat panduan) |
| 5 | Finishing, responsive polish & panduan deploy Vercel | ⏳ |

## Struktur Folder

```
src/
  components/   # Komponen React (IdentityForm, dll.)
  hooks/        # Custom hooks (anti-cheat, timer — FASE 2)
  api/          # Koneksi backend (FASE 4)
  utils/        # Helper (validasi, konstanta)
  data/         # Data statis (daftar kelas, bank soal)
```

## Menjalankan Proyek

```bash
npm install
npm run dev      # development
npm run build    # production build
npm run preview  # preview hasil build
```

## 🔧 Data yang Perlu Diisi Admin

- `src/utils/constants.js` — **nomor WhatsApp admin** (masih placeholder `6281234567890`).
- `config.json` (root) — sudah berisi **Google API key** + **Spreadsheet ID**. ⚠️ File ini di-gitignore, jangan di-commit.
- `src/data/questions.js` — bank soal (30 soal) sudah terpasang.

## 🗄️ Integrasi Google Sheets

Hasil tes otomatis dikirim ke Google Sheet ini:
`https://docs.google.com/spreadsheets/d/1x4Fzgyv2D4BvX_NAYpn_39Kjd7Q4uxz0mBw3-SmyJkw`

> ⚠️ **Penting:** Google **API key** hanya bisa *membaca* data publik — **tidak bisa menulis**.
> Ada 2 jalur tulis: **Apps Script** (mudah, tanpa Cloud Console) atau **Service Account** (standar).

### ✅ Jalur 1 — Google Apps Script (paling mudah, disarankan)

1. Buka spreadsheet tujuan → menu **Extensions (Ekstensi) → Apps Script**.
2. Hapus isi editor, **tempel seluruh isi `apps-script/Code.gs`**.
3. Klik **Deploy → New deployment → type: Web app**.
   - Execute as: **Me** · Who has access: **Anyone**
4. Salin URL `https://script.google.com/macros/s/.../exec`.
5. Tempel ke `config.json` → `"appsScriptUrl": "https://.../exec"`
   (atau env `GOOGLE_APPS_SCRIPT_URL` untuk server / `VITE_APPS_SCRIPT_URL` untuk frontend langsung).
6. Selesai! Setiap siswa selesai tes, baris baru otomatis masuk ke Sheet (header dibuat otomatis).

### 🔄 Jalur 2 — Service Account (alternatif)

1. **Buat Service Account** di [console.cloud.google.com](https://console.cloud.google.com) →
   IAM & Admin → Service Accounts → Create → **Keys → Add Key → JSON** (download).
2. Simpan file sebagai **`service-account.json`** di root project ini
   (atau set env `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_PRIVATE_KEY` di Vercel).
3. Buka Google Sheet tujuan → **Share** → tambahkan email `client_email` dari JSON → role **Editor**.

### Uji lokal
```bash
npm run build
npm run serve        # http://localhost:8787 (dist + /api/submit-score)
```

### Deploy ke Vercel
```bash
npm i -g vercel
vercel
```
Folder `/api` otomatis jadi Serverless Functions. Jangan lupa set env vars di Vercel.

> ℹ️ `config.json` hanya untuk pemakaian lokal (file ini di-gitignore).
> Di Vercel lebih aman set env vars (mis. `GOOGLE_APPS_SCRIPT_URL`) daripada mengandalkan file.
"# Encasa-Assesment" 
