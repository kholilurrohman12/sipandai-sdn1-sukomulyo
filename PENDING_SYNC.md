# Mekanisme Draft dan Sinkronisasi Jurnal

Versi ini menggunakan dua lapisan perlindungan:

1. **Firestore offline cache**: perubahan yang berhasil diterima oleh SDK Firestore dapat tetap tersedia ketika koneksi terputus dan SDK akan mencoba sinkronisasi kembali.
2. **Antrean lokal jurnal**: jika operasi penyimpanan benar-benar ditolak/gagal (misalnya quota/write limit, permission, atau error lain), jurnal disimpan di localStorage dan dicoba kembali ketika koneksi tersedia.

## Batasan penting

Jika Firebase benar-benar menolak operasi tulis karena quota/write limit, data yang hanya berada di antrean lokal **tidak dapat terlihat di perangkat lain** sampai data tersebut berhasil ditulis ke Firebase (atau ke server penyimpanan online lain). Ini merupakan batasan teknis: perangkat B tidak dapat membaca localStorage perangkat A.

Karena itu status "menunggu sinkronisasi" untuk data yang belum pernah berhasil ditulis ke server hanya dapat dijamin di perangkat yang membuat draft tersebut.

Setelah Firebase menerima data, perangkat lain dapat melihat data tersebut melalui snapshot Firestore.
