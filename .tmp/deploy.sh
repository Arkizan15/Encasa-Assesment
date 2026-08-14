#!/usr/bin/env bash
# Deploy Encasa Grouping ke Vercel (produksi, permanen) + set env var service account.
# Private key dikirim dalam bentuk ESCAPE satu baris (literal \n) — bentuk yang
# diharapkan kode api/submit-score.js. Nilai diambil dari file lokal, TIDAK dicetak.
set -e
cd "$(dirname "$0")/.."

echo "==> 1/5 Link proyek Vercel..."
npx --yes vercel link --yes

SPREADSHEET_ID=$(node -e "const c=require('./config.json'); process.stdout.write(c.spreadsheetId||'')")
SA_EMAIL=$(node -e "const s=require('./service-account.json'); process.stdout.write(s.client_email||'')")

# Private key → satu baris dengan literal \n (fromCharCode biar bebas masalah escaping shell)
node -e "
const fs = require('fs');
const s = JSON.parse(fs.readFileSync('service-account.json', 'utf8'));
const BS = String.fromCharCode(92);
fs.writeFileSync('.tmp/sa-key.txt', s.private_key.replace(/\n/g, BS + 'n'));
"
SA_KEY=$(cat .tmp/sa-key.txt)
rm -f .tmp/sa-key.txt

echo "==> 2/5 Set env vars (production)..."
npx --yes vercel env add GOOGLE_SHEET_ID production --value "$SPREADSHEET_ID" --force
npx --yes vercel env add GOOGLE_SERVICE_ACCOUNT_EMAIL production --value "$SA_EMAIL" --force
npx --yes vercel env add GOOGLE_PRIVATE_KEY production --value "$SA_KEY" --force

echo "==> 3/5 Build lokal (sanity check)..."
npm run build

echo "==> 4/5 Deploy ke production..."
npx --yes vercel deploy --prod --yes

echo "==> 5/5 Selesai. URL produksi ada di output di atas (biasanya https://encasa-grouping.vercel.app)."
