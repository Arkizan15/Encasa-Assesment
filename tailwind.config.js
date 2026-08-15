/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Humanis + ramah (dari Jakarta!) untuk body/UI
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Serif display ekspresif (gaya editorial) untuk judul & angka besar
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      colors: {
        // Palet dark blue navy — dasar semua permukaan UI
        navy: {
          100: '#d6dff1',
          200: '#aec0e3',
          300: '#86a1d4',
          400: '#5f82c4',
          500: '#41639f',
          600: '#334d80',
          700: '#26395f',
          800: '#1a2742',
          850: '#141e34',
          900: '#0e1626',
          950: '#0a0f1d',
        },
        // Kertas krem hangat — teks display di atas navy (gaya editorial)
        cream: {
          50: '#fbf7ec',
          100: '#f4ecd8',
          200: '#eaddbf',
        },
        // Aksen brand — biru #1E70DE untuk teks yang di-highlight/diwarnai
        accent: {
          DEFAULT: '#1E70DE',
          100: '#dbe9fc',
          200: '#a9c9f8',
          300: '#6e9ef0',
          500: '#1962c6',
        },
      },
      boxShadow: {
        card: '0 8px 30px rgba(0, 0, 0, 0.45)',
        soft: '0 2px 12px rgba(0, 0, 0, 0.35)',
      },
    },
  },
  plugins: [],
}
