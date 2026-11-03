# PDF Layout Fix V3.1.5

Perbaikan ekspor PDF agar lebih sesuai dengan preview:
- Root ekspor diperlakukan sebagai satu area A4 dengan `box-sizing: border-box`.
- Padding/layout preview dipertahankan, bukan dihapus.
- Child root tidak lagi dipaksa menjadi halaman A4 terpisah.
- Page break hanya diterapkan pada elemen yang memang ditandai `.pdf-page-break-before`/`.pdf-page-break-after`.
- Tabel, heading, gambar, dan blok bertanda `break-inside-avoid` lebih aman dari pemotongan.

Perbaikan ini tidak mengubah Firebase atau konfigurasi Gemini.
