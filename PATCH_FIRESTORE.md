# SIPANDAI Firestore Persistence V3

Perubahan utama:

1. Semua operasi simpan utama menunggu (`await`) hasil Firestore sebelum menampilkan toast berhasil.
2. Operasi hapus pada akun, siswa, barang, jurnal, dan nilai juga menunggu Firestore.
3. Jika penulisan gagal, pengguna mendapat toast error dan error dicatat di Console.
4. Jurnal, nilai, dan absensi yang sebelumnya sudah menggunakan `await` dipertahankan.
5. `useFirestoreSync` tetap menggunakan antrean penulisan dan diff dokumen agar perubahan cepat tidak saling menimpa.
6. Tidak mengubah `.env`, Firebase project, Authentication, atau Firestore Rules.

## Verifikasi

Di komputer pengembangan:

```powershell
npm.cmd install
npm.cmd run build
npm.cmd run dev
```

Lakukan uji minimal pada Data Siswa, Jurnal, Nilai, Absen Siswa, Absen Guru, Inventaris, Stok Opname, Surat Masuk, Surat Keluar, dan Konfigurasi. Setelah menyimpan, periksa Firestore.

Catatan: paket ZIP tidak menyertakan `.env` karena file tersebut berisi konfigurasi lokal Firebase.
