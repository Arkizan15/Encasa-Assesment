/**
 * /api/submit-score — Vercel Serverless Function (FASE 4).
 *
 * Menyimpan hasil tes pendaftar ke Google Sheets secara otomatis.
 *
 * 🔐 Kredensial (prioritas):
 *   1. Env vars: GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY
 *   2. File service-account.json di root project (TIDAK di-commit)
 *
 * ⚠️ Catatan: Google API key (config.json) hanya bisa MEMBACA data publik —
 *    menulis baris butuh service account / OAuth. Mekanisme tulis di sini
 *    memakai service account (JWT RS256, tanpa dependency eksternal).
 *
 * Deploy: Vercel → project root memiliki folder /api.
 * Lokal  : node server.mjs (setelah npm run build).
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

// ── Baca config.json (API key + spreadsheetId + appsScriptUrl) ────────
// Dibaca ulang setiap request agar perubahan config.json langsung berlaku
// tanpa restart server.
let config = {}
let SPREADSHEET_ID = ''

function readConfig() {
  try {
    config = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf-8'))
  } catch {
    config = {}
  }
  SPREADSHEET_ID = config.spreadsheetId || process.env.GOOGLE_SHEET_ID || ''
  return config
}
readConfig()

// ── Ambil kredensial service account ───────────────────────────────────
function loadServiceAccount() {
  const envEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const envKey = process.env.GOOGLE_PRIVATE_KEY

  if (envEmail && envKey) {
    return {
      client_email: envEmail,
      private_key: envKey.replace(/\\n/g, '\n'),
    }
  }

  try {
    const file = path.join(ROOT, 'service-account.json')
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf-8'))
    }
  } catch {
    /* file rusak → lanjut */
  }

  return null
}

// ── JWT RS256 (service account → access token) ─────────────────────────
function signJwt(clientEmail, privateKey, scope) {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const claim = {
    iss: clientEmail,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url')
  const input = `${b64(header)}.${b64(claim)}`
  const signature = crypto
    .createSign('RSA-SHA256')
    .update(input)
    .sign(privateKey)
    .toString('base64url')
  return `${input}.${signature}`
}

// Fetch dengan timeout agar serverless tidak menggantung
async function fetchWithTimeout(url, options = {}, ms = 10000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(id)
  }
}

const quoteSheet = (sheetName) => `'${sheetName.replace(/'/g, "''")}'`

async function getAccessToken(sa) {
  const jwt = signJwt(sa.client_email, sa.private_key, 'https://www.googleapis.com/auth/spreadsheets')
  const res = await fetchWithTimeout('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Token exchange gagal (${res.status}): ${text.slice(0, 300)}`)
  }
  const data = await res.json()
  return data.access_token
}

async function getFirstSheetName(token) {
  const res = await fetchWithTimeout(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?fields=sheets.properties.title`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  if (!res.ok) throw new Error(`Spreadsheet tidak ditemukan (${res.status}) — pastikan sheet dibagikan ke email service account.`)
  const data = await res.json()
  const sheet = data.sheets?.[0]?.properties?.title || 'Sheet1'
  return sheet
}

async function ensureHeader(token, sheetName) {
  const range = `${quoteSheet(sheetName)}!1:H1`
  const res = await fetchWithTimeout(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  const data = await res.json().catch(() => ({}))
  const header = data.values?.[0]
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
  const isEmpty = !header || header.every((c) => String(c).trim() === '')
  if (!isEmpty) return
  await appendRows(token, sheetName, [HEADERS])
}

async function appendRows(token, sheetName, rows) {
  const range = `${quoteSheet(sheetName)}!A1`
  // valueInputOption & insertDataOption adalah query parameter, bukan body.
  // RAW → nilai disimpan sebagai teks apa adanya ("83%", "00:03:00" tampil persis).
  // USER_ENTERED justru meng-parse "83%" jadi 0.83 & "00:03:00" jadi pecahan hari.
  const params = new URLSearchParams({
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
  })
  const res = await fetchWithTimeout(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}:append?${params}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: rows }),
    },
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Append gagal (${res.status}): ${text.slice(0, 300)}`)
  }
  return res.json()
}

// ── Handler Vercel ─────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, reason: 'method_not_allowed' })
    return
  }

  let body = {}
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    res.status(400).json({ ok: false, reason: 'invalid_json' })
    return
  }

  readConfig() // refresh config.json per request

  const { nama, kelas, skor, total, persentase, durasi, pelanggaranTab, status } = body
  if (!nama || !kelas) {
    res.status(400).json({ ok: false, reason: 'missing_fields' })
    return
  }

  if (!SPREADSHEET_ID) {
    res.status(200).json({ ok: false, reason: 'not_configured', message: 'config.json belum berisi spreadsheetId.' })
    return
  }

  // ── Jalur 1: Google Apps Script Web App (paling mudah, tanpa Cloud Console) ──
  const appsScriptUrl = config.appsScriptUrl || process.env.GOOGLE_APPS_SCRIPT_URL
  if (appsScriptUrl) {
    try {
      const forward = await fetchWithTimeout(
        appsScriptUrl,
        {
          method: 'POST',
          // text/plain agar tidak memicu CORS preflight dari browser
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            nama,
            kelas,
            skor,
            total,
            persentase,
            durasi,
            pelanggaranTab,
            status,
          }),
        },
        20000,
      )
      const text = await forward.text()
      let data = {}
      try {
        data = JSON.parse(text)
      } catch {
        /* respon bukan JSON */
      }
      if (forward.ok && data.ok) {
        res.status(200).json({ ok: true, reason: 'saved', message: 'Hasil tes tersimpan ke Google Sheets (Apps Script).' })
      } else {
        res.status(200).json({ ok: false, reason: 'error', message: data.error || `Apps Script merespon ${forward.status}. Pastikan Web App sudah di-deploy & aksesnya "Anyone".` })
      }
    } catch (err) {
      res.status(200).json({ ok: false, reason: 'error', message: `Gagal menghubungi Apps Script: ${err.message}` })
    }
    return
  }

  // ── Jalur 2: Service Account (standar, butuh Google Cloud Console) ──
  const sa = loadServiceAccount()
  if (!sa) {
    res
      .status(200)
      .json({
        ok: false,
        reason: 'not_configured',
        message:
          'Belum terhubung. Isi config.json → "appsScriptUrl" (paling mudah, lihat apps-script/Code.gs) atau siapkan service-account.json / env service account. (Google API key tidak bisa menulis ke Sheets.)',
      })
    return
  }

  try {
    const token = await getAccessToken(sa)
    const sheetName = config.sheetName || (await getFirstSheetName(token))
    await ensureHeader(token, sheetName)

    const row = [
      new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
      nama,
      kelas,
      skor,
      total,
      `${persentase}%`,
      durasi,
      pelanggaranTab ?? 0,
      status ?? 'manual',
    ]
    await appendRows(token, sheetName, [row])

    res.status(200).json({ ok: true, reason: 'saved', message: 'Hasil tes tersimpan ke Google Sheets.' })
  } catch (err) {
    res.status(200).json({ ok: false, reason: 'error', message: err.message })
  }
}
