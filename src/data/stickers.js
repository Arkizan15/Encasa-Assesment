/**
 * Daftar file stiker di /public/sticker — dipakai untuk overlay transisi
 * antar soal (QuestionTransitionModal). Dipilih acak tiap kali soal berganti.
 *
 * ⚠️ Saat menambah / menghapus file stiker, update daftar ini juga.
 * Nama file di-encode otomatis saat membangun URL (encodeURIComponent),
 * jadi karakter khusus (spasi, #, emoji) aman.
 */
export const STICKERS = [
  '665724649_122123644125140640_7627334926020436780_n.jpg',
  '@notstm.jpe',
  'Aku Encasa.png',
  'Are you sure_.jpe',
  'Cat Thinking about Encasa.png',
  'ChatGPT Image Aug 15, 2026, 04_53_25 PM.png',
  'did the #sixfanarts challenge yay !! thank you to those who submitted characters_people _) __ignore billie joe’s lack of tattoos lmao _inspo cred to @c4mpsoup for slide two 🙂_↕️🙂_↕️__#greenday #thebeatles #parapp.jpe',
  'download (1).jpe',
  'download (4).jpe',
  'download (5).jpe',
  'download (6).jpe',
  'download (7).jpe',
  'download (8).jpe',
  'download (9).jpe',
  'fr.jpe',
  'izin.jpe',
  'KEBAL SPEAKING.png',
  'meme ༣.jpe',
  'My apolocheese.jpe',
  'sticker.jpe',
  'thank you ducky.jpe',
  'Untitled design (3).png',
  'Untitled design (4).png',
  'X.jpe',
  '_.jpe',
]

/** URL stiker acak dari direktori /public/sticker. */
export function randomStickerUrl() {
  const name = STICKERS[Math.floor(Math.random() * STICKERS.length)]
  return `/sticker/${encodeURIComponent(name)}`
}
