/**
 * FASE 3 — Redirect WhatsApp otomatis (wa.me) dengan pesan pre-filled.
 */

/** Susun pesan otomatis sesuai format yang diminta. */
export function buildResultMessage({ nama, kelas, correct, total }) {
  return [
    'Halo Admin, saya telah menyelesaikan tes diagnostik.',
    '',
    `*Nama:* ${nama}`,
    `*Kelas:* ${kelas}`,
    `*Skor:* ${correct}/${total}`,
    '',
    'Mohon izin bergabung ke grup WhatsApp.',
  ].join('\n')
}

/** Bangun link wa.me dengan pesan ter-encode. */
export function buildWhatsAppLink(phoneNumber, message) {
  const clean = String(phoneNumber).replace(/[^0-9]/g, '')
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}
