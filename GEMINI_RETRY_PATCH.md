# Gemini Retry Patch

Patch ini memperbaiki penanganan error sementara Gemini tanpa mengubah Firebase atau API key.

Perubahan utama:
- Retry hanya untuk 408, 429, 500, 502, 503, dan 504.
- Exponential-style backoff sederhana dengan jitter.
- Timeout client dan server dibatasi agar UI tidak menunggu tanpa batas.
- `Retry-After` dari Gemini diteruskan bila tersedia.
- Error final tetap diteruskan ke UI dengan status HTTP yang sesuai.
- Model default tetap `gemini-3.8-flash`; tidak perlu mengubah `.env`.

Catatan:
503/504 tetap bisa terjadi jika layanan Gemini sedang penuh atau permintaan terlalu berat. Patch ini membuat aplikasi merespons lebih baik dan mencoba ulang secara terkontrol; patch tidak dapat menghilangkan kapasitas penuh di sisi Google.
