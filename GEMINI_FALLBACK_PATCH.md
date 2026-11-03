# Gemini Fallback Patch V3.1.4

Perubahan:
- Model utama tetap `gemini-3.8-flash`.
- Jika model utama mendapat 429/500/502/503/504, backend mencoba `gemini-3.6-flash` satu kali.
- Error 400/401/403/404 tidak dialihkan ke model lain.
- Retry/backoff client dari V3.1.3 tetap digunakan.
- Firebase dan API key tidak diubah.

Catatan:
Fallback adalah pengaman terhadap kapasitas sementara, bukan jaminan menghilangkan 503. Dokumentasi Google menyebut 503 sebagai kondisi layanan sementara overload dan merekomendasikan exponential backoff. Gemini 3.6 Flash tetap tersedia untuk production.
