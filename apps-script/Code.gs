/**
 * Encasa Grouping — Penerima hasil tes diagnostik (Google Apps Script).
 *
 * CARA PASANG (sekali saja, tanpa Google Cloud Console):
 * 1. Buka spreadsheet tujuan → menu Extensions (Ekstensi) → Apps Script
 * 2. Hapus semua isi editor, lalu TEMPEL seluruh kode ini
 * 3. Klik Deploy → New deployment → pilih type: "Web app"
 * 4. Execute as: "Me" · Who has access: "Anyone"
 * 5. Klik Deploy → salin URL (https://script.google.com/macros/s/.../exec)
 * 6. Tempel URL itu ke config.json → "appsScriptUrl"
 *    (atau env VITE_APPS_SCRIPT_URL untuk build frontend)
 *
 * Setiap kali siswa selesai tes, baris baru otomatis ditambahkan ke Sheet.
 * Header otomatis dibuat jika sheet masih kosong.
 */

// Header kolom (baris pertama)
const HEADERS = [
  'Waktu',
  'Nama',
  'Kelas',
  'Skor',
  'Total Soal',
  'Persentase',
  'Durasi Pengerjaan',
  'Pelanggaran Tab',
  'Status Tes',
]

/**
 * Diterima dari /api/submit-score.
 *
 * OPSIONAL: untuk mencegah panggilan langsung ke URL web app ini tanpa lewat
 * server, set Script Property "APP_SECRET" (Project Settings → Script Properties)
 * lalu set env APPS_SCRIPT_SECRET di server dengan nilai yang SAMA. Jika salah
 * satu tidak di-set, mekanisme ini dinonaktifkan (backward compatible).
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents)

    const expectedSecret = PropertiesService.getScriptProperties().getProperty('APP_SECRET')
    if (expectedSecret && data._secret !== expectedSecret) {
      return jsonResponse({ ok: false, error: 'Unauthorized' })
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet()
    const sheet = ss.getSheets()[0] // sheet pertama

    // Buat header jika sheet masih kosong
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS)
    }

    const row = [
      new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
      data.nama,
      data.kelas,
      data.skor,
      data.total,
      data.persentase !== undefined ? `${data.persentase}%` : '',
      data.durasi,
      data.pelanggaranTab ?? 0,
      data.status ?? 'manual',
    ]
    sheet.appendRow(row)

    return jsonResponse({ ok: true, message: 'Hasil tes tersimpan ke Google Sheets.' })
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) })
  }
}

/** Untuk tes cepat: buka URL web app di browser → harus muncul {"ok":true}. */
function doGet() {
  return jsonResponse({ ok: true, message: 'Apps Script Encasa Grouping aktif.' })
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  )
}
