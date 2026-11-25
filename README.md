# Reload Staff Hub — Frontend

Frontend statis, di-host lewat GitHub Pages. Data dan login ada di backend Apps Script (lihat `Code.gs` di project Apps Script LMS Sheet).

## Setup

1. Di Apps Script: Deploy > Manage deployments > copy **Web app URL** (akhirannya `/exec`).
2. Isi `config.js` dengan URL itu.
3. Commit dan push. GitHub Pages akan menampilkan situs di `https://reloadsanctuary2026.github.io/staffhub/`.

## Struktur

- `index.html`: kerangka halaman dan form login
- `style.css`: tampilan
- `app.js`: logika front end, panggil backend lewat `fetch`
- `config.js`: URL backend (satu-satunya konfigurasi)

## Update: cara kirim perubahan

Frontend ada di **root** repo ini (`index.html`, `app.js`, `tracker.js`, `style.css`, `config.js`, folder `vendor/` dan `allergen/`). Tidak ada folder `web/`.

Backend (`Code.gs`, `Setup.gs`) **tidak** ada di repo ini. Itu ada di project Apps Script. Setiap ada perubahan di sana:
1. Paste isi file ke Apps Script (`Code.gs` dan `Setup.gs`).
2. Deploy > Manage deployments > edit deployment > **New version** > Deploy.
3. Web app URL tidak berubah, jadi `config.js` tidak perlu diganti.

Setiap update frontend:
1. Naikkan `APP_VERSION` di `app.js`.
2. Naikkan `?v=` di `index.html` untuk `style.css`, `app.js`, dan `tracker.js`. Pakai angka yang sama.
3. Catat perubahan di bagian paling atas `CHANGELOG.md`.
4. Cek di browser lokal sebelum push, misalnya `python3 -m http.server` lalu buka `http://localhost:8000`.
5. Commit dan push ke `main`. GitHub Pages memperbarui situs.

Supaya file tidak perlu dikirim lewat chat, cukup ambil dari git: `git pull`. Jangan download `.js` dari chat, karena file itu bisa rusak atau tidak bisa diunduh.
