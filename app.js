/****************************************
 * RELOAD STAFF HUB — FRONTEND (GitHub Pages)
 * Version : 2.9.0 (form tanpa ketik bebas: dropdown, date picker, checkbox)
 * Riwayat perubahan ada di CHANGELOG.md
 ****************************************/

const APP_VERSION = "2.9.0";

const TABS = [
  { key: "home",     label: "Home" },
  { key: "food",     label: "Food" },
  { key: "beverage", label: "Beverage" },
  { key: "sop",      label: "SOP" },
  { key: "teams",    label: "Teams" },
  { key: "academy",  label: "Academy" },
  { key: "guests",   label: "Guests" },
  { key: "about",    label: "About" }
];

/*
 * Konfigurasi form. Tiap field punya cara isi sendiri, supaya pengguna tidak perlu mengetik
 * yang sebenarnya bisa dipilih:
 *   input: "date" | "today" | "price" | "phone" | "drive" | "url" | "multi" | "allergens"
 *          (kosong = teks biasa)
 *   options: daftar pilihan tetap
 *   src: true = pilihan diambil dari nilai yang sudah ada di sheet, plus "+ Baru…"
 */
const STATUS_OPTIONS = ["ACTIVE", "INACTIVE"];
const ALLERGEN_OPTIONS = ["Gluten", "Milk", "Egg", "Nut", "Seafood", "Soy"];
const DIFFICULTY_OPTIONS = ["Beginner", "Intermediate", "Advanced"];
const SECTION_OPTIONS = ["Company Story", "Vision", "Mission", "Identity & Essences", "Core Values"];

const MENU_FIELDS = [
  { key: "category",    label: "Kategori", src: true },
  { key: "name",        label: "Nama menu" },
  { key: "description", label: "Deskripsi", input: "multi" },
  { key: "allergens",   label: "Alergen", input: "allergens" },
  { key: "price",       label: "Harga (Rp)", input: "price" },
  { key: "image",       label: "Foto", input: "drive" }
];

const EDIT_FIELDS = {
  importantInfo: [
    { key: "date",        label: "Tanggal", input: "date" },
    { key: "title",       label: "Judul" },
    { key: "description", label: "Deskripsi", input: "multi" },
    { key: "status",      label: "Status", options: STATUS_OPTIONS }
  ],
  bulletin: [
    { key: "date",        label: "Tanggal", input: "date" },
    { key: "type",        label: "Tipe", src: true },
    { key: "title",       label: "Judul" },
    { key: "description", label: "Deskripsi", input: "multi" },
    { key: "image",       label: "Foto", input: "drive" },
    { key: "status",      label: "Status", options: STATUS_OPTIONS }
  ],
  food: MENU_FIELDS,
  beverage: MENU_FIELDS,
  sop: [
    { key: "category",    label: "Kategori", src: true },
    { key: "name",        label: "Nama SOP" },
    { key: "description", label: "Deskripsi", input: "multi" },
    { key: "file",        label: "File SOP", input: "drive" },
    { key: "updated",     label: "Terakhir diupdate", input: "today" }
  ],
  teams: [
    { key: "department",  label: "Departemen", src: true },
    { key: "position",    label: "Jabatan", src: true },
    { key: "name",        label: "Nama" },
    { key: "image",       label: "Foto", input: "drive" },
    { key: "phone",       label: "Nomor WhatsApp", input: "phone" }
  ],
  about: [
    { key: "section",     label: "Bagian", options: SECTION_OPTIONS, src: true },
    { key: "content",     label: "Isi", input: "multi" }
  ],
  guests: [
    { key: "date",        label: "Tanggal", input: "date" },
    { key: "category",    label: "Kategori", src: true },
    { key: "guest",       label: "Nama tamu" },
    { key: "title",       label: "Judul" },
    { key: "description", label: "Deskripsi", input: "multi" },
    { key: "image",       label: "Foto", input: "drive" },
    { key: "status",      label: "Status", options: STATUS_OPTIONS }
  ],
  academy: [
    { key: "category",    label: "Kategori", src: true },
    { key: "title",       label: "Judul" },
    { key: "shortDesc",   label: "Deskripsi singkat" },
    { key: "content",     label: "Isi materi", input: "multi" },
    { key: "fullLink",    label: "Link materi", input: "url" },
    { key: "video",       label: "Link video", input: "url" },
    { key: "readingTime", label: "Waktu baca", src: true },
    { key: "knowledge",   label: "Knowledge of the Week", options: ["NO", "YES"] },
    { key: "updated",     label: "Terakhir diupdate", input: "today" },
    { key: "difficulty",  label: "Tingkat kesulitan", options: DIFFICULTY_OPTIONS, src: true }
  ],
  inspiration: [
    { key: "greeting",    label: "Waktu", options: ["Morning", "Afternoon", "Evening", "Night"] },
    { key: "quote",       label: "Quote", input: "multi" },
    { key: "author",      label: "Penulis", src: true }
  ]
};

const SHEET_LABELS = {
  importantInfo: "Important Info",
  bulletin: "Staff Bulletin",
  food: "Food Bible",
  beverage: "Beverage Bible",
  sop: "SOP",
  teams: "Our Teams",
  about: "About Reload",
  guests: "Guest Notes",
  academy: "Reload Academy",
  inspiration: "Quote Harian"
};

let sessionToken = readStore_("rsh_token");
let currentName = "";
let currentCanEdit = false;   // dari backend (canEditTier_), satu sumber kebenaran
let appData = null;
let activeTab = "home";
let searchText = "";
let formState = null;   // { mode: "add" | "edit", sheetKey, row, original }

/* ---------- API ---------- */

/**
 * Panggil backend Apps Script. Pakai text/plain supaya tidak kena preflight CORS.
 * Balasan: { ok, data } atau { ok:false, error }.
 */
async function api(fn, args) {
  const res = await fetch(CONFIG.API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ fn: fn, args: args || [] })
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Gagal memuat data.");
  return json.data;
}

/* ---------- STORAGE (aman kalau diblokir browser) ---------- */

function readStore_(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}

function writeStore_(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch (e) { /* abaikan */ }
}

/* ---------- START ---------- */

window.addEventListener("load", async function () {
  document.getElementById("appVersion").innerText = APP_VERSION;
  document.getElementById("loginBtn").addEventListener("click", doLogin);
  document.getElementById("loginPin").addEventListener("keydown", function (e) {
    if (e.key === "Enter") doLogin();
  });
  document.getElementById("logoutBtn").addEventListener("click", doLogout);
  document.getElementById("editClose").addEventListener("click", closeForm);
  document.getElementById("editSave").addEventListener("click", saveForm);
  document.getElementById("editDelete").addEventListener("click", deleteForm);
  document.getElementById("editForm").addEventListener("change", onFormChange);
  document.getElementById("editModal").addEventListener("click", function (e) {
    if (e.target.id === "editModal") closeForm();
  });

  if (!sessionToken) return showLogin();

  try {
    const sess = await api("checkSession", [sessionToken]);
    if (sess.ok) enterApp(sess);
    else endSession();
  } catch (e) {
    endSession();
  }
});

/* ---------- LOGIN ---------- */

function showLogin() {
  document.getElementById("loginScreen").classList.remove("hidden");
  document.getElementById("appShell").classList.add("hidden");
  document.getElementById("loginPin").value = "";
}

function enterApp(user) {
  currentName = user.name || "";
  currentCanEdit = !!user.canEdit;
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("appShell").classList.remove("hidden");
  document.getElementById("userName").innerText = currentName;
  document.getElementById("userTier").innerText =
    (user.tier || "") + " · " + (currentCanEdit ? "Mode edit" : "Mode baca");
  document.getElementById("userInitials").innerText = initials(currentName);
  renderTabbar();
  loadData();
}

async function doLogin() {
  const nik = document.getElementById("loginNik").value.trim();
  const pin = document.getElementById("loginPin").value.trim();
  const err = document.getElementById("loginError");
  const btn = document.getElementById("loginBtn");

  err.innerText = "";
  if (!nik || !pin) {
    err.innerText = "NIK dan PIN wajib diisi.";
    return;
  }

  btn.disabled = true;
  btn.innerText = "Memeriksa...";

  try {
    const res = await api("login", [nik, pin]);
    if (res.ok) {
      sessionToken = res.token;
      writeStore_("rsh_token", sessionToken);
      enterApp(res);
    } else {
      err.innerText = res.message;
      document.getElementById("loginPin").value = "";
    }
  } catch (e) {
    err.innerText = "Gagal terhubung: " + e.message;
  } finally {
    btn.disabled = false;
    btn.innerText = "Masuk";
  }
}

function doLogout() {
  if (sessionToken) api("logout", [sessionToken]).catch(function () {});
  endSession();
}

function endSession() {
  sessionToken = null;
  currentName = "";
  currentCanEdit = false;
  writeStore_("rsh_token", null);
  appData = null;
  closeForm();
  showLogin();
}

async function loadData() {
  try {
    appData = await api("getAppData", [sessionToken]);
    renderTab();
  } catch (e) {
    handleApiError(e);
  }
}

function handleApiError(e) {
  if (String(e.message).indexOf("SESSION_EXPIRED") !== -1) {
    toast("Sesi kamu sudah habis. Silakan masuk lagi.");
    endSession();
  } else {
    toast("Gagal memuat data: " + e.message);
  }
}

/* ---------- NAVIGASI ---------- */

function renderTabbar() {
  document.getElementById("tabbar").innerHTML = TABS.map(function (t) {
    return '<button class="tab' + (t.key === activeTab ? ' active' : '') +
      '" type="button" onclick="showTab(\'' + t.key + '\')">' + t.label + '</button>';
  }).join("");
}

function showTab(key) {
  activeTab = key;
  searchText = "";
  renderTabbar();
  renderTab();
  window.scrollTo(0, 0);
}

function renderTab() {
  const app = document.getElementById("app");
  if (!appData) {
    app.innerHTML = '<p class="muted">Memuat data...</p>';
    return;
  }

  let html = "";
  if (activeTab === "home")          html = viewHome();
  else if (activeTab === "food")     html = viewSearchable("food");
  else if (activeTab === "beverage") html = viewSearchable("beverage");
  else if (activeTab === "sop")      html = viewSearchable("sop");
  else if (activeTab === "teams")    html = viewTeams();
  else if (activeTab === "academy")  html = viewSearchable("academy");
  else if (activeTab === "guests")   html = viewGuests();
  else if (activeTab === "about")    html = viewAbout();

  app.innerHTML = html;
}

/* ---------- HOME ---------- */

function viewHome() {
  const info = appData.importantInfo.find(r => r.status === "ACTIVE");
  const quotes = appData.inspiration.filter(r => r.greeting === timeOfDay());
  const quote = quotes.length ? quotes[new Date().getDate() % quotes.length] : null;
  const news = appData.bulletin.filter(showItem);

  return '<section class="hero">' +
      '<div class="hero-greet">Selamat ' + greetingWord() + '</div>' +
      '<div class="hero-name">' + esc(firstName(currentName)) + '</div>' +
      (quote
        ? '<p class="hero-quote">“' + esc(quote.quote) + '”</p>' +
          '<cite class="hero-cite">— ' + esc(quote.author) + '</cite>' +
          editBtn("inspiration", quote)
        : '') +
      addBtn("inspiration", "+ Quote") +
    '</section>' +

    sectionHead("Important Info", "importantInfo") +
    (info
      ? '<div class="card highlight">' +
          '<div class="caption-label">' + esc(info.date) + '</div>' +
          '<strong>' + esc(info.title) + '</strong>' +
          '<p class="pre muted">' + esc(info.description) + '</p>' +
          editBtn("importantInfo", info) +
        '</div>'
      : emptyState("Tidak ada info aktif.")) +

    sectionHead("Staff Bulletin", "bulletin") +
    (news.length
      ? news.map(r =>
          '<div class="note' + inactiveClass(r) + '"><div class="note-body">' +
            '<div class="small muted">' + esc(r.date) + (r.type ? ' · ' + esc(r.type) : '') + statusBadge(r) + '</div>' +
            '<div class="note-title">' + esc(r.title) + '</div>' +
            '<p class="pre muted">' + esc(r.description) + '</p>' +
            editBtn("bulletin", r) +
          '</div></div>'
        ).join("")
      : emptyState("Belum ada bulletin aktif."));
}

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 11) return "Morning";
  if (h < 15) return "Afternoon";
  if (h < 19) return "Evening";
  return "Night";
}

function greetingWord() {
  const h = new Date().getHours();
  if (h < 11) return "pagi";
  if (h < 15) return "siang";
  if (h < 19) return "sore";
  return "malam";
}

/* ---------- MENU / SOP / ACADEMY (ada pencarian) ---------- */

function viewSearchable(sheetKey) {
  return sectionHead(SHEET_LABELS[sheetKey], sheetKey) +
    '<input class="input search" type="search" placeholder="Cari..." value="' + esc(searchText) +
    '" oninput="onSearch(this.value)">' +
    '<div id="listArea">' + listHtml() + '</div>';
}

function onSearch(value) {
  searchText = value.trim().toLowerCase();
  document.getElementById("listArea").innerHTML = listHtml();
}

function listHtml() {
  if (activeTab === "food")     return menuList(appData.food, "food");
  if (activeTab === "beverage") return menuList(appData.beverage, "beverage");
  if (activeTab === "sop")      return sopList();
  if (activeTab === "academy")  return academyList();
  return "";
}

function matches(fields) {
  return fields.join(" ").toLowerCase().indexOf(searchText) !== -1;
}

function menuList(rows, sheetKey) {
  const items = rows.filter(r => r.name && matches([r.category, r.name, r.description]));
  if (!items.length) return emptyState("Tidak ada menu yang cocok.");

  return groupBy(items, "category").map(g =>
    '<h3 class="group">' + esc(g.key) + '</h3>' +
    '<div class="grid">' +
    g.items.map(r =>
      '<article class="tile">' +
        (r.image
          ? '<img class="tile-img" src="' + imgUrl(r.image) + '" alt="" loading="lazy">'
          : '<div class="tile-img placeholder">' + esc(initial(r.name)) + '</div>') +
        '<div class="tile-body">' +
          '<div class="tile-head"><h3>' + esc(r.name) + '</h3>' +
          '<span class="price">Rp ' + esc(r.price) + '</span></div>' +
          '<p class="muted small pre">' + esc(r.description) + '</p>' +
          (r.allergens ? '<span class="allergen">Alergen: ' + esc(r.allergens) + '</span>' : '') +
          editBtn(sheetKey, r) +
        '</div>' +
      '</article>'
    ).join("") +
    '</div>'
  ).join("");
}

function sopList() {
  const items = appData.sop.filter(r => r.name && r.file && matches([r.category, r.name, r.description]));
  if (!items.length) return emptyState("Tidak ada SOP yang cocok.");

  return groupBy(items, "category").map(g =>
    '<h3 class="group">' + esc(g.key) + '</h3>' +
    g.items.map(r =>
      '<div class="row">' +
        '<a class="row-main" target="_blank" rel="noopener" href="https://drive.google.com/file/d/' +
          encodeURIComponent(r.file) + '/view">' +
          '<strong>' + esc(r.name) + '</strong>' +
          '<span class="small muted">Update: ' + esc(r.updated) + '</span>' +
        '</a>' +
        '<span class="chev">›</span>' +
        editBtn("sop", r) +
      '</div>'
    ).join("")
  ).join("");
}

function academyList() {
  const items = appData.academy.filter(r => r.title && matches([r.category, r.title, r.shortDesc]));
  if (!items.length) return emptyState("Tidak ada materi yang cocok.");

  return groupBy(items, "category").map(g =>
    '<h3 class="group">' + esc(g.key) + '</h3>' +
    '<div class="grid two">' +
    g.items.map(r =>
      '<article class="card">' +
        '<div class="row-between">' +
          '<h3>' + esc(r.title) + '</h3>' +
          (r.knowledge === "YES" ? '<span class="badge">Knowledge of the Week</span>' : '') +
        '</div>' +
        (r.shortDesc ? '<p class="muted small">' + esc(r.shortDesc) + '</p>' : '') +
        '<div class="meta">' +
          (r.difficulty ? '<span class="chip">' + esc(r.difficulty) + '</span>' : '') +
          (r.readingTime ? '<span class="chip">' + esc(r.readingTime) + '</span>' : '') +
          (r.updated ? '<span class="chip">Update ' + esc(r.updated) + '</span>' : '') +
        '</div>' +
        (r.content ? '<p class="pre muted small">' + esc(r.content) + '</p>' : '') +
        '<div class="actions">' +
          (r.video ? '<a class="btn small" target="_blank" rel="noopener" href="' + esc(r.video) + '">Tonton video</a>' : '') +
          (r.fullLink ? '<a class="btn small outline" target="_blank" rel="noopener" href="' + esc(r.fullLink) + '">Baca materi</a>' : '') +
        '</div>' +
        editBtn("academy", r) +
      '</article>'
    ).join("") +
    '</div>'
  ).join("");
}

/* ---------- TEAMS / GUESTS / ABOUT ---------- */

function viewTeams() {
  const rows = appData.teams.filter(r => r.name);
  return sectionHead("Our Teams", "teams") +
    (rows.length
      ? groupBy(rows, "department").map(g =>
          '<h3 class="group">' + esc(g.key) + '</h3>' +
          '<div class="grid">' +
          g.items.map(r =>
            '<div class="person">' +
              (r.image
                ? '<img class="person-photo" src="' + imgUrl(r.image) + '" alt="" loading="lazy">'
                : '<div class="person-photo initials">' + esc(initials(r.name)) + '</div>') +
              '<div class="person-name">' + esc(r.name) + '</div>' +
              '<div class="muted">' + esc(r.position) + '</div>' +
              (r.phone
                ? '<a class="pill" target="_blank" rel="noopener" href="https://wa.me/' +
                  esc(r.phone.replace(/\D/g, "")) + '">WhatsApp</a>'
                : '') +
              editBtn("teams", r) +
            '</div>'
          ).join("") +
          '</div>'
        ).join("")
      : emptyState("Belum ada data tim."));
}

function viewGuests() {
  const rows = appData.guests.filter(showItem);
  return sectionHead("Guest Notes", "guests") +
    (rows.length
      ? rows.map(r =>
          '<div class="note' + inactiveClass(r) + '">' +
            (r.image ? '<img class="thumb" src="' + imgUrl(r.image) + '" alt="" loading="lazy">' : '') +
            '<div class="note-body">' +
              '<div class="row-between">' +
                '<strong>' + esc(r.guest) + '</strong>' +
                '<span class="badge">' + esc(r.category) + '</span>' + statusBadge(r) +
              '</div>' +
              '<div class="small muted">' + esc(r.date) + (r.title ? ' · ' + esc(r.title) : '') + '</div>' +
              '<p class="pre muted small">' + esc(r.description) + '</p>' +
              editBtn("guests", r) +
            '</div>' +
          '</div>'
        ).join("")
      : emptyState("Tidak ada catatan tamu aktif."));
}

function viewAbout() {
  const rows = appData.about.filter(r => r.section);
  return sectionHead("About Reload", "about") +
    (rows.length
      ? '<div class="grid two">' +
        rows.map(r =>
          '<div class="card panel"><h3>' + esc(r.section) + '</h3>' +
          '<p class="pre muted">' + esc(r.content) + '</p>' +
          editBtn("about", r) + '</div>'
        ).join("") +
        '</div>'
      : emptyState("Belum ada informasi."));
}

/* ---------- TOMBOL EDIT / TAMBAH ---------- */

/** Satu definisi "boleh edit": dari backend. Dipakai semua tombol tambah/edit/hapus. */
function canEdit() {
  return currentCanEdit;
}

/**
 * Item yang tampil: staff hanya lihat yang ACTIVE, editor lihat semua
 * supaya bisa mengaktifkan lagi item yang nonaktif.
 */
function showItem(rec) {
  return currentCanEdit || rec.status === "ACTIVE";
}

function inactiveClass(rec) {
  return rec.status === "ACTIVE" ? "" : " is-inactive";
}

/** Label "Nonaktif" hanya untuk editor. Staff tidak pernah melihat item nonaktif. */
function statusBadge(rec) {
  if (!currentCanEdit || rec.status === "ACTIVE") return "";
  return ' <span class="badge off">Nonaktif</span>';
}

function sectionHead(title, sheetKey) {
  return '<div class="section-head"><h2 class="section-title">' + esc(title) + '</h2>' +
    addBtn(sheetKey, "+ Tambah") + '</div>';
}

function addBtn(sheetKey, label) {
  if (!canEdit()) return "";
  return '<button class="add-btn" type="button" onclick="openAdd(\'' + sheetKey + '\')">' + esc(label) + '</button>';
}

function editBtn(sheetKey, rec) {
  if (!canEdit() || !rec || !rec._row) return "";
  return '<button class="edit-btn" type="button" onclick="openEdit(\'' + sheetKey + '\',' + rec._row + ')">Edit</button>';
}

/* ---------- FORM (tambah, edit, hapus) ---------- */

function openAdd(sheetKey) {
  const blank = {};
  EDIT_FIELDS[sheetKey].forEach(f => { blank[f.key] = defaultValue(sheetKey, f); });
  formState = { mode: "add", sheetKey: sheetKey, row: null, original: blank };
  showForm("Tambah " + SHEET_LABELS[sheetKey], blank, false);
}

function openEdit(sheetKey, row) {
  const rec = (appData[sheetKey] || []).find(r => r._row === row);
  if (!rec) return toast("Data sudah tidak ada. Refresh dulu.");

  formState = { mode: "edit", sheetKey: sheetKey, row: row, original: rec };
  showForm("Edit " + SHEET_LABELS[sheetKey], rec, true);
}

function showForm(title, values, canDelete) {
  const sheetKey = formState.sheetKey;
  document.getElementById("editForm").innerHTML =
    EDIT_FIELDS[sheetKey].map(f => fieldHtml(sheetKey, f, values[f.key])).join("");
  document.getElementById("editTitle").innerText = title;
  document.getElementById("editError").innerText = "";
  setFormBusy(false);
  document.getElementById("editDelete").classList.toggle("hidden", !canDelete);
  document.getElementById("editModal").classList.remove("hidden");
}

function closeForm() {
  formState = null;
  const modal = document.getElementById("editModal");
  if (modal) modal.classList.add("hidden");
}

function setFormBusy(busy) {
  document.getElementById("editSave").disabled = busy;
  document.getElementById("editDelete").disabled = busy;
  document.getElementById("editSave").innerText = busy ? "Menyimpan..." : "Simpan";
}

/* ---------- NILAI DEFAULT & PILIHAN ---------- */

/** Nilai awal saat tambah baru. */
function defaultValue(sheetKey, f) {
  if (f.input === "date" || f.input === "today") return formatSheetDate(new Date());
  if (f.input === "phone") return "62";
  if (f.options) return f.options[0];
  if (f.src) {
    const list = distinctValues(sheetKey, f.key);
    return list.length ? list[0] : "";
  }
  return "";
}

/** Nilai unik dari sheet, dipakai sebagai pilihan (satu sumber: data itu sendiri). */
function distinctValues(sheetKey, key) {
  const seen = [];
  (appData[sheetKey] || []).forEach(r => {
    const v = String(r[key] || "").trim();
    if (v && seen.indexOf(v) === -1) seen.push(v);
  });
  return seen.sort((a, b) => a.localeCompare(b));
}

function optionList(sheetKey, f) {
  const list = (f.options || []).slice();
  if (f.src) {
    distinctValues(sheetKey, f.key).forEach(v => {
      if (list.indexOf(v) === -1) list.push(v);
    });
  }
  return list;
}

/* ---------- INPUT PER TIPE ---------- */

function fieldHtml(sheetKey, f, value) {
  const v = value == null ? "" : String(value);
  return '<div class="field"><span class="caption-label">' + esc(f.label) + '</span>' +
    fieldInput(sheetKey, f, v) + '</div>';
}

function fieldInput(sheetKey, f, v) {
  const key = 'data-key="' + f.key + '"';

  if (f.input === "allergens") return checksHtml(f, v);
  if (f.input === "today") return '<input class="input" type="text" readonly ' + key + ' value="' + esc(v) + '">';
  if (f.input === "date") return '<input class="input" type="date" ' + key + ' value="' + esc(isoFromSheetDate(v)) + '">';
  if (f.input === "price") return '<input class="input" type="number" inputmode="numeric" min="0" step="500" ' + key + ' value="' + esc(v.replace(/\D/g, "")) + '">';
  if (f.input === "phone") return '<input class="input" type="tel" inputmode="numeric" ' + key + ' value="' + esc(v) + '" placeholder="628...">';
  if (f.input === "drive") return '<input class="input" type="text" ' + key + ' value="' + esc(v) + '" placeholder="Tempel link Google Drive">';
  if (f.input === "url") return '<input class="input" type="url" ' + key + ' value="' + esc(v) + '" placeholder="https://...">';
  if (f.input === "multi") return '<textarea class="input" rows="4" ' + key + '>' + esc(v) + '</textarea>';
  if (f.options || f.src) return selectHtml(sheetKey, f, v);
  return '<input class="input" type="text" ' + key + ' value="' + esc(v) + '">';
}

/** Dropdown. Kalau src, ada "+ Baru…" yang memunculkan kotak isian. */
function selectHtml(sheetKey, f, v) {
  let opts = optionList(sheetKey, f);
  if (v && opts.indexOf(v) === -1) opts = [v].concat(opts);   // nilai lama tetap tampil apa adanya

  const isNew = f.src && !v && opts.length === 0;
  const blank = !v && opts.length > 0 ? '<option value="" selected>— pilih —</option>' : '';

  return '<select class="input" data-key="' + f.key + '">' + blank +
    opts.map(o => '<option value="' + esc(o) + '"' + (o === v ? ' selected' : '') + '>' + esc(o) + '</option>').join("") +
    (f.src ? '<option value="__new__"' + (isNew ? ' selected' : '') + '>+ Baru…</option>' : '') +
    '</select>' +
    (f.src ? '<input class="input new-input' + (isNew ? '' : ' hidden') + '" type="text" data-new-for="' + f.key + '" placeholder="Tulis nilai baru">' : '');
}

/** Checkbox alergen. Nilai lama yang tidak ada di daftar tetap ditampilkan dan dicentang. */
function checksHtml(f, v) {
  const current = v.split(",").map(s => s.trim()).filter(Boolean);
  const all = ALLERGEN_OPTIONS.concat(current.filter(x => ALLERGEN_OPTIONS.indexOf(x) === -1));
  return '<div class="checks">' + all.map(o =>
    '<label class="check"><input type="checkbox" data-check="' + f.key + '" value="' + esc(o) + '"' +
      (current.indexOf(o) !== -1 ? ' checked' : '') + '> ' + esc(o) + '</label>'
  ).join("") + '</div>';
}

/** Kotak "+ Baru…" muncul hanya saat dipilih. */
function onFormChange(e) {
  const sel = e.target;
  if (!sel.matches || !sel.matches("select[data-key]")) return;
  const box = document.querySelector('#editForm [data-new-for="' + sel.dataset.key + '"]');
  if (!box) return;
  const isNew = sel.value === "__new__";
  box.classList.toggle("hidden", !isNew);
  if (isNew) box.focus();
}

/* ---------- BACA FORM ---------- */

/**
 * Isi form dibaca ulang. Kolom yang tidak diubah (readonly, atau tanggal yang formatnya lama
 * dan tidak bisa dibaca date picker) memakai nilai asli, supaya tidak ada yang kosong diam-diam.
 */
function readForm() {
  const sheetKey = formState.sheetKey;
  const values = Object.assign({}, withoutRow(formState.original));

  EDIT_FIELDS[sheetKey].forEach(f => {
    const v = readValue(f);
    if (v !== undefined) values[f.key] = v;
  });
  return values;
}

/** Balikin undefined kalau kolom ini sebaiknya pakai nilai asli. */
function readValue(f) {
  if (f.input === "allergens") {
    return Array.from(document.querySelectorAll('input[data-check="' + f.key + '"]:checked'))
      .map(x => x.value).join(",");
  }
  if (f.input === "today") return undefined;

  const el = document.querySelector('#editForm [data-key="' + f.key + '"]');
  if (!el) return undefined;
  const raw = el.value;

  if (f.input === "date") return raw ? formatSheetDate(new Date(raw + "T00:00:00")) : undefined;
  if (f.input === "price") return raw ? Number(raw).toLocaleString("en-US") : "";
  if (f.input === "phone") return raw.replace(/\D/g, "");
  if (f.input === "drive") {
    const id = extractDriveId(raw);
    if (id === null) throw new Error("Link Google Drive untuk " + f.label + " tidak valid. Tempel link lengkap dari Drive.");
    return id;
  }
  if (f.input === "url") {
    const t = raw.trim();
    if (t && !/^https?:\/\//i.test(t)) throw new Error(f.label + " harus diawali https://");
    return t;
  }
  if (el.tagName === "SELECT" && raw === "__new__") {
    const box = document.querySelector('#editForm [data-new-for="' + f.key + '"]');
    const nv = box ? box.value.trim() : "";
    if (!nv) throw new Error("Isi nilai baru untuk " + f.label + ".");
    return nv;
  }
  return raw.trim();
}

async function saveForm() {
  if (!formState) return;

  const sheetKey = formState.sheetKey;
  const mode = formState.mode;
  const row = formState.row;
  const oldValues = withoutRow(formState.original);

  setFormBusy(true);
  document.getElementById("editError").innerText = "";

  try {
    const newValues = readForm();
    if (mode === "add") {
      await api("addRow", [sessionToken, sheetKey, newValues]);
      toast("Ditambahkan.");
    } else {
      const res = await api("updateRow", [sessionToken, sheetKey, row, oldValues, newValues]);
      toast(res.changed ? "Tersimpan." : "Tidak ada perubahan.");
    }
    closeForm();
    loadData();
  } catch (e) {
    formError(e);
  }
}

async function deleteForm() {
  if (!formState || formState.mode !== "edit") return;
  if (!confirm("Hapus baris ini? Isinya dicatat di changelog, tapi tidak bisa dibatalkan dari app.")) return;

  const sheetKey = formState.sheetKey;
  const row = formState.row;
  const oldValues = withoutRow(formState.original);

  setFormBusy(true);
  document.getElementById("editError").innerText = "";

  try {
    await api("deleteRow", [sessionToken, sheetKey, row, oldValues]);
    toast("Dihapus.");
    closeForm();
    loadData();
  } catch (e) {
    formError(e);
  }
}

/* ---------- FORMAT & PARSE ---------- */

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Format yang dipakai sheet: "5 Oct 2026". */
function formatSheetDate(d) {
  return d.getDate() + " " + MONTHS_EN[d.getMonth()] + " " + d.getFullYear();
}

/** Ubah "5 Oct 2026" jadi "2026-10-05" untuk date picker. Kosong kalau formatnya tidak dikenali. */
function isoFromSheetDate(v) {
  const m = String(v || "").trim().match(/^(\d{1,2}) ([A-Za-z]{3})[a-z]* (\d{4})$/);
  if (!m) return "";
  const mi = MONTHS_EN.findIndex(x => x.toLowerCase() === m[2].toLowerCase());
  if (mi === -1) return "";
  return m[3] + "-" + String(mi + 1).padStart(2, "0") + "-" + String(m[1]).padStart(2, "0");
}

/**
 * Ambil ID file dari link Google Drive. Balikin null kalau tidak valid, "" kalau kosong.
 * Menerima link /file/d/ID/view, link ?id=ID, atau ID saja.
 */
function extractDriveId(text) {
  const t = String(text || "").trim();
  if (!t) return "";
  const m = t.match(/\/d\/([\w-]{20,})/) || t.match(/[?&]id=([\w-]{20,})/) || t.match(/^([\w-]{20,})$/);
  return m ? m[1] : null;
}

function formError(e) {
  if (String(e.message).indexOf("SESSION_EXPIRED") !== -1) {
    handleApiError(e);
    return;
  }
  document.getElementById("editError").innerText = e.message;
  setFormBusy(false);
}

function withoutRow(rec) {
  const o = Object.assign({}, rec);
  delete o._row;
  return o;
}

/* ---------- HELPER ---------- */

function groupBy(items, field) {
  const groups = [];
  items.forEach(it => {
    let g = groups.find(x => x.key === it[field]);
    if (!g) {
      g = { key: it[field], items: [] };
      groups.push(g);
    }
    g.items.push(it);
  });
  return groups;
}

function imgUrl(fileId) {
  return "https://drive.google.com/thumbnail?id=" + encodeURIComponent(fileId) + "&sz=w400";
}

function firstName(name) {
  return String(name || "").trim().split(/\s+/)[0] || "";
}

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts.slice(0, 2).map(p => p.charAt(0).toUpperCase()).join("");
}

function initial(text) {
  return String(text || "?").trim().charAt(0).toUpperCase();
}

function emptyState(msg) {
  return '<div class="empty">' + esc(msg) + '</div>';
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}

function toast(msg) {
  const el = document.getElementById("toast");
  el.innerText = msg;
  el.classList.remove("hidden");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.add("hidden"), 3500);
}
