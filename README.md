# SIPANDAI SD Negeri 1 Sukomulyo

Versi V3 dengan perbaikan persistensi Firestore.

## Menjalankan di Windows PowerShell

```powershell
cd C:\Users\OPHIR\Downloads\sipandai-fixed\sipandai-fixed
npm.cmd install
npm.cmd run dev
```

Untuk memeriksa build produksi:

```powershell
npm.cmd run build
```

## Firebase

Buat file `.env` sendiri dari `.env.example` dan isi konfigurasi Firebase milik project Anda. Jangan memasukkan `.env` ke GitHub.

## Perbaikan V3

- Penyimpanan utama menunggu konfirmasi Firestore sebelum toast sukses.
- Kegagalan Firestore ditampilkan sebagai toast error.
- Operasi hapus juga menunggu hasil Firestore.
- Antrean penulisan dan pemecahan batch Firestore tetap digunakan.

Konfigurasi Firebase yang sudah terbukti bekerja tidak perlu diubah.


## Gemini AI (V3.1)
Gemini dipanggil melalui `/api/gemini` sebagai Vercel Server Function. API key tidak dikirim ke browser.

Environment Variable Vercel yang diperlukan:
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (opsional, default `gemini-3.8-flash`)

Jangan menaruh API key Gemini pada variabel `VITE_*`.


## Gemini V3.1.1
- Frontend memanggil `/api/gemini`, bukan Google Gemini langsung.
- Kunci API hanya dibaca server dari `GEMINI_API_KEY`.
- Jangan menaruh `GEMINI_API_KEY` di file `.env` yang diunggah ke GitHub.
- Di Vercel, set `GEMINI_API_KEY` untuk Production dan Preview, lalu redeploy.
- Model default: `gemini-3.8-flash`.
