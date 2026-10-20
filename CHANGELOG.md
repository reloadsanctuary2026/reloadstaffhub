# Changelog — Reload Staff Hub (frontend)

Setiap update frontend menaikkan versi di `app.js` (`APP_VERSION`), `style.css?v=` dan `app.js?v=` di `index.html`, dan ditulis di sini.

Versi backend (`Code.gs`) dicatat terpisah di bawah.

## 2.12.0
- Tab sheet baru `11_UpsellToday` (kolom: Date, Title, Description, Status). Upsell Today tidak lagi dicampur dengan Important Info.
- Home dua kolom: Upsell Today di kiri, Important Info di kanan. Di HP keduanya tersusun vertikal.
- Backend 2.8.0: sheet `11_UpsellToday` ikut dibaca dan bisa ditambah, diedit, dan dihapus dengan aturan yang sama.

## 2.11.0
- Loading: skeleton saat data dimuat, spinner saat cek sesi, dan tombol "Coba lagi" kalau gagal.
- Item nonaktif (hanya untuk editor) dilipat dalam bagian "Nonaktif (N)" yang tertutup, di Home (bulletin) dan Guests.
- Satu definisi "aktif" (`isActive`) untuk semua pengecekan status.

## 2.10.0
- Foto (anggota tim, menu, bulletin, tamu) dan file SOP (PDF) diunggah dari perangkat. Tidak perlu lagi menempel link Google Drive.
- Foto dikecilkan di browser sebelum diunggah. Ukuran file maksimal 5 MB.
- Backend 2.7.0: fungsi `uploadFile` (hanya untuk tier selain Staff), menyimpan file ke folder "Reload Staff Hub — Upload" di Drive dan membagikannya "siapa pun yang punya link: lihat".

## 2.9.0
- Form tambah dan edit tidak lagi pakai ketik bebas untuk isian yang bisa dipilih:
  - Tanggal: date picker, formatnya otomatis seperti sheet (`5 Oct 2026`).
  - Kategori, Departemen, Jabatan, Tipe, Penulis, Waktu baca, dan Bagian: dropdown dari nilai yang sudah ada di sheet, plus "+ Baru…".
  - Alergen: checkbox.
  - Harga: angka saja, otomatis pakai titik ribuan.
  - Nomor WhatsApp: angka saja, default `62`.
  - Foto dan file SOP: tempel link Google Drive, ID-nya diambil otomatis.
  - Link materi dan video: harus diawali `https://`.
  - Terakhir diupdate: diisi tanggal hari ini, tidak bisa diketik.
- Nilai yang tidak dikenali (misalnya tanggal format lama) tidak diubah diam-diam.

## 2.8.0
- Dua mode akses, label di header: **Mode baca** (staff) dan **Mode edit** (non-staff).
- Hak edit ditentukan backend saja (`canEdit` dari login dan checkSession). Frontend tidak lagi mengecek tier sendiri.
- Editor melihat item nonaktif di Home (bulletin) dan Guests, diberi label "Nonaktif" dan tampil pudar. Staff hanya melihat item aktif.
- Backend 2.6.0: kolom sheet dibaca lewat nama header. Urutan kolom di sheet boleh berubah.

## 2.7.1
- Kontras teks dinaikkan: teks sekunder dan deskripsi sekarang Bone (80%), tidak lagi abu-abu gelap.

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
