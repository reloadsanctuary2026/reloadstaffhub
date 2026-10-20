/****************************************
 * RELOAD STAFF HUB — FRONTEND (GitHub Pages)
 * Version : 2.6.0 (desain baru, versi di footer)
 * Riwayat perubahan ada di CHANGELOG.md
 ****************************************/

const APP_VERSION = "2.6.0";

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

/* Field yang tampil di form, per sheet. Harus mencakup semua kolom sheet. */
const MENU_FIELDS = [
  { key: "category",    label: "Kategori" },
  { key: "name",        label: "Nama" },
  { key: "description", label: "Deskripsi", multi: true },
  { key: "allergens",   label: "Alergen" },
  { key: "price",       label: "Harga" },
  { key: "image",       label: "ID gambar (Drive)" }
];

const STATUS_OPTIONS = ["ACTIVE", "INACTIVE"];

const EDIT_FIELDS = {
  importantInfo: [
    { key: "date",        label: "Tanggal" },
    { key: "title",       label: "Judul" },
    { key: "description", label: "Deskripsi", multi: true },
    { key: "status",      label: "Status", options: STATUS_OPTIONS }
  ],
  bulletin: [
    { key: "date",        label: "Tanggal" },
    { key: "type",        label: "Tipe" },
    { key: "title",       label: "Judul" },
    { key: "description", label: "Deskripsi", multi: true },
    { key: "image",       label: "ID gambar (Drive)" },
    { key: "status",      label: "Status", options: STATUS_OPTIONS }
  ],
  food: MENU_FIELDS,
  beverage: MENU_FIELDS,
  sop: [
    { key: "category",    label: "Kategori" },
    { key: "name",        label: "Nama SOP" },
    { key: "description", label: "Deskripsi", multi: true },
    { key: "file",        label: "ID file Drive" },
    { key: "updated",     label: "Terakhir diupdate" }
  ],
  teams: [
    { key: "department", label: "Departemen" },
    { key: "position",   label: "Jabatan" },
    { key: "name",       label: "Nama" },
    { key: "image",      label: "ID foto (Drive)" },
    { key: "phone",      label: "Nomor HP (628...)" }
  ],
  about: [
    { key: "section", label: "Bagian" },
    { key: "content", label: "Isi", multi: true }
  ],
  guests: [
    { key: "date",        label: "Tanggal" },
    { key: "category",    label: "Kategori" },
    { key: "guest",       label: "Nama tamu" },
    { key: "title",       label: "Judul" },
    { key: "description", label: "Deskripsi", multi: true },
    { key: "image",       label: "ID gambar (Drive)" },
    { key: "status",      label: "Status", options: STATUS_OPTIONS }
  ],
  academy: [
    { key: "category",    label: "Kategori" },
    { key: "title",       label: "Judul" },
    { key: "shortDesc",   label: "Deskripsi singkat" },
    { key: "content",     label: "Isi materi", multi: true },
    { key: "fullLink",    label: "Link materi" },
    { key: "video",       label: "Link video" },
    { key: "readingTime", label: "Waktu baca" },
    { key: "knowledge",   label: "Knowledge of the Week", options: ["YES", "NO"] },
    { key: "updated",     label: "Terakhir diupdate" },
    { key: "difficulty",  label: "Tingkat kesulitan" }
  ],
  inspiration: [
    { key: "greeting", label: "Waktu", options: ["Morning", "Afternoon", "Evening", "Night"] },
    { key: "quote",    label: "Quote", multi: true },
    { key: "author",   label: "Penulis" }
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
let currentTier = "";
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
  currentTier = user.tier || "";
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("appShell").classList.remove("hidden");
  document.getElementById("userName").innerText = currentName;
  document.getElementById("userTier").innerText = currentTier;
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
  currentTier = "";
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
  const news = appData.bulletin.filter(r => r.status === "ACTIVE");

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
          '<div class="note"><div class="note-body">' +
            '<div class="small muted">' + esc(r.date) + (r.type ? ' · ' + esc(r.type) : '') + '</div>' +
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
  const rows = appData.guests.filter(r => r.status === "ACTIVE");
  return sectionHead("Guest Notes", "guests") +
    (rows.length
      ? rows.map(r =>
          '<div class="note">' +
            (r.image ? '<img class="thumb" src="' + imgUrl(r.image) + '" alt="" loading="lazy">' : '') +
            '<div class="note-body">' +
              '<div class="row-between">' +
                '<strong>' + esc(r.guest) + '</strong>' +
                '<span class="badge">' + esc(r.category) + '</span>' +
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

function canEdit() {
  return !!currentTier && currentTier !== "Staff";
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
  EDIT_FIELDS[sheetKey].forEach(f => { blank[f.key] = f.options ? f.options[0] : ""; });
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
  document.getElementById("editForm").innerHTML =
    EDIT_FIELDS[formState.sheetKey].map(f => fieldHtml(f, values[f.key])).join("");
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

function fieldHtml(f, value) {
  const v = value == null ? "" : value;
  let input;
  if (f.options) {
    // Kalau nilai di sheet tidak ada di pilihan, tetap tampilkan supaya tidak berubah diam-diam.
    const opts = f.options.indexOf(v) === -1 ? [v].concat(f.options) : f.options;
    input = '<select class="input" data-key="' + f.key + '">' +
      opts.map(o => '<option value="' + esc(o) + '"' + (o === v ? ' selected' : '') + '>' + esc(o) + '</option>').join("") +
      '</select>';
  } else if (f.multi) {
    input = '<textarea class="input" rows="4" data-key="' + f.key + '">' + esc(v) + '</textarea>';
  } else {
    input = '<input class="input" type="text" data-key="' + f.key + '" value="' + esc(v) + '">';
  }
  return '<label class="field"><span class="caption-label">' + esc(f.label) + '</span>' + input + '</label>';
}

/** Isi form dibaca ulang, dicampur dengan isi asli supaya kolom yang tidak tampil tidak ikut kosong. */
function readForm() {
  const values = Object.assign({}, withoutRow(formState.original));
  document.querySelectorAll("#editForm [data-key]").forEach(function (el) {
    values[el.dataset.key] = el.value;
  });
  return values;
}

async function saveForm() {
  if (!formState) return;

  const sheetKey = formState.sheetKey;
  const mode = formState.mode;
  const row = formState.row;
  const oldValues = withoutRow(formState.original);
  const newValues = readForm();

  setFormBusy(true);
  document.getElementById("editError").innerText = "";

  try {
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
