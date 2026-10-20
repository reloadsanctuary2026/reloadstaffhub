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
