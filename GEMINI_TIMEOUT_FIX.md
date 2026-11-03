# Perbaikan Gemini 503/504

- Frontend `/api/gemini` sekarang memakai timeout 55 detik agar UI tidak menggantung.
- Retry hanya untuk 429, 503, dan 504, maksimal 2 kali dengan jeda singkat.
- Backend memberi timeout upstream 50 detik dan mengembalikan 504 yang jelas bila Gemini terlalu lama.
- Endpoint diberi `maxDuration = 60` untuk deployment Vercel yang mendukung konfigurasi tersebut.
- Generate soal mengatur `maxOutputTokens` secara proporsional terhadap jumlah soal agar output tidak berlebihan.
- Error 404 favicon dihilangkan dengan favicon inline.

Catatan: jika paket/plan hosting memiliki batas runtime serverless yang lebih rendah dari 60 detik, `maxDuration` tidak dapat melampaui batas paket. Dalam kondisi itu, untuk 25-50 soal sebaiknya gunakan jumlah soal lebih kecil per generate atau pecah proses menjadi beberapa batch.
