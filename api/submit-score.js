/**
 * /api/submit-score — Vercel Serverless Function.
 *
 * Menerima JAWABAN siswa (bukan skor), menghitung skor server-side memakai
 * kunci jawaban yang hanya ada di server, menyimpan hasil ke Google Sheets,
 * lalu mengembalikan skor + detail review untuk halaman hasil.
 *
 * 🔒 Pengamanan:
 *   - Token sesi wajib (dari /api/test-session) — mencegah kirim skor palsu
 *     langsung ke API tanpa mengikuti tes.
 *   - Validasi input: nama, kelas (whitelist), jawaban (id 1–30, tipe benar).
 *   - Rate limit sederhana per IP.
 *
 * Body: { nama, kelas, answers: {id: jawaban}, timeUsed, tabSwitchCount, status, token }
 * Respon: { ok, skor, total, persentase, detail: [{id, userAnswer, isCorrect, correct}], save }
 *
 * Deploy: Vercel → project root memiliki folder /api.
 * Lokal  : node server.mjs (setelah npm run build).
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { scoreTest } from '../lib/scoring.js'
import { verifyToken } from '../lib/session.js'
import { isValidKelas, isValidNama, validateAnswers } from '../lib/validation.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

// ── Baca config.json (spreadsheetId + appsScriptUrl) ──────────────────
let SPREADSHEET_ID = ''

function readConfig() {
  try {
    const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf-8'))
    SPREADSHEET_ID = config.spreadsheetId || process.env.GOOGLE_SHEET_ID || ''
    return config
  } catch {
    SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || ''
    return {}
  }
}
readConfig()

// ── Rate limit sederhana (per IP, in-memory — cukup untuk skala sekolah) ──
// Hanya batas per jam (tanpa jeda antar-submit) agar satu kelas di belakang
// IP NAT yang sama bisa mengumpulkan bersamaan tanpa salah diblokir.
const RATE_LIMIT = {
  maxPerHour: 200, // jauh di atas kebutuhan satu kelas, cukup menghambat spam
}
const rateMap = new Map() // ip → { count, windowStart }

function rateLimited(ip) {
  const now = Date.now()
  if (rateMap.size > 10000) rateMap.clear() // cegah memori membengkak
  const entry = rateMap.get(ip)
  if (!entry) {
    rateMap.set(ip, { count: 1, windowStart: now })
    return false
  }
  if (now - entry.windowStart > 60 * 60 * 1000) {
    rateMap.set(ip, { count: 1, windowStart: now })
    return false
  }
  entry.count += 1
  return entry.count > RATE_LIMIT.maxPerHour
}

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

// ── Simpan ke Google Sheets (skor sudah dihitung server-side) ──────────
async function saveToSheet({ nama, kelas, skor, total, persentase, durasi, pelanggaranTab, status }) {
  const config = readConfig()
  const appsScriptUrl = config.appsScriptUrl || process.env.GOOGLE_APPS_SCRIPT_URL

  // Jalur 1: Apps Script Web App (paling mudah)
  if (appsScriptUrl) {
    const payload = { nama, kelas, skor, total, persentase, durasi, pelanggaranTab, status }
    // Opsional: jika admin set APPS_SCRIPT_SECRET, ikut dikirim agar Code.gs
    // bisa menolak panggilan langsung ke URL web app tanpa melalui server.
    const appsScriptSecret = config.appsScriptSecret || process.env.APPS_SCRIPT_SECRET
    if (appsScriptSecret) payload._secret = appsScriptSecret
    const forward = await fetchWithTimeout(
      appsScriptUrl,
      {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
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
      return { ok: true, reason: 'saved', message: 'Hasil tes tersimpan ke Google Sheets (Apps Script).' }
    }
    return { ok: false, reason: 'error', message: data.error || `Apps Script merespon ${forward.status}.` }
  }

  // Jalur 2: Service Account
  const sa = loadServiceAccount()
  if (!sa) {
    return {
      ok: false,
      reason: 'not_configured',
      message: 'Belum terhubung ke Google Sheets. Isi config.json → "appsScriptUrl" atau siapkan service account.',
    }
  }

  const token = await getAccessToken(sa)
  const sheetName = config.sheetName || (await getFirstSheetName(token))
  await ensureHeader(token, sheetName)
  await appendRows(token, sheetName, [
    [
      new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
      nama,
      kelas,
      skor,
      total,
      `${persentase}%`,
      durasi,
      pelanggaranTab ?? 0,
      status ?? 'manual',
    ],
  ])
  return { ok: true, reason: 'saved', message: 'Hasil tes tersimpan ke Google Sheets.' }
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

  const { nama, kelas, answers, token, timeUsed, tabSwitchCount, status } = body

  // 1) Token sesi wajib & valid
  const session = verifyToken(token, kelas)
  if (!session.ok) {
    res.status(403).json({ ok: false, ...session })
    return
  }

  // 2) Validasi input
  if (!isValidNama(nama)) {
    res.status(400).json({ ok: false, reason: 'invalid_nama' })
    return
  }
  if (!isValidKelas(kelas)) {
    res.status(400).json({ ok: false, reason: 'invalid_kelas' })
    return
  }
  const answersCheck = validateAnswers(answers)
  if (!answersCheck.ok) {
    res.status(400).json({ ok: false, reason: 'invalid_answers' })
    return
  }

  // 3) Rate limit per IP
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'local'
  if (rateLimited(ip)) {
    res.status(429).json({ ok: false, reason: 'rate_limited', message: 'Terlalu banyak pengumpulan. Coba lagi beberapa saat.' })
    return
  }

  // 4) Hitung skor server-side (berbasis poin, maks 300)
  const { skor, total, persentase, correctCount, detail } = scoreTest(answersCheck.answers)

  // 5) Simpan ke Google Sheets — kegagalan simpan TIDAK menggagalkan skor
  let save = { ok: false, reason: 'error', message: 'Gagal menyimpan hasil.' }
  try {
    save = await saveToSheet({
      nama: nama.trim(),
      kelas: kelas.trim(),
      skor,
      total,
      persentase,
      durasi: typeof timeUsed === 'number' ? Math.max(0, timeUsed) : 0,
      pelanggaranTab: Number.isFinite(tabSwitchCount) ? tabSwitchCount : 0,
      status: typeof status === 'string' && status.length <= 50 ? status : 'manual',
    })
  } catch (err) {
    save = { ok: false, reason: 'error', message: err.message }
  }

  res.status(200).json({ ok: true, skor, total, persentase, correctCount, detail, save })
}
