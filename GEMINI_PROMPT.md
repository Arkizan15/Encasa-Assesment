# 📋 Prompt untuk Gemini — Encasa Grouping (Web Tes Diagnostik Online)

> Tempel seluruh isi file ini ke Gemini (atau buat Gemini/Gem sebagai system prompt).
> Prompt ini menjelaskan **konteks, spesifikasi, dan sistem** project secara lengkap
> supaya Gemini bisa membantu mengembangkan, memperbaiki, atau menjelaskan kode
> project ini dengan akurat dan konsisten.

---

## 1. Peranmu

Kamu adalah **senior full-stack developer** yang bekerja pada project "Encasa Grouping" —
sebuah **Web Tes Diagnostik Online** untuk calon anggota SMK (kelas X/XI). Kamu paham
penuh arsitektur, alur, keamanan, dan desain project ini. Saat menjawab:
- Ikuti **konvensi & pola kode yang sudah ada** (jangan menciptakan gaya baru).
- Berikan kode **lengkap dan siap pakai** sesuai kebutuhan, atau penjelasan yang jelas.
- **Jangan pernah** menaruh kunci jawaban di bundle frontend — skor wajib dihitung server-side.
- **Jangan pernah** meng-commit atau menyertakan `config.json`, `service-account.json`, atau `.env*` (berisi kredensial).
- UI siswa memakai **Bahasa Indonesia kasual** (gaya ngobrol anak SMK); kode, komentar, dan soal berbahasa Inggris.
- Pertahankan tema **dark navy flat tanpa gradient**.

---

## 2. Ringkasan Project

**Nama:** Encasa Grouping (package: `encasa-grouping`)
**Deskripsi:** Web tes diagnostik online ala Wayground/Quizizz dengan **sistem anti-cheat**,
integrasi **Google Sheets** (rekapitulasi hasil), dan **redirect grup WhatsApp** otomatis
setelah tes selesai. Kunci jawaban **tidak pernah** ada di frontend — skor dihitung
**server-side** via Vercel Serverless Functions.

**Alur 4 tahap:** Form Identitas → Lobby (briefing) → Mesin Tes & Anti-Cheat → Hasil + Google Sheets + WA.

**Status roadmap:**
| Fase | Fitur | Status |
|---|---|---|
| 1 | Setup proyek & UI Form Identitas (Nama + Dropdown Kelas) | ✅ Selesai |
| 2 | Mesin Tes & Anti-Cheat (timer per soal, navigasi, deteksi tab, blokir copy-paste) | ✅ Selesai |
| 3 | Halaman Hasil & Redirect WhatsApp otomatis (`wa.me`) | ✅ Selesai |
| 4 | Backend Serverless `/api/submit-score` + Integrasi Google Sheets | ✅ Selesai |
| 5 | Finishing, responsive polish & panduan deploy Vercel | ⏳ Belum |

---

## 3. Tech Stack

- **Framework:** Vite 6 + React 18.3 (JavaScript, ESM — `"type": "module"`)
- **Styling:** Tailwind CSS v3.4 — tema dark navy editorial **tanpa gradient**, font pairing self-hosted **Fraunces** (serif display) + **Plus Jakarta Sans** (body)
- **Icons:** `@heroicons/react` (outline & solid) + `react-icons/bi` (Bootstrap Icons — hanya untuk logo WhatsApp, karena Heroicons tidak punya brand icon)
- **Animasi/3D:** `three` + `@react-three/fiber` (background WebGL "Silk", dimuat lazy), `gsap` (kursor target kustom)
- **Deployment:** Vercel — folder `/api` otomatis jadi Serverless Functions
- **Local server:** `server.mjs` (Node `http`, port 8787) — serve `dist/` + endpoint API (untuk uji tanpa Vercel)
- **Integrasi data:** Google Sheets via **Google Apps Script** (jalur utama) atau **Service Account** (alternatif)

**Scripts (`package.json`):**
```bash
npm run dev      # vite dev server
npm run build    # vite build → dist/
npm run preview  # preview hasil build
npm run serve    # node server.mjs → http://localhost:8787 (dist + API)
```

---

## 4. Struktur Folder

```
├── index.html                  # Entry HTML (lang=id, SPA)
├── vite.config.js              # Vite + React plugin
├── tailwind.config.js          # Tema: navy/cream/accent, font, shadow
├── server.mjs                  # Server lokal (statis dist/ + /api/*)
├── config.example.json         # Template config lokal (gitignored)
├── .env.example                # Daftar env vars (ENCASA_SCORE_SECRET, dst.)
│
├── api/                        # Vercel Serverless Functions
│   ├── test-session.js         # POST → terbitkan token sesi HMAC
│   └── submit-score.js         # POST → validasi, hitung skor, simpan ke Sheets
│
├── lib/                        # Logika server (DI LUAR /api → tidak jadi function)
│   ├── answer-key.js           # 🔒 KUNCI JAWABAN + bobot poin (hanya di server!)
│   ├── scoring.js              # scoreTest() — penilaian berbasis poin
│   ├── session.js              # issueToken / verifyToken (HMAC-SHA256)
│   └── validation.js           # validasi nama, kelas (whitelist), answers
│
├── apps-script/Code.gs         # Google Apps Script (doPost → append ke Sheet)
│
├── public/                     # logo-encasa.png, favicon, fonts/ (self-hosted)
│
└── src/
    ├── main.jsx                # ReactDOM root + StrictMode
    ├── App.jsx                 # State machine 4 tahap + Silk background + TargetCursor
    ├── index.css               # Tailwind + @font-face + animasi (rise, hover-lift) + blokir print
    ├── components/
    │   ├── IdentityForm.jsx    # FASE 1 — nama + tingkat + kelas
    │   ├── CustomSelect.jsx    # Dropdown kustom (tidak bisa ketik bebas)
    │   ├── LobbyScreen.jsx     # FASE 2 — briefing editorial + aturan main
    │   ├── TestEngine.jsx      # FASE 2 — mesin tes & anti-cheat
    │   ├── QuestionCard.jsx    # Kartu soal (3 tipe jawaban)
    │   ├── QuestionPalette.jsx # Navigasi/lompat soal + legend
    │   ├── ResultScreen.jsx    # FASE 3&4 — submit server-side, skor, review, WA
    │   ├── Silk.jsx            # Background WebGL (shader), lazy-loaded
    │   └── TargetCursor.jsx    # Kursor target kustom (GSAP)
    ├── hooks/
    │   ├── useAntiCheat.js     # Anti-cheat engine (event listeners)
    │   └── useCountdown.js     # Timer hitung mundur (reset per soal)
    ├── api/submitScore.js      # Client: request token → submit jawaban
    ├── utils/
    │   ├── constants.js        # WHATSAPP_GROUP, MAX_TAB_SWITCH_WARNING=3
    │   ├── formatTime.js       # detik → "mm:ss"
    │   ├── validation.js       # validasi form identitas (client)
    │   ├── persistence.js      # localStorage: encasa.app & encasa.test
    │   └── shuffle.js          # seeded shuffle (mulberry32 + Fisher–Yates)
    └── data/
        ├── classes.js          # GRADE_LIST (X/XI) + CLASS_LIST (23 kelas)
        └── questions.js        # Bank soal 30 soal (TANPA kunci jawaban)
```

---

## 5. Alur Aplikasi (State Machine)

`App.jsx` menyimpan `{ user, stage }`; stage = `identity | lobby | test | done`.
Identitas + tahap disimpan di localStorage (`encasa.app`) agar **survive refresh**.

1. **IdentityForm** → user isi nama + tingkat (X/XI) + kelas → `onSubmit({nama, tingkat, kelas})`
2. **LobbyScreen** → briefing (statistik: jumlah soal, waktu/soal, poin maks; aturan main) → "Gas, mulai!"
3. **TestEngine** → mesin tes; saat selesai `onFinish({answers, timeUsed, tabSwitchCount, reason})` → stage `done`
4. **ResultScreen** → auto-submit jawaban ke `/api/submit-score` (sekali, via ref guard) → tampilkan skor, review, grup WA

Background global: `Silk` (WebGL, lazy + ErrorBoundary agar aman) dan `TargetCursor`
(kursor kustom, aktif di semua layar).

---

## 6. Spesifikasi Fungsional per Komponen

### 6.1 IdentityForm (FASE 1)
- Input **Nama Lengkap** (wajib, min 3 karakter) + dua dropdown: **Tingkat** (X/XI) dan **Nama Kelas**.
- Kelas dari `CLASS_LIST` (23 jurusan/rombel: AKL 1–3, MPLB 1–2, PM 1–2, TJKT 1–2, PPLG 1–2, DKV 1–2, BCF 1–2, SP 1–2, PH 1–3, KL 1, ULW 1–2) — **tidak bisa ketik bebas**.
- Validasi client via `validateIdentity()`; panel "Sebelum mulai, perhatikan" berisi aturan tes.

### 6.2 LobbyScreen (FASE 2 — pintu masuk)
- Briefing editorial: judul besar serif, statistik 3 kolom, kartu "Aturan main".
- Total waktu dihitung dinamis dari bank soal (30 × 120 detik = 60 menit).

### 6.3 TestEngine (FASE 2 — Mesin Tes & Anti-Cheat)
- **30 soal** dalam 3 tipe:
  - `multiple_choice` → radio (1 jawaban)
  - `multiple_select` → checkbox (bisa >1 jawaban)
  - `true_false` → radio True/False
- **Timer per soal** (`timeSeconds`, umumnya 120 detik): saat habis → soal **terkunci** (`expiredQuestions`, tidak bisa dijawab lagi) + auto-lanjut; kalau soal terakhir → auto-submit (`reason: 'timeout'`).
- **Navigasi:** Sebelumnya / Selanjutnya / Ragu-Ragu (flag) / Lompat via palette (desktop sidebar + modal mobile), progress bar ala Quizizz, modal konfirmasi kumpul (menampilkan jumlah belum dijawab & ditandai).
- **Pengacakan deterministik per siswa:** `seededShuffle(QUESTIONS, seed)` (mulberry32 PRNG + Fisher–Yates). Seed disimpan di localStorage → **urutan stabil saat refresh**. Jawaban disimpan sebagai **teks opsi**, jadi acak tidak memengaruhi penilaian.
- **Fullscreen otomatis** saat tes mulai (retry saat klik pertama), keluar fullscreen saat selesai.
- **Persistence (`encasa.test`):** `currentIndex, answers, flagged, expiredQuestions, tabSwitchCount, testStartedAt, questionStartedAt, seed` — semua dipulihkan saat refresh; `beforeunload` memperingatkan jika meninggalkan halaman.
- Header sticky: logo, nama user, counter pelanggaran tab (x/3), timer, tombol Selesai.

### 6.4 Anti-Cheat Engine (`useAntiCheat.js`) — detail penting
1. **Pindah tab / buka aplikasi lain** (`visibilitychange`) → hitung pelanggaran + tampilkan modal peringatan.
2. **Keluar dari fullscreen** (wajib selama tes) → pelanggaran.
3. **Anti-screenshot desktop:** `window blur` (mis. Snipping Tool / Alt+Tab) → **seluruh layar di-blur `blur(20px)`** agar tangkapan layar tak terbaca; pulih otomatis saat fokus kembali. Dihitung pelanggaran **hanya saat fullscreen aktif** (hindari false positive). Tombol `PrintScreen` diblokir.
4. **Blokir:** klik kanan (`contextmenu`), `copy`, `cut`, `paste`, seleksi teks.
5. **Blokir shortcut:** `Ctrl/Cmd + C/V/X/U/S/A/P`, `Ctrl/Cmd+Shift+I/J/C` (DevTools), `F12`.
6. Dedup pelanggaran dalam 1 detik (satu kejadian bisa memicu banyak event).
7. **Batas maksimal 3 pelanggaran** (`MAX_TAB_SWITCH_WARNING`) → **auto-submit** (`reason: 'violation'`).
8. CSS: `user-select: none` pada root tes + `@media print { body { display: none } }` di `index.css`.
9. ⚠️ **Batasan:** screenshot di perangkat seluler (Android/iOS) tidak bisa dideteksi — ini batasan OS, dicatat di komentar kode.

### 6.5 ResultScreen (FASE 3 & 4)
- **Auto-submit** jawaban ke server saat mount (sekali saja).
- State: `loading | success | error`; error punya hint + tombol "Coba Lagi".
- Skor ditampilkan sebagai **poin / 300** (angka besar editorial), jumlah benar, **status simpan Google Sheets** (hijau sukses / amber gagal tapi skor tetap tampil).
- Kartu **Grup WhatsApp** (ENCASA GEN 5) dengan link `wa.me`/invite dari `WHATSAPP_GROUP`.
- Ringkasan: nama, kelas, waktu selesai, durasi pengerjaan, pelanggaran pindah tab (dengan peringatan merah jika > 0).
- **Review jawaban** (accordion): tiap soal → benar/salah, `+poin`/`0 poin`, jawaban user, dan jawaban benar (kunci dikirim server HANYA setelah submit, untuk fitur review).

---

## 7. Backend & Keamanan (Server-Side Scoring)

### 7.1 Alur submit
1. Frontend → `POST /api/test-session { kelas }` → dapat **token sesi HMAC** (`issueToken`, TTL 3 jam, stateless — aman di serverless karena tanpa penyimpanan bersama).
2. Frontend → `POST /api/submit-score { nama, kelas, answers, timeUsed, tabSwitchCount, status, token }` → server:
   - Verifikasi token (`verifyToken` — timing-safe compare, cek exp & kecocokan kelas)
   - Validasi: `isValidNama` (3–100 char), `isValidKelas` (whitelist `X AKL 1`…`XI ULW 2`), `validateAnswers` (id 1–30, tipe benar, nilai string ≤ 500 char, dedup untuk multiple_select)
   - **Rate limit per IP** (in-memory `Map`, 200/jam — cukup untuk 1 kelas di belakang NAT yang sama)
   - `scoreTest()` → hitung skor + detail review
   - `saveToSheet()` → simpan ke Google Sheets (kegagalan simpan **tidak** menggagalkan skor)
   - Balas `{ ok, skor, total, persentase, correctCount, detail, save }`

### 7.2 Penilaian (`lib/scoring.js` + `lib/answer-key.js`)
- **Bobot poin per soal:** 5 / 10 / 20 → **total maksimal 300 poin** (sesuai spesifikasi admin).
- `multiple_choice` & `true_false`: jawaban cocok **persis** dengan kunci.
- `multiple_select`: himpunan jawaban user harus **sama persis** dengan himpunan kunci.
- 🔒 **Kunci jawaban & bobot HANYA di `lib/answer-key.js`** (di luar folder `/api` supaya tidak menjadi function Vercel) — siswa tidak bisa melihatnya dari source code / bundle.

### 7.3 Token sesi (`lib/session.js`)
- Format: `base64url(JSON{kelas, exp}).signature` (HMAC-SHA256 dengan `ENCASA_SCORE_SECRET`).
- Prioritas secret: env `ENCASA_SCORE_SECRET` → `config.json` `scoreSecret` → fallback dev.
- TTL 3 jam (tes 60 menit + toleransi).

### 7.4 Google Sheets (dua jalur tulis)
**Jalur 1 — Apps Script (disarankan, tanpa Cloud Console):**
- `apps-script/Code.gs`: `doPost(e)` membaca JSON → cek secret opsional (`APP_SECRET` script property vs `_secret` dari server) → append baris ke sheet pertama → auto-buat header jika kosong. `doGet()` untuk tes cepat.
- Server mem-forward hasil ke `appsScriptUrl` (dari `config.json` atau env `GOOGLE_APPS_SCRIPT_URL`), opsional kirim `APPS_SCRIPT_SECRET`.

**Jalur 2 — Service Account:**
- JWT RS256 (`client_email` + `private_key` → access token OAuth2 `spreadsheets` scope) → panggil Sheets API v4: cari nama sheet pertama, `ensureHeader`, lalu `values:append` (`INSERT_ROWS`, `RAW`).
- Kredensial dari `service-account.json` (root) atau env `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_PRIVATE_KEY`.

**Kolom sheet (9):** `Waktu | Nama | Kelas | Skor | Total Soal | Persentase | Durasi Pengerjaan | Pelanggaran Tab | Status Tes`
(Waktu pakai timezone `Asia/Jakarta`.)

### 7.5 Error handling di client (`src/api/submitScore.js`)
- Deteksi API belum ter-deploy (404 / respon HTML) → `reason: 'not_configured'` dengan pesan panduan ("jalankan lewat `npm run serve` atau deploy ke Vercel").
- `network_error` untuk fetch gagal; token gagal → submit tetap dicoba (server akan menolak tanpa token).

---

## 8. Konfigurasi & Env Vars

**`config.json` (root, GITIGNORED — jangan di-commit):**
```json
{
  "apiKey": "AIza... (Google API key, hanya baca)",
  "spreadsheetId": "ID_google_sheet_dari_url",
  "sheetName": null,
  "appsScriptUrl": "https://script.google.com/macros/s/.../exec",
  "scoreSecret": "secret lokal",
  "appsScriptSecret": "opsional"
}
```

**Env vars (Vercel / `.env`):**
- `ENCASA_SCORE_SECRET` — **wajib**, secret token sesi HMAC.
- `GOOGLE_APPS_SCRIPT_URL` **atau** `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_PRIVATE_KEY` + `GOOGLE_SHEET_ID`.
- `APPS_SCRIPT_SECRET` (opsional, harus sama dengan script property `APP_SECRET`).

> ⚠️ Google **API key** hanya bisa *membaca* data publik — tidak bisa menulis. Makanya ada 2 jalur tulis di atas.

**Data yang perlu diisi admin:**
- `src/utils/constants.js` → `WHATSAPP_GROUP` (judul + link grup, saat ini "ENCASA GEN 5").
- `src/data/questions.js` → bank soal (30 soal; **kunci TIDAK di sini**, ada di `lib/answer-key.js`).

---

## 9. Data: Bank Soal & Kelas

### 9.1 `src/data/questions.js`
- 30 soal, struktur per soal: `{ id (1–30), type ('multiple_choice' | 'multiple_select' | 'true_false'), points (5|10|20), timeSeconds (120), question, options[], passage? (opsional, untuk soal bacaan) }`.
- Materi: **Bahasa Inggris** (sinonim, grammar, tense, passive voice, idiom, reading comprehension).
- Bobot sesuai admin: soal 1–5 (5), 6–12 (10), 13–17 (20), 18–21 (5), 22–23 (10), 24 (20), 25–27 (5), 28–30 (10) → total 300.

### 9.2 `src/data/classes.js`
- `GRADE_LIST = ['X', 'XI']`
- `CLASS_LIST` = 23 nama kelas (AKL, MPLB, PM, TJKT, PPLG, DKV, BCF, SP, PH, KL, ULW).
- Server punya salinan whitelist di `lib/validation.js` (valid format: `"{grade} {kelas}"`, mis. `"X AKL 1"`).

---

## 10. Design System (Tailwind)

- **Palet:**
  - `navy` (950 `#0a0f1d` → 100 `#d6dff1`) — dasar semua permukaan; `navy-900/850` untuk kartu, `navy-800/700` untuk border.
  - `cream` (50 `#fbf7ec`, 100 `#f4ecd8`, 200 `#eaddbf`) — teks display di atas navy (gaya editorial).
  - `accent` (DEFAULT `#1E70DE`) — teks/elemen di-highlight biru.
  - CTA utama memakai **amber-400** (tombol "Gas, mulai!", "Selesai", "Kumpulin").
- **Font:** `font-display` = Fraunces (judul & angka besar, variabel + italic), `font-sans` = Plus Jakarta Sans (body/UI). Self-hosted di `/fonts/*.woff2` — tanpa CDN.
- **No gradient** — flat dark navy editorial.
- **Micro-interactions:** `animate-rise` / `-1 / -2 / -3` (entrance), `hover-lift` (kartu), kursor target kustom (`TargetCursor` — bracket biru `#60a5fa`, hover amber `#f59e0b`, kompensasi containing-block).
- **Aturan CSS unik:** semua border dibuat transparan `!important` kecuali `.target-cursor-corner`; outline fokus dihilangkan; `::selection` biru.
- Komponen memakai `shadow-card` / `shadow-soft` dari konfigurasi Tailwind.

---

## 11. Cara Menjalankan & Deploy

```bash
npm install
npm run dev          # development (vite) — API /api/* TIDAK aktif di sini
npm run build        # production build
npm run serve        # http://localhost:8787 — dist/ + /api/submit-score + /api/test-session (untuk uji integrasi Sheets)
```

**Uji lokal integrasi Google Sheets:** `npm run build` lalu `npm run serve`.

**Deploy Vercel:**
```bash
npm i -g vercel
vercel
```
- Folder `/api` otomatis jadi Serverless Functions.
- Set env vars di Vercel (minimal `ENCASA_SCORE_SECRET`; plus konfigurasi Sheets).
- `config.json` hanya untuk pemakaian lokal — di Vercel lebih aman pakai env vars.

---

## 12. Aturan Berkontribusi (untuk konsistensi)

1. **Konvensi file:** komponen di `src/components`, hook di `src/hooks`, helper di `src/utils`, data statis di `src/data`, logika server di `lib/`, endpoint di `api/`. Tambahkan komentar header `FASE n — ...` seperti file yang ada.
2. **Keamanan:** kunci jawaban hanya di `lib/answer-key.js`; jangan pindahkan ke frontend; jangan commit file berisi kredensial.
3. **Gaya UI:** tetap dark navy flat tanpa gradient; judul `font-display`, CTA amber, border dari palet navy; ikuti pola komponen yang ada (kartu `rounded-2xl bg-navy-900 border border-navy-800 shadow-card`).
4. **Bahasa:** UI siswa Bahasa Indonesia kasual; kode & komentar kode Bahasa Indonesia (mengikuti gaya existing); soal Bahasa Inggris.
5. **Dependency:** jangan tambah library baru tanpa kebutuhan jelas — stack sudah dipilih (Heroicons, react-icons/bi, three, GSAP, Tailwind).
6. **State:** pertahankan mekanisme persistence localStorage (`encasa.app`, `encasa.test`) dan stateless token HMAC.
