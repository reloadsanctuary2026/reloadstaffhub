# Changelog — Reload Staff Hub (frontend)

Setiap update frontend menaikkan versi di `app.js` (`APP_VERSION`), `style.css?v=` dan `app.js?v=` di `index.html`, dan ditulis di sini.

Versi backend (`Code.gs`) dicatat terpisah di bawah.

## 2.7.0
- Warna mengikuti palet brand Reload (Rich Black, Bone, French Beige, Burgundy, Wasabi, Zinnwaldite).
- Font Poppins, sama dengan Reload 360.
- Logo R dipasang di login, header, dan favicon.

## 2.6.0
- Desain ulang: header dengan profil user, menu tab pill, kartu grid untuk menu dan tim, hero sapaan di Home.
- Versi frontend tampil di footer.
- Font Inter dari Google Fonts.

## 2.5.0
- Tambah dan hapus baris (hard delete), semua lewat backend.
- Hapus baris dicatat lengkap di `99_Changelog` sebelum dihapus.

## 2.4.0
- Edit isi baris lewat form.
- Cek konflik: simpan ditolak kalau isi sheet sudah berubah sejak form dibuka.
- Setiap edit dicatat di `99_Changelog`.

## 2.3.0
- Frontend dipisah ke GitHub Pages. Backend jadi API JSON di Apps Script.

## Backend (Code.gs)
- 2.5.0: `addRow`, `deleteRow`, dan `updateRow` dengan lock dan changelog.
- 2.4.0: `updateRow` dengan cek konflik.
- 2.3.0: API JSON (`doPost`) dengan whitelist fungsi.
- 2.2.0: rebuild login NIK + PIN, sesi 6 jam, kunci 15 menit setelah 5 kali salah PIN.
