# Optimasi Penggunaan Firebase

Perubahan utama:

1. Koleksi data tidak lagi mulai didengarkan sebelum pengguna berhasil login.
2. Jurnal, nilai, dan presensi guru untuk akun guru menggunakan query `where(userId == currentUser.id)` sehingga guru tidak perlu membaca seluruh koleksi.
3. Data siswa untuk `guru_kelas_X` menggunakan query berdasarkan `kelas`, sehingga guru kelas hanya membaca siswa kelasnya.
4. Admin tetap membaca koleksi lengkap untuk kebutuhan rekap/manajemen.
5. Penulisan tetap menggunakan diff + batch, sehingga dokumen yang tidak berubah tidak ditulis ulang.
6. Cache offline Firestore dan antrean jurnal lokal tetap dipertahankan.

Catatan:
- Optimasi query dapat menyebabkan Firebase meminta index hanya jika query berkembang menjadi gabungan beberapa `where`/`orderBy`; perubahan ini memakai satu `where`, sehingga umumnya tidak memerlukan composite index.
- Build penuh belum diverifikasi pada lingkungan ini karena `node_modules` belum tersedia.
