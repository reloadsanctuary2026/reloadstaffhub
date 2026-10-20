# Changelog — Reload Staff Hub (frontend)

Setiap update frontend menaikkan versi di `app.js` (`APP_VERSION`), `style.css?v=` dan `app.js?v=` di `index.html`, dan ditulis di sini.

Versi backend (`Code.gs`) dicatat terpisah di bawah.

## 2.18.0
- Sapaan di Home memakai Nickname dari HR. Kalau kosong, pakai nama depan.
- Our Guests di Home: 5 tamu terakhir, urut dari yang terbaru.
- Foto tamu bisa diklik untuk melihat detail: foto besar, nama, kategori, dan catatan lengkap.
- Catatan panjang dipotong, dengan tombol "Baca selengkapnya".
- Perbaikan: di 2.17.0, bagian Our Guests bisa error saat ada data tamu. Sudah diperbaiki.
- Backend 2.13.0: membaca kolom Nickname dari HR (opsional).

## 2.17.0
- Login lebih cepat: daftar karyawan dari HR dicache 10 menit. PIN disimpan sebagai hash.
- Rapi-rapi kode: cek sesi habis di satu tempat, pola daftar per kelompok di satu helper, bagian hari di satu fungsi, dan cara ambil sheet di satu tempat.

## 2.16.0
- Foto dan jabatan karyawan diambil dari HR Sheet (kolom Photo dan Job Title/Position). Kalau foto diganti di HR, berubah di app dalam 10 menit.
- Header: judul lebih besar, profil di kanan berisi foto, nama, dan jabatan. Tier tidak ditampilkan lagi.
- Sapaan di Home dikecilkan.
- Important Info dihapus dari app.
- Home: Our Guests, Upsell Today, dan Staff Bulletin dalam satu baris (tiga kolom di desktop, tersusun di HP).
- Tab: Home dengan ikon rumah. Label: Food Bible, Beverage Bible, SOP, Our Teams, Reload Academy, About Reload. Tab Guests dipindah ke Home sebagai Our Guests.
- Backend 2.11.0: membaca kolom Photo dan Job Title/Position dari HR (opsional), tabel `01_ImportantInfo` tidak dibaca lagi.

## 2.15.0
- Upsell tidak lagi pakai kolom Status. Yang tampil di Home hanya baris dengan tanggal hari ini.
- Kalau tidak ada baris untuk hari ini, Upsell menampilkan "Tidak ada upsell untuk hari ini."
- Backend 2.10.0: kolom Status dihapus dari skema tab `11_UpsellToday`. Kolom Status yang masih ada di sheet tidak dibaca dan boleh dihapus.

## 2.14.0
- Home: Upsell Today, Important Info, dan Staff Bulletin dalam satu baris. Tiga kolom di desktop, dua kolom di tablet, satu kolom (urut: Upsell, Info, Bulletin) di HP.
- Tombol Edit dan Tambah lebih besar di HP, supaya mudah disentuh.

## 2.13.0
- Upsell Today sekarang per item: satu baris per item dengan kolom Tipe, Sesi, Shift, Item, Target, Satuan, Status.
- Tampilan Upsell dikelompokkan per sesi (Morning, Afternoon, Evening), lalu kalimat upsell, lalu aturan.
- Field Target hanya menerima angka.
- Backend 2.9.0: skema tab `11_UpsellToday` berubah (lihat kolom di atas).

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
