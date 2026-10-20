/************************************************
 * RELOAD STAFF HUB — BACKEND (Apps Script)
 * Version : 2.13.0 (nickname dari HR untuk sapaan)
 * Developer : Rohendi Frinsen
 *
 * Deploy : Execute as: Me | Who has access: Anyone
 ************************************************/

const BACKEND_VERSION = "2.18.0";

const SPREADSHEET_ID = "10ikfT3OL4gAABx0AH7OPXq_e1jzCmm6j9-eV8SX_xPc"; // LMS
const HR_FILE_ID     = "1j4bmrIV9arvrpMCJuy5J-sVh-H9EkRL1";           // HR (.xlsx, tidak diubah)
const HR_TAB_NAME    = "EMPLOYEE DATABASE";
const SESSION_HOURS  = 6;   // batas maksimal CacheService (6 jam)
const MAX_ATTEMPTS   = 5;   // salah PIN berapa kali sebelum NIK dikunci
const LOCK_MINUTES   = 15;
const HR_INDEX_SECONDS = 600;   // daftar karyawan dari HR dicache 10 menit
const HR_INDEX_FILE = "hr_index.json";  // salinan daftar karyawan di Drive, supaya login tidak perlu konversi file HR
const HR_INDEX_MAX_CHARS = 95000; // batas nilai cache Apps Script (100 KB)
const ROWS_CACHE_SECONDS = 60;     // isi tiap sheet dicache 60 detik, dihapus saat ada perubahan
const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;   // batas ukuran file yang diunggah
const UPLOAD_TYPES   = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const CHANGELOG_TAB  = "99_Changelog";
const TIMEZONE       = "Asia/Jakarta";

const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

/* Hanya fungsi di sini yang boleh dipanggil dari frontend. */
const API = {
  login: login,
  logout: logout,
  checkSession: checkSession,
  getAppData: getAppData,
  updateRow: updateRow,
  addRow: addRow,
  deleteRow: deleteRow,
  uploadFile: uploadFile
};

/*
 * Kolom dibaca lewat nama header, bukan posisi. Tiap kunci punya daftar nama header
 * yang diterima (exact dulu, lalu awalan). Kalau header tidak ketemu, error yang jelas.
 */
const SHEETS = {
  bulletin: { suffix: "02_StaffBulletin", cols: {
    date:        ["Date"],
    type:        ["Type"],
    title:       ["Title"],
    description: ["Description"],
    image:       ["IMAGE FILE ID"],
    status:      ["Status"]
  } },
  food: { suffix: "03_FoodBible", cols: {
    category:    ["Category"],
    image:       ["IMAGE FILE ID"],
    name:        ["ItemName"],
    description: ["Description"],
    allergens:   ["Allergens"],
    price:       ["Price"]
  } },
  beverage: { suffix: "04_BeverageBible", cols: {
    category:    ["Category"],
    image:       ["IMAGE FILE ID"],
    name:        ["ItemName"],
    description: ["Description"],
    allergens:   ["Allergens"],
    price:       ["Price"]
  } },
  sop: { suffix: "05_SOP", cols: {
    category:    ["Category"],
    name:        ["SOP Name"],
    description: ["Description"],
    file:        ["GDRIVE FILE ID"],
    updated:     ["Last Updated"]
  } },
  teams: { suffix: "06_OurTeams", cols: {
    department:  ["Department"],
    position:    ["Position"],
    name:        ["Name"],
    image:       ["IMAGE FILE ID"],
    phone:       ["Phone"]
  } },
  about: { suffix: "07_AboutReload", cols: {
    section:     ["Section"],
    content:     ["Content"]
  } },
  guests: { suffix: "08_CommunityNews", cols: {
    date:        ["Date", "y"],
    category:    ["Category"],
    guest:       ["Guest Name"],
    title:       ["Title"],
    description: ["Description"],
    image:       ["IMAGE FILE ID"],
    status:      ["Status"]
  } },
  academy: { suffix: "09_ReloadAcademy", cols: {
    category:    ["Category"],
    title:       ["Title"],
    shortDesc:   ["Short Description"],
    content:     ["Learning Content"],
    fullLink:    ["FULL GDRIVE LINK"],
    video:       ["Video URL"],
    readingTime: ["Reading Time"],
    knowledge:   ["Knowledge of the Week"],
    updated:     ["Last Updated"],
    difficulty:  ["Difficulty"]
  } },
  upsell: { suffix: "11_UpsellToday", cols: {
    date:        ["Date"],
    sesi:        ["Session", "Sesi"],
    shift:       ["Shift"],
    item:        ["Item"],
    target:      ["Target"],
    satuan:      ["Unit", "Satuan"]
  } },
  inspiration: { suffix: "10_DailyInspiration", cols: {
    greeting:    ["Greeting"],
    quote:       ["Quote"],
    author:      ["Author"]
  } }
};

const CHANGELOG_COLS = {
  version: ["Version"],
  date:    ["Date"],
  module:  ["Module"],
  changes: ["Changes"],
  by:      ["By"]
};

/* Sheet yang boleh diubah lewat app. */
const EDITABLE_SHEETS = ["upsell", "bulletin", "food", "beverage", "sop", "teams", "about", "guests", "academy", "inspiration"];

/* ---------- AKSES (satu definisi, dipakai semua tempat) ---------- */

/** Satu-satunya definisi "boleh edit". Dipakai login, checkSession, dan setiap fungsi tulis. */
function canEditTier_(tier) {
  return !!tier && tier !== "Staff";
}

/* ---------- ENTRY POINT ---------- */

function doGet() {
  return json_({ ok: true, service: "Reload Staff Hub API", version: BACKEND_VERSION });
}

/**
 * Frontend kirim: { fn: "namaFungsi", args: [...] } sebagai text/plain.
 * Balasan: { ok: true, data } atau { ok: false, error }.
 */
function doPost(e) {
  let req;
  try {
    req = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: "Invalid request." });
  }

  const fn = API[req.fn];
  if (!fn) return json_({ ok: false, error: "Unknown function." });

  try {
    return json_({ ok: true, data: fn.apply(null, req.args || []) });
  } catch (err) {
    return json_({ ok: false, error: err.message });
  }
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---------- LOGIN ---------- */

/**
 * Cek NIK + PIN ke HR Sheet.
 * Balasan: { ok, token, name, tier, canEdit } atau { ok:false, message }.
 */
function login(nik, pin) {
  nik = clean_(nik);
  pin = clean_(pin);
  if (!nik || !pin) return { ok: false, message: "NIK and PIN are required." };

  const cache = CacheService.getScriptCache();
  const failKey = "fail_" + nik;
  const fails = Number(cache.get(failKey) || 0);
  if (fails >= MAX_ATTEMPTS) {
    return { ok: false, message: "Too many attempts. Wait " + LOCK_MINUTES + " minutes and try again." };
  }

  const row = findEmployee_(nik);
  if (!row || row.pinHash !== hashPin_(pin)) {
    cache.put(failKey, String(fails + 1), LOCK_MINUTES * 60);
    return { ok: false, message: "Wrong NIK or PIN." };
  }

  cache.remove(failKey);
  const token = Utilities.getUuid();
  cache.put(
    "sess_" + token,
    JSON.stringify({ nik: nik, name: row.name, tier: row.tier }),
    SESSION_HOURS * 60 * 60
  );
  return { ok: true, token: token, name: row.name, tier: row.tier, jobTitle: row.jobTitle, photo: row.photo, nickname: row.nickname, canEdit: canEditTier_(row.tier) };
}

function logout(token) {
  CacheService.getScriptCache().remove("sess_" + token);
  return { ok: true };
}

/** Dipanggil saat halaman dibuka. Balikin info user kalau sesi masih valid. */
function checkSession(token) {
  const sess = getSession_(token);
  if (!sess) return { ok: false };
  const emp = findEmployee_(sess.nik);
  if (!emp) return { ok: false };
  return { ok: true, name: emp.name, tier: emp.tier, jobTitle: emp.jobTitle, photo: emp.photo, nickname: emp.nickname, canEdit: canEditTier_(emp.tier) };
}

/**
 * Cari satu karyawan di daftar HR (kolom Employee Number). Balikin null kalau tidak ada.
 */
function findEmployee_(nik) {
  return getHrIndex_().find(e => e.nik === nik) || null;
}

/**
 * Daftar karyawan dari HR dalam bentuk ringkas, dicache 10 menit.
 * Membaca file HR itu lambat (dikonversi dulu), jadi hasilnya disimpan.
 * PIN tidak disimpan dalam bentuk asli, hanya hash-nya.
 */
function getHrIndex_() {
  const raw = CacheService.getScriptCache().get("hr_index");
  if (raw) return JSON.parse(raw);

  const fromFile = readHrIndexFile_();
  if (fromFile) {
    cacheHrIndex_(fromFile);
    return fromFile;
  }
  return rebuildHrIndex_();
}

/** Baca ulang file HR (lambat), lalu simpan ke cache dan ke file di Drive. */
function rebuildHrIndex_() {
  const index = buildHrIndex_();
  saveHrIndexFile_(index);
  cacheHrIndex_(index);
  return index;
}

function cacheHrIndex_(index) {
  const json = JSON.stringify(index);
  if (json.length <= HR_INDEX_MAX_CHARS) CacheService.getScriptCache().put("hr_index", json, HR_INDEX_SECONDS);
}

function readHrIndexFile_() {
  const files = getUploadFolder_().getFilesByName(HR_INDEX_FILE);
  return files.hasNext() ? JSON.parse(files.next().getBlob().getDataAsString()) : null;
}

function saveHrIndexFile_(index) {
  const folder = getUploadFolder_();
  const json = JSON.stringify(index);
  const files = folder.getFilesByName(HR_INDEX_FILE);
  if (files.hasNext()) files.next().setContent(json);
  else folder.createFile(HR_INDEX_FILE, json, "application/json");
}

/** Bangun daftar karyawan dari file HR (lambat, hanya dipanggil saat cache dan file belum ada). */
function buildHrIndex_() {
  const data = readHrRows_();
  const headerRow = findHeaderRow_(data, "Employee Number");
  const header = data[headerRow].map(h => clean_(h));

  const col = {
    nik:  header.indexOf("Employee Number"),
    name: header.indexOf("Full Name"),
    tier: header.indexOf("Tier"),
    pin:  header.indexOf("PIN")
  };
  for (const c in col) {
    if (col[c] === -1) throw new Error("Column not found in the HR sheet: " + c);
  }
  // Opsional: kalau kolom ini tidak ada, login tetap jalan (jabatan dan foto kosong)
  const jobCol = findColumn_(header, ["Job Title/Position"]);
  const photoCol = findColumn_(header, ["Photo"]);
  const nickCol = findColumn_(header, ["Nickname"]);

  const index = [];
  for (let i = headerRow + 1; i < data.length; i++) {
    const nik = clean_(data[i][col.nik]);
    if (!nik) continue;
    index.push({
      nik: nik,
      name: data[i][col.name],
      tier: data[i][col.tier],
      pinHash: hashPin_(clean_(data[i][col.pin])),
      jobTitle: jobCol === -1 ? "" : clean_(data[i][jobCol]),
      photo: photoCol === -1 ? "" : clean_(data[i][photoCol]),
      nickname: nickCol === -1 ? "" : clean_(data[i][nickCol])
    });
  }

  return index;
}

/** Hash PIN (SHA-256). Dipakai untuk cek PIN tanpa menyimpan PIN asli. */
function hashPin_(pin) {
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(pin)));
}

/**
 * Baca tab HR dari file .xlsx asli tanpa mengubahnya.
 * File dikonversi jadi Google Sheets sementara, dibaca, lalu dibuang.
 * Butuh layanan lanjutan "Drive API" (v3) aktif di project Apps Script.
 */
function readHrRows_() {
  const blob = DriveApp.getFileById(HR_FILE_ID).getBlob();
  const tmp = Drive.Files.create(
    { name: "tmp_hr_" + Date.now(), mimeType: MimeType.GOOGLE_SHEETS },
    blob
  );
  try {
    const sheet = SpreadsheetApp.openById(tmp.id).getSheetByName(HR_TAB_NAME);
    if (!sheet) throw new Error("HR tab not found: " + HR_TAB_NAME);
    return sheet.getDataRange().getDisplayValues();
  } finally {
    DriveApp.getFileById(tmp.id).setTrashed(true);
  }
}

/** Cari baris header di 5 baris pertama (kalau ada baris judul di atasnya). */
function findHeaderRow_(data, keyHeader) {
  for (let i = 0; i < Math.min(data.length, 5); i++) {
    if (data[i].some(h => clean_(h) === keyHeader)) return i;
  }
  throw new Error("Header '" + keyHeader + "' not found in the HR sheet.");
}

function getSession_(token) {
  if (!token) return null;
  const raw = CacheService.getScriptCache().get("sess_" + token);
  return raw ? JSON.parse(raw) : null;
}

function requireSession_(token) {
  const sess = getSession_(token);
  if (!sess) throw new Error("SESSION_EXPIRED");
  return sess;
}

/* ---------- DATA (butuh token) ---------- */

/** Satu panggilan untuk semua data home dan menu. Tiap baris punya _row (nomor baris di sheet). */
function getAppData(token) {
  requireSession_(token);
  const out = {};
  Object.keys(SHEETS).forEach(key => {
    out[key] = readRows_(SHEETS[key]);
  });
  return out;
}

function readRows_(def) {
  const cache = CacheService.getScriptCache();
  const key = "rows_" + def.suffix;
  const raw = cache.get(key);
  if (raw) return JSON.parse(raw);

  const rows = readRowsFromSheet_(def);
  const json = JSON.stringify(rows);
  if (json.length <= 95000) cache.put(key, json, ROWS_CACHE_SECONDS);
  return rows;
}

/** Dipanggil setelah setiap perubahan, supaya halaman langsung menampilkan data terbaru. */
function invalidateRows_(suffix) {
  CacheService.getScriptCache().remove("rows_" + suffix);
}

function readRowsFromSheet_(def) {
  const sheet = findSheet_(def.suffix);
  const map = resolveCols_(sheet, def);
  const keys = Object.keys(map);
  const data = sheet.getDataRange().getDisplayValues();

  const rows = [];
  for (let i = 1; i < data.length; i++) {          // i = 0 adalah header
    if (!data[i].some(c => clean_(c) !== "")) continue;
    const o = { _row: i + 1 };
    keys.forEach(k => { o[k] = clean_(data[i][map[k] - 1]); });
    rows.push(o);
  }
  return rows;
}

/* ---------- TULIS (semua lewat sini) ---------- */

/**
 * Update satu baris. oldValues = isi baris saat form dibuka.
 * Kalau isi sheet sudah beda, simpan ditolak supaya perubahan orang lain tidak tertimpa.
 */
function updateRow(token, sheetKey, rowNumber, oldValues, newValues) {
  const access = requireEditor_(token, sheetKey);
  const def = access.def;
  const row = checkRowNumber_(rowNumber);

  return withLock_(function () {
    const sheet = findSheet_(def.suffix);
    checkRowExists_(sheet, row);

    const map = resolveCols_(sheet, def);
    const keys = Object.keys(map);
    const current = readRowAsObject_(sheet, row, map);
    checkNoConflict_(current, keys, oldValues);

    const changed = keys.filter(k => clean_(newValues[k]) !== current[k]);
    if (!changed.length) return { ok: true, changed: 0 };

    changed.forEach(k => {
      sheet.getRange(row, map[k])
        .setNumberFormat("@")                       // simpan sebagai teks, supaya "85,000" tidak berubah jadi angka
        .setValue(clean_(newValues[k]));
    });

    const summary = changed
      .map(k => k + ': "' + current[k] + '" → "' + clean_(newValues[k]) + '"')
      .join("; ");
    logChange_(def.suffix, row, access.sess.name, "EDIT — " + summary);
    invalidateRows_(def.suffix);

    return { ok: true, changed: changed.length };
  });
}

/** Tambah satu baris di akhir sheet. Hanya kolom yang dikenali yang ditulis. */
function addRow(token, sheetKey, newValues) {
  const access = requireEditor_(token, sheetKey);
  const def = access.def;

  return withLock_(function () {
    const sheet = findSheet_(def.suffix);
    const map = resolveCols_(sheet, def);
    const keys = Object.keys(map);
    if (keys.every(k => clean_(newValues[k]) === "")) throw new Error("Fill in at least one field.");

    const row = sheet.getLastRow() + 1;
    keys.forEach(k => {
      sheet.getRange(row, map[k])
        .setNumberFormat("@")
        .setValue(clean_(newValues[k]));
    });

    const values = {};
    keys.forEach(k => { values[k] = clean_(newValues[k]); });
    logChange_(def.suffix, row, access.sess.name, "ADD — " + describe_(values, keys));
    invalidateRows_(def.suffix);

    return { ok: true, row: row };
  });
}

/**
 * Hapus satu baris (permanen). Isi baris ditulis dulu ke changelog,
 * jadi kalau salah hapus, datanya masih bisa dikembalikan manual.
 */
function deleteRow(token, sheetKey, rowNumber, oldValues) {
  const access = requireEditor_(token, sheetKey);
  const def = access.def;
  const row = checkRowNumber_(rowNumber);

  return withLock_(function () {
    const sheet = findSheet_(def.suffix);
    checkRowExists_(sheet, row);

    const map = resolveCols_(sheet, def);
    const keys = Object.keys(map);
    const current = readRowAsObject_(sheet, row, map);
    checkNoConflict_(current, keys, oldValues);

    logChange_(def.suffix, row, access.sess.name, "DELETE — " + describe_(current, keys));
    invalidateRows_(def.suffix);
    sheet.deleteRow(row);

    return { ok: true };
  });
}

/* ---------- HELPER TULIS ---------- */

/** Cek sesi, akses edit, dan whitelist sheet. Dipakai semua fungsi tulis. */
function requireEditor_(token, sheetKey) {
  const sess = requireCanEdit_(token);
  if (EDITABLE_SHEETS.indexOf(sheetKey) === -1) throw new Error("This sheet can't be changed.");
  return { sess: sess, def: SHEETS[sheetKey] };
}

/** Cek sesi dan akses edit saja. */
function requireCanEdit_(token) {
  const sess = requireSession_(token);
  if (!canEditTier_(sess.tier)) throw new Error("Your role can't edit data.");
  return sess;
}

/**
 * Simpan file (foto atau PDF) ke folder upload di Drive, lalu balikin ID-nya.
 * base64 = isi file tanpa prefix "data:...;base64,". File dibagikan "siapa pun yang punya link: lihat"
 * supaya gambarnya bisa tampil di app.
 */
function uploadFile(token, base64, mimeType, fileName) {
  requireCanEdit_(token);
  if (UPLOAD_TYPES.indexOf(mimeType) === -1) throw new Error("File type not allowed. Use JPG, PNG, WEBP, or PDF.");

  const bytes = Utilities.base64Decode(String(base64 || ""));
  if (!bytes.length) throw new Error("File is empty.");
  if (bytes.length > UPLOAD_MAX_BYTES) throw new Error("File is too large. Maximum 5 MB.");

  const blob = Utilities.newBlob(bytes, mimeType, clean_(fileName) || "upload");
  const file = getUploadFolder_().createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { id: file.getId() };
}

/** Folder upload dibuat sekali, ID-nya disimpan di Script Properties. */
function getUploadFolder_() {
  const props = PropertiesService.getScriptProperties();
  const saved = props.getProperty("UPLOAD_FOLDER_ID");
  if (saved) {
    try { return DriveApp.getFolderById(saved); } catch (e) { /* folder hilang, buat baru */ }
  }
  const folder = DriveApp.createFolder("Reload Staff Hub — Uploads");
  props.setProperty("UPLOAD_FOLDER_ID", folder.getId());
  return folder;
}

function checkRowNumber_(rowNumber) {
  const row = Number(rowNumber);
  if (!Number.isInteger(row) || row < 2) throw new Error("Invalid row number.");
  return row;
}

function checkRowExists_(sheet, row) {
  if (row > sheet.getLastRow()) throw new Error("This row no longer exists. Refresh first.");
}

function checkNoConflict_(current, keys, oldValues) {
  const conflict = keys.some(k => current[k] !== clean_(oldValues[k]));
  if (conflict) throw new Error("CONFLICT: the data has changed. Refresh and try again.");
}

/** Satu operasi tulis dalam lock, supaya dua orang nulis barengan tidak tabrakan. */
function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

/** Tulis satu baris ke 99_Changelog, kolom dicari lewat header. */
function logChange_(module, row, name, summary) {
  const sheet = findSheet_(CHANGELOG_TAB);
  const map = resolveCols_(sheet, { suffix: CHANGELOG_TAB, cols: CHANGELOG_COLS });
  const target = sheet.getLastRow() + 1;
  const now = Utilities.formatDate(new Date(), TIMEZONE, "dd MMM yyyy HH:mm");
  const values = { version: "", date: now, module: module, changes: "Row " + row + " — " + summary, by: name };

  Object.keys(map).forEach(k => {
    sheet.getRange(target, map[k]).setNumberFormat("@").setValue(values[k]);
  });
}

/**
 * Cari posisi kolom tiap kunci lewat nama header (baris 1).
 * Balikin { kunci: nomorKolom (mulai 1) }. Kolom yang tidak ketemu bikin error jelas.
 */
function resolveCols_(sheet, def) {
  const width = sheet.getLastColumn();
  const header = sheet.getRange(1, 1, 1, width).getDisplayValues()[0].map(clean_);

  const map = {};
  Object.keys(def.cols).forEach(key => {
    const idx = findColumn_(header, def.cols[key]);
    if (idx === -1) {
      throw new Error("Column '" + def.cols[key][0] + "' not found in sheet " + def.suffix + ". Check the header name.");
    }
    map[key] = idx + 1;
  });
  return map;
}

/** Exact dulu, lalu awalan (untuk header panjang seperti "IMAGE FILE ID (https://...)"). Balikin index 0-based atau -1. */
function findColumn_(header, aliases) {
  const lower = header.map(h => h.toLowerCase());
  for (let a = 0; a < aliases.length; a++) {
    const i = lower.indexOf(aliases[a].toLowerCase());
    if (i !== -1) return i;
  }
  for (let a = 0; a < aliases.length; a++) {
    const want = aliases[a].toLowerCase();
    const i = lower.findIndex(h => h.indexOf(want) === 0);
    if (i !== -1) return i;
  }
  return -1;
}

function readRowAsObject_(sheet, row, map) {
  const values = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  const o = {};
  Object.keys(map).forEach(k => { o[k] = clean_(values[map[k] - 1]); });
  return o;
}

function describe_(values, keys) {
  return keys.map(k => k + ': "' + values[k] + '"').join("; ");
}

function findSheetOrNull_(suffix) {
  return ss.getSheets().find(s => s.getName().indexOf(suffix) !== -1) || null;
}

function findSheet_(suffix) {
  const sheet = findSheetOrNull_(suffix);
  if (!sheet) throw new Error("Sheet not found: " + suffix);
  return sheet;
}

function clean_(v) {
  return String(v == null ? "" : v).trim();
}
