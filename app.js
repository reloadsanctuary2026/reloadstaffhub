/****************************************
 * RELOAD STAFF HUB — FRONTEND (GitHub Pages)
 * Version : 2.19.0 (halaman Our Guests lengkap: cari, filter kategori, urutan, grid/list)
 * Riwayat perubahan ada di CHANGELOG.md
 ****************************************/

const APP_VERSION = "2.27.0";

const HOME_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>';

const TABS = [
  { key: "home",     label: "Home", icon: HOME_ICON },
  { key: "food",     label: "Food Bible" },
  { key: "beverage", label: "Beverage Bible" },
  { key: "sop",      label: "SOP" },
  { key: "teams",    label: "Our Teams" },
  { key: "academy",  label: "Reload Academy" },
  { key: "about",    label: "About Reload" }
];

/*
 * Konfigurasi form. Tiap field punya cara isi sendiri, supaya pengguna tidak perlu mengetik
 * yang sebenarnya bisa dipilih:
 *   input: "date" | "today" | "price" | "phone" | "photo" | "pdf" | "url" | "multi" | "allergens"
 *          (kosong = teks biasa)
 *   options: daftar pilihan tetap
 *   src: true = pilihan diambil dari nilai yang sudah ada di sheet, plus "+ New…"
 */
/* Sama dengan dropdown Status di sheet. */
const STATUS_OPTIONS = ["ACTIVE", "NOT ACTIVE"];
const SESI_ORDER = ["Morning", "Afternoon", "Evening"];
const ALLERGEN_OPTIONS = ["Gluten", "Milk", "Egg", "Nut", "Seafood", "Soy"];
const DIFFICULTY_OPTIONS = ["Beginner", "Intermediate", "Advanced"];
const SECTION_OPTIONS = ["Company Story", "Vision", "Mission", "Identity & Essences", "Core Values"];
/* Kategori tamu. Sama dengan GUEST_CATEGORIES di backend (Code.gs). Kalau berubah, ubah keduanya. */
const GUEST_CATEGORIES = ["Birthday", "Preference", "VIP", "Farewell", "Celebration", "Achievement", "Complaint"];
/* Tipe bulletin. Sama dengan dropdown Type di sheet. Warna: green = event, yellow = pemberitahuan, lainnya abu-abu. */
const BULLETIN_TYPES = ["Meeting", "Internal Information"];
const BULLETIN_COLORS = { "Meeting": "green", "Internal Information": "yellow" };

/* Start hour of each shift. A shift is "now" from its start until the next shift starts. */
const SHIFT_START = { "M6": "06:00", "M8": "08:00", "M11": "11:00", "MD12": "12:00", "E2": "14:30" };
const SHIFT_NAMES = Object.keys(SHIFT_START);

const MENU_FIELDS = [
  { key: "category",    label: "Category", src: true },
  { key: "name",        label: "Menu name" },
  { key: "description", label: "Description", input: "multi" },
  { key: "allergens",   label: "Allergens", input: "allergens" },
  { key: "price",       label: "Price (Rp)", input: "price" },
  { key: "image",       label: "Photo", input: "photo" }
];

const EDIT_FIELDS = {
  upsell: [
    { key: "date",     label: "Date", input: "date" },
    { key: "sesi",     label: "Session", options: SESI_ORDER },
    { key: "shift",    label: "Shift", options: SHIFT_NAMES, src: true },
    { key: "item",     label: "Item" },
    { key: "target",   label: "Target", input: "number" },
    { key: "satuan",   label: "Unit (e.g. portion/server)", src: true }
  ],
  bulletin: [
    { key: "date",        label: "Date", input: "date" },
    { key: "type",        label: "Type", options: BULLETIN_TYPES },
    { key: "title",       label: "Title" },
    { key: "description", label: "Description", input: "multi" },
    { key: "image",       label: "Photo", input: "photo" },
    { key: "status",      label: "Status", options: STATUS_OPTIONS }
  ],
  food: MENU_FIELDS,
  beverage: MENU_FIELDS,
  sop: [
    { key: "category",    label: "Category", src: true },
    { key: "name",        label: "SOP name" },
    { key: "description", label: "Description", input: "multi" },
    { key: "file",        label: "SOP file (PDF)", input: "pdf" },
    { key: "updated",     label: "Last updated", input: "today" }
  ],
  teams: [
    { key: "department",  label: "Department", src: true },
    { key: "position",    label: "Position", src: true },
    { key: "name",        label: "Name" },
    { key: "image",       label: "Photo", input: "photo" },
    { key: "phone",       label: "WhatsApp number", input: "phone" }
  ],
  about: [
    { key: "section",     label: "Section", options: SECTION_OPTIONS, src: true },
    { key: "content",     label: "Content", input: "multi" }
  ],
  guests: [
    { key: "date",        label: "Date", input: "date" },
    { key: "category",    label: "Category", options: GUEST_CATEGORIES },
    { key: "guest",       label: "Guest name" },
    { key: "title",       label: "Title" },
    { key: "description", label: "Description", input: "multi" },
    { key: "image",       label: "Photo", input: "photo" },
    { key: "status",      label: "Status", options: STATUS_OPTIONS }
  ],
  academy: [
    { key: "category",    label: "Category", src: true },
    { key: "title",       label: "Title" },
    { key: "shortDesc",   label: "Short description" },
    { key: "content",     label: "Material content", input: "multi" },
    { key: "fullLink",    label: "Material link", input: "url" },
    { key: "video",       label: "Video link", input: "url" },
    { key: "readingTime", label: "Reading time", src: true },
    { key: "knowledge",   label: "Knowledge of the Week", options: ["NO", "YES"] },
    { key: "updated",     label: "Last updated", input: "today" },
    { key: "difficulty",  label: "Difficulty", options: DIFFICULTY_OPTIONS, src: true }
  ],
  inspiration: [
    { key: "greeting",    label: "Time", options: ["Morning", "Afternoon", "Evening", "Night"] },
    { key: "quote",       label: "Quote", input: "multi" },
    { key: "author",      label: "Author", src: true }
  ]
};

const SHEET_LABELS = {
  upsell: "Upsell Today",
  bulletin: "Staff Bulletin",
  food: "Food Bible",
  beverage: "Beverage Bible",
  sop: "SOP",
  teams: "Our Teams",
  about: "About Reload",
  guests: "Guest Notes",
  academy: "Reload Academy",
  inspiration: "Daily Quote"
};

let sessionToken = readStore_("rsh_token");
let currentName = "";
let currentNickname = "";
const GUEST_HOME_LIMIT = 5;
const GUEST_PREVIEW_PHONE = 50;    // potongan catatan di HP
const GUEST_PREVIEW_DESKTOP = 80;  // potongan catatan di desktop
const BULLETIN_HOME_LIMIT = 5;
let currentCanEdit = false;   // dari backend (canEditTier_), satu sumber kebenaran
let appData = null;
let activeTab = "home";
let searchText = "";
let guestsLanding = false;
let bulletinLanding = false;
let bulletinView = "list";
let bulletinMonth = null;   // { y, m } bulan yang sedang dilihat di kalender
let bulletinDay = null;     // "YYYY-MM-DD" hari yang dipilih di kalender
let bulletinShown = GUESTS_PAGE_SIZE;
const GUESTS_PAGE_SIZE = 12;
let guestFilter = { q: "", cat: -1, sort: "newest", view: "grid", status: "all", shown: GUESTS_PAGE_SIZE };
let formState = null;   // { mode: "add" | "edit", sheetKey, row, original }

/* ---------- API ---------- */

/**
 * Panggil backend Apps Script. Pakai text/plain supaya tidak kena preflight CORS.
 * Balasan: { ok, data } atau { ok:false, error }.
 */
const API_TIMEOUT_MS = 20000;
let pendingRequests = 0;

/** Bar loading tipis di atas layar, tampil selama ada request ke server. */
function trackRequest(delta) {
  pendingRequests = Math.max(0, pendingRequests + delta);
  const bar = document.getElementById("progress");
  if (bar) bar.classList.toggle("hidden", pendingRequests === 0);
}

/** Tombol dengan spinner dan label sementara. Dipakai untuk aksi yang menunggu server. */
function setBusy(btn, busy, label) {
  if (!btn) return;
  if (busy) {
    if (!btn.dataset.idle) btn.dataset.idle = btn.innerText;
    btn.innerText = label || btn.dataset.idle;
    btn.classList.add("loading");
    btn.disabled = true;
  } else {
    btn.innerText = btn.dataset.idle || btn.innerText;
    delete btn.dataset.idle;
    btn.classList.remove("loading");
    btn.disabled = false;
  }
}

async function api(fn, args) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  trackRequest(1);
  try {
    const res = await fetch(CONFIG.API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ fn: fn, args: args || [] }),
      signal: controller.signal
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || "Failed to load data.");
    return json.data;
  } catch (e) {
    if (e.name === "AbortError") throw new Error("The server is taking too long. Please try again.");
    throw e;
  } finally {
    clearTimeout(timer);
    trackRequest(-1);
  }
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
  document.getElementById("guestClose").addEventListener("click", closeGuest);
  document.getElementById("guestModal").addEventListener("click", function (e) {
    if (e.target.id === "guestModal") closeGuest();
  });
  document.getElementById("editSave").addEventListener("click", saveForm);
  document.getElementById("editDelete").addEventListener("click", deleteForm);
  document.getElementById("editForm").addEventListener("change", onFormChange);
  document.getElementById("editModal").addEventListener("click", function (e) {
    if (e.target.id === "editModal") closeForm();
  });

  if (!sessionToken) return showLogin();
  document.getElementById("boot").classList.remove("hidden");

  try {
    const sess = await api("checkSession", [sessionToken]);
    if (sess.ok) enterApp(sess);
    else endSession();
  } catch (e) {
    endSession();
  }
});

/* ---------- LOGIN ---------- */

/** Foto dari HR kalau ada, kalau tidak inisial nama. */
function renderAvatar(photo) {
  const el = document.getElementById("userAvatar");
  el.innerHTML = photo
    ? '<img src="' + esc(photo) + '" alt="">'
    : esc(initials(currentName));
}

function hideBoot() {
  document.getElementById("boot").classList.add("hidden");
}

function showLogin() {
  hideBoot();
  document.getElementById("loginScreen").classList.remove("hidden");
  document.getElementById("appShell").classList.add("hidden");
  document.getElementById("loginPin").value = "";
}

function enterApp(user) {
  hideBoot();
  currentName = user.name || "";
  currentNickname = user.nickname || "";
  currentCanEdit = !!user.canEdit;
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("appShell").classList.remove("hidden");
  document.getElementById("userName").innerText = currentName;
  document.getElementById("userTier").innerText = user.jobTitle || "";
  renderAvatar(user.photo);
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
    err.innerText = "NIK and PIN are required.";
    return;
  }

  setBusy(btn, true, "Checking...");

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
    err.innerText = "Connection failed: " + e.message;
  } finally {
    setBusy(btn, false);
  }
}

function doLogout() {
  if (sessionToken) api("logout", [sessionToken]).catch(function () {});
  endSession();
}

function endSession() {
  sessionToken = null;
  currentName = "";
  currentNickname = "";
  currentCanEdit = false;
  writeStore_("rsh_token", null);
  appData = null;
  closeForm();
  showLogin();
}

/** Sheets that may be missing from the backend response are treated as empty. */
const DATA_KEYS = ["importantInfo", "upsell", "bulletin", "inspiration", "food", "beverage", "sop", "teams", "about", "guests", "academy"];

function withDefaults(data) {
  const out = Object.assign({}, data);
  DATA_KEYS.forEach(k => { if (!Array.isArray(out[k])) out[k] = []; });
  return out;
}

let loadHintTimer = null;

async function loadData() {
  renderTab();   // shows the skeleton right away while data is loading
  clearTimeout(loadHintTimer);
  loadHintTimer = setTimeout(function () {
    const hint = document.getElementById("loadHint");
    if (hint) hint.innerText = "Still loading. The first load after a while can take a few seconds.";
  }, 4000);
  try {
    appData = withDefaults(await api("getAppData", [sessionToken]));
    renderTab();
  } catch (e) {
    handleApiError(e);
    if (!appData) showLoadError(e.message);
  } finally {
    clearTimeout(loadHintTimer);
  }
}

function skeletonHtml() {
  return '<div aria-busy="true" aria-label="Loading data">' +
    '<div class="skeleton tall"></div>' +
    '<div class="skeleton"></div>' +
    '<div class="skeleton"></div>' +
    '<div class="skeleton"></div>' +
    '<p id="loadHint" class="muted small center"></p>' +
    '</div>';
}

function showLoadError(message) {
  document.getElementById("app").innerHTML =
    '<div class="empty">' + esc(message || "Failed to load data.") +
    '<br><button class="ghost" type="button" onclick="retryLoad()">Try again</button></div>';
}

function retryLoad() {
  renderTab();
  loadData();
}

/** Sesi habis: pesan dari backend mengandung SESSION_EXPIRED. */
function isSessionExpired(e) {
  return String(e && e.message).indexOf("SESSION_EXPIRED") !== -1;
}

function handleApiError(e) {
  if (isSessionExpired(e)) {
    toast("Your session has expired. Please log in again.");
    endSession();
  } else {
    toast("Failed to load data: " + e.message);
  }
}

/* ---------- NAVIGASI ---------- */

function renderTabbar() {
  document.getElementById("tabbar").innerHTML = TABS.map(function (t) {
    const inner = t.icon ? '<span class="nav-icon">' + t.icon + '</span>' : esc(t.label);
    return '<button class="tab' + (t.key === activeTab ? ' active' : '') +
      '" type="button" aria-label="' + esc(t.label) + '" onclick="showTab(\'' + t.key + '\')">' + inner + '</button>';
  }).join("");
}

function showTab(key) {
  activeTab = key;
  guestsLanding = false;
  bulletinLanding = false;
  searchText = "";
  renderTabbar();
  renderTab();
  window.scrollTo(0, 0);
}

function renderTab() {
  const app = document.getElementById("app");
  if (!appData) {
    app.innerHTML = skeletonHtml();
    return;
  }

  try {
    app.innerHTML = renderActiveView();
  } catch (e) {
    console.error(e);
    app.innerHTML = '<div class="empty">Something went wrong while showing this page.<br><small>' + esc(e.message) + '</small></div>';
  }
}

function renderActiveView() {
  if (guestsLanding) return viewGuestsLanding();
  if (bulletinLanding) return viewBulletinLanding();

  let html = "";
  if (activeTab === "home")          html = viewHome();
  else if (activeTab === "food")     html = viewSearchable("food");
  else if (activeTab === "beverage") html = viewSearchable("beverage");
  else if (activeTab === "sop")      html = viewSearchable("sop");
  else if (activeTab === "teams")    html = viewTeams();
  else if (activeTab === "academy")  html = viewSearchable("academy");
  else if (activeTab === "about")    html = viewAbout();

  return html;
}

/* ---------- HOME ---------- */

function viewHome() {
  const quotes = appData.inspiration.filter(r => r.greeting === dayPart().key);
  const quote = quotes.length ? quotes[new Date().getDate() % quotes.length] : null;
  const guests = newestFirst(appData.guests.filter(isActive)).slice(0, GUEST_HOME_LIMIT);
  const news = newestFirst(appData.bulletin.filter(isActive)).slice(0, BULLETIN_HOME_LIMIT);

  return '<section class="hero">' +
      '<div class="hero-greet">Good ' + dayPart().word + '</div>' +
      '<div class="hero-name">' + esc(greetingName()) + '</div>' +
      (quote
        ? '<p class="hero-quote">“' + esc(quote.quote) + '”</p>' +
          '<cite class="hero-cite">— ' + esc(quote.author) + '</cite>' +
          editBtn("inspiration", quote)
        : '') +
      addBtn("inspiration", "+ Quote") +
    '</section>' +

    '<div class="home-grid">' +
      homeCol("Our Guests", "guests",
        guests.length ? guests.map(guestCard).join("") : emptyState("No active guest notes."),
        '<button class="ghost small-link" type="button" onclick="openGuestsLanding()">View all</button>') +
      homeCol("Upsell Today", "upsell", upsellPanel()) +
      homeCol("Staff Bulletin", "bulletin",
        news.length ? news.map(bulletinCard).join("") : emptyState("No active bulletin yet."),
        '<button class="ghost small-link" type="button" onclick="openBulletinLanding()">View all</button>') +
    '</div>';
}

/** Satu kolom di Home: judul + tombol tambah, lalu isinya. */
function homeCol(title, sheetKey, body, extra) {
  return '<section class="home-col">' + sectionHead(title, sheetKey, extra) + body + '</section>';
}

/** Shift yang sedang berjalan sekarang, atau null kalau tidak ada yang cocok. */
function currentShift() {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  let best = null;
  let bestStart = -1;
  SHIFT_NAMES.forEach(name => {
    const [h, m] = SHIFT_START[name].split(":").map(Number);
    const start = h * 60 + m;
    if (start <= minutes && start > bestStart) { best = name; bestStart = start; }
  });
  return best;
}

/**
 * Upsell for today, grouped by shift. The shift running now is shown first and marked "Now".
 */
function upsellPanel() {
  const rows = appData.upsell.filter(r => isToday(r.date));
  if (!rows.length) return emptyState("No upsell for today.");

  const now = currentShift();
  const rank = name => (SHIFT_NAMES.indexOf(name) === -1 ? 99 : SHIFT_NAMES.indexOf(name));  // urut sesuai SHIFT_START
  const names = rows.map(r => r.shift || "")
    .filter((x, i, arr) => arr.indexOf(x) === i)
    .sort((a, b) => ((b === now) - (a === now)) || (rank(a) - rank(b)));

  return names.map(name => {
    const group = rows.filter(r => (r.shift || "") === name);
    const isNow = name === now;
    return '<div class="card upsell-session' + (isNow ? ' now' : '') + '">' +
      '<div class="row-between"><strong>' + esc(name || "No shift") + '</strong>' +
        '<span>' +
          (group[0].sesi ? '<span class="badge">' + esc(group[0].sesi) + '</span> ' : '') +
          (isNow ? '<span class="badge now-badge">Now</span>' : '') +
        '</span></div>' +
      group.map(r =>
        '<div class="upsell-line"><span>' + esc(r.item) + '</span>' +
        '<span class="price">' + esc(r.target) + ' ' + esc(r.satuan) + '</span>' +
        editBtn("upsell", r) + '</div>'
      ).join("") +
    '</div>';
  }).join("");
}

function bulletinCard(r) {
  return '<div class="note' + inactiveClass(r) + '"><div class="note-body">' +
    '<div class="small muted">' + esc(r.date) + (r.type ? ' · ' + esc(r.type) : '') + statusBadge(r) + '</div>' +
    '<div class="note-title">' + esc(r.title) + '</div>' +
    '<p class="pre muted">' + esc(r.description) + '</p>' +
    editBtn("bulletin", r) + '</div></div>';
}

/** Bagian hari: kunci untuk kutipan harian dan kata sapaan. */
function dayPart() {
  const h = new Date().getHours();
  if (h < 11) return { key: "Morning", word: "morning" };
  if (h < 15) return { key: "Afternoon", word: "afternoon" };
  if (h < 19) return { key: "Evening", word: "evening" };
  return { key: "Night", word: "night" };
}

/* ---------- MENU / SOP / ACADEMY (ada pencarian) ---------- */

function viewSearchable(sheetKey) {
  return sectionHead(SHEET_LABELS[sheetKey], sheetKey) +
    '<input class="input search" type="search" placeholder="Search..." value="' + esc(searchText) +
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

/** Kelompokkan item per field, judul kelompok di atas, isi dari renderBody. */
function grouped(items, field, renderBody) {
  return groupBy(items, field).map(g =>
    '<h3 class="group">' + esc(g.key) + '</h3>' + renderBody(g.items)
  ).join("");
}

function menuList(rows, sheetKey) {
  const items = rows.filter(r => r.name && matches([r.category, r.name, r.description]));
  if (!items.length) return emptyState("No matching menu items.");
  return grouped(items, "category", list =>
    '<div class="grid">' + list.map(r => menuCard(r, sheetKey)).join("") + '</div>');
}

function menuCard(r, sheetKey) {
  return '<article class="tile">' +
    (r.image
      ? '<img class="tile-img" src="' + imgUrl(r.image) + '" alt="" loading="lazy">'
      : '<div class="tile-img placeholder">' + esc(initial(r.name)) + '</div>') +
    '<div class="tile-body">' +
      '<div class="tile-head"><h3>' + esc(r.name) + '</h3>' +
      '<span class="price">Rp ' + esc(r.price) + '</span></div>' +
      '<p class="muted small pre">' + esc(r.description) + '</p>' +
      (r.allergens ? '<span class="allergen">Allergen: ' + esc(r.allergens) + '</span>' : '') +
      editBtn(sheetKey, r) +
    '</div>' +
  '</article>';
}

function sopList() {
  const items = appData.sop.filter(r => r.name && r.file && matches([r.category, r.name, r.description]));
  if (!items.length) return emptyState("No matching SOPs.");
  return grouped(items, "category", list => list.map(sopRow).join(""));
}

function sopRow(r) {
  return '<div class="row">' +
    '<a class="row-main" target="_blank" rel="noopener" href="https://drive.google.com/file/d/' +
      encodeURIComponent(r.file) + '/view">' +
      '<strong>' + esc(r.name) + '</strong>' +
      '<span class="small muted">Update: ' + esc(r.updated) + '</span>' +
    '</a>' +
    '<span class="chev">›</span>' +
    editBtn("sop", r) +
  '</div>';
}

function academyList() {
  const items = appData.academy.filter(r => r.title && matches([r.category, r.title, r.shortDesc]));
  if (!items.length) return emptyState("No matching materials.");
  return grouped(items, "category", list =>
    '<div class="grid two">' + list.map(academyCard).join("") + '</div>');
}

function academyCard(r) {
  return '<article class="card">' +
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
      (r.video ? '<a class="btn small" target="_blank" rel="noopener" href="' + esc(r.video) + '">Watch video</a>' : '') +
      (r.fullLink ? '<a class="btn small outline" target="_blank" rel="noopener" href="' + esc(r.fullLink) + '">Read material</a>' : '') +
    '</div>' +
    editBtn("academy", r) +
  '</article>';
}

/* ---------- TEAMS / GUESTS / ABOUT ---------- */

function viewTeams() {
  const rows = appData.teams.filter(r => r.name);
  return sectionHead(SHEET_LABELS.teams, "teams") +
    (rows.length
      ? grouped(rows, "department", list => '<div class="grid">' + list.map(personCard).join("") + '</div>')
      : emptyState("No team data yet."));
}

function personCard(r) {
  return '<div class="person">' +
    (r.image
      ? '<img class="person-photo" src="' + imgUrl(r.image) + '" alt="" loading="lazy">'
      : '<div class="person-photo initials">' + esc(initials(r.name)) + '</div>') +
    '<div class="person-name">' + esc(r.name) + '</div>' +
    '<div class="muted">' + esc(r.position) + '</div>' +
    (r.phone
      ? '<a class="pill" target="_blank" rel="noopener" href="https://wa.me/' + esc(r.phone.replace(/\D/g, "")) + '">WhatsApp</a>'
      : '') +
    editBtn("teams", r) +
  '</div>';
}

/** Sapaan: nickname dari HR, kalau kosong pakai nama depan. */
function greetingName() {
  return currentNickname || firstName(currentName);
}

/**
 * Waktu tamu dari teks tanggal sheet ("18 Sep" atau "18 Sep 2026").
 * Tanpa tahun, dianggap tahun ini; kalau hasilnya di masa depan, tahun lalu.
 */
function guestTime(r) {
  const m = String(r.date || "").trim().match(/^(\d{1,2})\s+([A-Za-z]{3})[a-z]*(?:\s+(\d{4}))?$/);
  if (!m) return 0;
  const mi = monthIndex(m[2]);
  if (mi === -1) return 0;
  const now = new Date();
  let t = new Date(m[3] ? Number(m[3]) : now.getFullYear(), mi, Number(m[1])).getTime();
  if (!m[3] && t > now.getTime() + 86400000) t = new Date(now.getFullYear() - 1, mi, Number(m[1])).getTime();
  return t;
}

/**
 * Urutan tamu: tanggal (terbaru dulu, atau terlama dulu), lalu nama A-Z kalau tanggalnya sama.
 * Tanggal yang tidak terbaca (0) ikut urutan terlama.
 */
function compareGuests(a, b, newest) {
  const byDate = newest ? guestTime(b) - guestTime(a) : guestTime(a) - guestTime(b);
  if (byDate) return byDate;
  return String(a.guest).localeCompare(String(b.guest), "id", { sensitivity: "base" });
}

/** Terbaru di atas. Tanggal yang tidak terbaca ditaruh paling bawah. */
function newestFirst(rows) {
  return rows.slice().sort((a, b) => compareGuests(a, b, true));
}

/** Potongan teks sepanjang n karakter, diberi "…" kalau dipotong. */
function clipText(text, n) {
  return text.length > n ? text.slice(0, n).trimEnd() + "…" : text;
}

/**
 * Kartu tamu di Home. Potongan catatan 50 karakter di HP dan 80 di desktop (diatur CSS).
 * Read more hanya membuka teks di tempat, tidak membuka pop-up.
 */
function guestCard(r) {
  const text = String(r.description || "");
  const phoneMore = text.length > GUEST_PREVIEW_PHONE;
  const desktopMore = text.length > GUEST_PREVIEW_DESKTOP;
  return '<div class="note guest' + inactiveClass(r) + '">' +
    '<div class="guest-card-head">' +
      (r.image
        ? '<img class="guest-card-photo" src="' + imgUrl(r.image) + '" alt="" loading="lazy">'
        : '<div class="guest-card-photo gph">' + esc(initial(r.guest)) + '</div>') +
      '<div class="guest-card-main">' +
        '<strong>' + esc(r.guest) + '</strong>' +
        '<span class="small muted">' + esc(r.date) + (r.title ? ' · ' + esc(r.title) : '') + '</span>' +
      '</div>' +
    '</div>' +
    '<div class="guest-card-side">' +
      (text
        ? '<p class="guest-card-text">' +
            '<span class="gc-s">' + esc(clipText(text, GUEST_PREVIEW_PHONE)) + '</span>' +
            '<span class="gc-m">' + esc(clipText(text, GUEST_PREVIEW_DESKTOP)) + '</span>' +
            '<span class="gc-full">' + esc(text) + '</span>' +
          '</p>'
        : '') +
      '<div class="guest-card-actions">' +
        (phoneMore ? '<button class="more more-s" type="button" onclick="toggleGuestText(this)">Read more</button>' : '') +
        (desktopMore ? '<button class="more more-m" type="button" onclick="toggleGuestText(this)">Read more</button>' : '') +
        editBtn("guests", r) +
      '</div>' +
    '</div>' +
  '</div>';
}

/** Buka atau tutup teks catatan di dalam kartu. */
function toggleGuestText(btn) {
  const card = btn.closest(".guest");
  const open = card.classList.toggle("open");
  card.querySelectorAll(".more").forEach(b => { b.innerText = open ? "Show less" : "Read more"; });
}

/** Detail tamu: foto besar dan catatan lengkap. */
function openGuest(row) {
  const r = (appData.guests || []).find(x => x._row === row);
  if (!r) return toast("This data no longer exists. Refresh first.");
  document.getElementById("guestBody").innerHTML =
    (r.image ? '<img class="guest-hero" src="' + imgUrl(r.image) + '" alt="' + esc(r.guest) + '">' : '') +
    '<div class="row-between"><strong class="guest-name">' + esc(r.guest) + '</strong>' +
      '<span class="badge">' + esc(r.category) + '</span></div>' +
    '<div class="small muted">' + esc(r.date) + (r.title ? ' · ' + esc(r.title) : '') + '</div>' +
    '<p class="pre guest-full">' + esc(r.description) + '</p>' +
    editBtn("guests", r);
  document.getElementById("guestModal").classList.remove("hidden");
}

function closeGuest() {
  const modal = document.getElementById("guestModal");
  if (modal) modal.classList.add("hidden");
}

/* ---------- OUR GUESTS: halaman lengkap ---------- */

function openGuestsLanding() {
  guestsLanding = true;
  guestFilter = { q: "", cat: -1, sort: "newest", view: "grid", status: "all", shown: GUESTS_PAGE_SIZE };
  renderTab();
  window.scrollTo(0, 0);
}

function viewGuestsLanding() {
  return '<div class="gl-head">' +
      '<button class="ghost" type="button" onclick="showTab(\'home\')">← Back</button>' +
      '<h2 class="section-title">Our Guests</h2>' +
      addBtn("guests", "+ Add") +
    '</div>' +
    '<div class="gl-chips" id="glChips">' + guestChips() + '</div>' +
    '<div class="gl-toolbar">' +
      '<input class="input gl-search" type="search" placeholder="Search name, notes..." value="' + esc(guestFilter.q) +
        '" oninput="guestSearch(this.value)">' +
      '<select class="input gl-sort" onchange="guestSort(this.value)">' +
        [["newest", "Newest"], ["oldest", "Oldest"], ["name-asc", "Name A-Z"], ["name-desc", "Name Z-A"]]
          .map(o => '<option value="' + o[0] + '"' + (guestFilter.sort === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join("") +
      '</select>' +
      (canEdit()
        ? '<select class="input gl-status" aria-label="Filter by status" onchange="guestStatus(this.value)">' +
            [["all", "All status"], ["active", "Active"], ["inactive", "Inactive"]].map(o =>
              '<option value="' + o[0] + '"' + (guestFilter.status === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'
            ).join("") +
          '</select>'
        : '') +
      '<div class="seg">' +
        '<button type="button" class="' + (guestFilter.view === "grid" ? "on" : "") + '" aria-label="Grid view" onclick="guestView(\'grid\')">▦</button>' +
        '<button type="button" class="' + (guestFilter.view === "list" ? "on" : "") + '" aria-label="List view" onclick="guestView(\'list\')">☰</button>' +
      '</div>' +
    '</div>' +
    '<div id="glList">' + guestListHtml() + '</div>';
}

/** Pilihan kategori: "Semua" plus kategori dari data. Pilihan dikirim sebagai nomor, bukan teks. */
function guestCategories() {
  return GUEST_CATEGORIES.slice();
}

function guestChips() {
  const cats = guestCategories();
  const visible = guestBaseRows();
  const chip = (idx, label, n) =>
    '<button type="button" class="chip-btn' + (guestFilter.cat === idx ? ' on' : '') +
      '" onclick="guestCategory(' + idx + ')">' + esc(label) + '<span>' + n + '</span></button>';
  return chip(-1, "All", visible.length) +
    cats.map((c, i) => chip(i, c, visible.filter(r => r.category === c).length)).join("");
}

/** Tamu yang boleh dilihat, lalu dipersempit status. Dipakai daftar dan hitungan chip kategori. */
function guestBaseRows() {
  const rows = appData.guests.filter(showItem);
  if (guestFilter.status === "active") return rows.filter(isActive);
  if (guestFilter.status === "inactive") return rows.filter(r => !isActive(r));
  return rows;
}

function guestListHtml() {
  const cats = guestCategories();
  let rows = guestBaseRows();
  if (guestFilter.cat >= 0) rows = rows.filter(r => r.category === cats[guestFilter.cat]);
  const q = guestFilter.q.trim().toLowerCase();
  if (q) rows = rows.filter(r => [r.guest, r.title, r.description, r.category].join(" ").toLowerCase().indexOf(q) !== -1);
  rows = sortGuests(rows, guestFilter.sort);

  if (!rows.length) return emptyState("No matching guests.");

  const shown = rows.slice(0, guestFilter.shown);
  const body = guestFilter.view === "grid"
    ? '<div class="guest-grid">' + shown.map(guestTile).join("") + '</div>'
    : '<div class="guest-list">' + shown.map(guestLine).join("") + '</div>';
  const more = rows.length > shown.length
    ? '<button class="btn outline" type="button" onclick="guestMore()">Show more</button>'
    : '';
  return body +
    '<div class="gl-more"><p class="muted small">Showing ' + shown.length + ' of ' + rows.length + ' guests</p>' + more + '</div>';
}

function sortGuests(rows, mode) {
  if (mode === "oldest") return rows.slice().sort((a, b) => compareGuests(a, b, false));
  if (mode === "name-asc") return rows.slice().sort((a, b) => String(a.guest).localeCompare(String(b.guest), "id", { sensitivity: "base" }));
  if (mode === "name-desc") return rows.slice().sort((a, b) => String(b.guest).localeCompare(String(a.guest), "id", { sensitivity: "base" }));
  return newestFirst(rows);
}

function guestPhoto(r, cls) {
  return r.image
    ? '<img class="' + cls + '" src="' + imgUrl(r.image) + '" alt="" loading="lazy">'
    : '<div class="' + cls + ' gph">' + esc(initial(r.guest)) + '</div>';
}

function guestTile(r) {
  return '<button class="guest-tile' + inactiveClass(r) + '" type="button" onclick="openGuest(' + r._row + ')">' +
    guestPhoto(r, "guest-tile-img") +
    '<div class="guest-tile-body"><strong>' + esc(r.guest) + '</strong>' +
      '<span class="badge">' + esc(r.category) + '</span>' + statusBadge(r) +
      '<span class="small muted">' + esc(r.date) + '</span></div>' +
  '</button>';
}

function guestLine(r) {
  return '<button class="guest-line' + inactiveClass(r) + '" type="button" onclick="openGuest(' + r._row + ')">' +
    guestPhoto(r, "guest-line-img") +
    '<span class="guest-line-body"><strong>' + esc(r.guest) + '</strong>' +
      '<span class="small muted">' + esc(r.category) + ' · ' + esc(r.date) + '</span></span>' +
    statusBadge(r) +
    '<span class="chev">›</span>' +
  '</button>';
}

function guestSearch(value) {
  guestFilter.q = value;
  guestFilter.shown = GUESTS_PAGE_SIZE;
  document.getElementById("glList").innerHTML = guestListHtml();
}

function guestCategory(idx) {
  guestFilter.cat = idx;
  guestFilter.shown = GUESTS_PAGE_SIZE;
  renderTab();
}

function guestSort(mode) {
  guestFilter.sort = mode;
  guestFilter.shown = GUESTS_PAGE_SIZE;
  renderTab();
}

function guestStatus(mode) {
  guestFilter.status = mode;
  guestFilter.shown = GUESTS_PAGE_SIZE;
  renderTab();
}

function guestView(mode) {
  guestFilter.view = mode;
  renderTab();
}

function guestMore() {
  guestFilter.shown += GUESTS_PAGE_SIZE;
  renderTab();
}

/* ---------- STAFF BULLETIN: halaman lengkap (kalender dan daftar) ---------- */

const BULLETIN_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const BULLETIN_WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function openBulletinLanding() {
  bulletinLanding = true;
  bulletinView = window.matchMedia("(min-width: 900px)").matches ? "calendar" : "list";
  bulletinMonth = null;
  bulletinDay = null;
  bulletinShown = GUESTS_PAGE_SIZE;
  renderTab();
  window.scrollTo(0, 0);
}

/** Bulletin aktif saja, terbaru di atas. Dipakai kalender dan daftar. */
function activeBulletins() {
  return newestFirst(appData.bulletin.filter(isActive));
}

function bulletinColor(type) {
  return BULLETIN_COLORS[type] || "neutral";
}

function viewBulletinLanding() {
  return '<div class="gl-head">' +
      '<button class="ghost" type="button" onclick="showTab(\'home\')">← Back</button>' +
      '<h2 class="section-title">Staff Bulletin</h2>' +
      addBtn("bulletin", "+ Add") +
    '</div>' +
    '<div class="bl-legend">' + BULLETIN_TYPES.map(t =>
      '<span class="bl-tag ' + bulletinColor(t) + '">' + esc(t) + '</span>').join("") + '</div>' +
    '<div class="gl-toolbar">' +
      '<div class="seg" role="group" aria-label="View">' +
        [["calendar", "Calendar"], ["list", "List"]].map(o =>
          '<button type="button" class="' + (bulletinView === o[0] ? "on" : "") + '" onclick="bulletinSetView(\'' + o[0] + '\')">' + o[1] + '</button>'
        ).join("") +
      '</div>' +
    '</div>' +
    (bulletinView === "calendar" ? bulletinCalendarHtml() : bulletinListHtml());
}

function bulletinSetView(mode) {
  bulletinView = mode;
  renderTab();
}

function bulletinCalendarHtml() {
  const now = new Date();
  if (!bulletinMonth) bulletinMonth = { y: now.getFullYear(), m: now.getMonth() };
  const y = bulletinMonth.y;
  const m = bulletinMonth.m;
  const todayIso = isoDate(now);

  const byDay = {};
  activeBulletins().forEach(r => {
    const iso = isoFromSheetDate(r.date);
    if (iso) (byDay[iso] = byDay[iso] || []).push(r);
  });

  const lead = (new Date(y, m, 1).getDay() + 6) % 7;   // minggu mulai Senin
  const days = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push('<span class="bc-cell bc-empty"></span>');
  for (let d = 1; d <= days; d++) {
    const iso = y + "-" + pad2(m + 1) + "-" + pad2(d);
    const list = byDay[iso] || [];
    const dots = Array.from(new Set(list.map(r => bulletinColor(r.type))))
      .map(c => '<i class="bc-dot ' + c + '"></i>').join("");
    const classes = "bc-cell" + (iso === todayIso ? " bc-today" : "") + (iso === bulletinDay ? " bc-picked" : "");
    cells.push('<button type="button" class="' + classes + '"' + (list.length ? ' onclick="bulletinPick(\'' + iso + '\')"' : ' disabled') + '>' +
      '<span>' + d + '</span><span class="bc-dots">' + dots + '</span></button>');
  }

  const dayItems = bulletinDay ? (byDay[bulletinDay] || []) : [];
  return '<div class="bc-head">' +
      '<button class="ghost small" type="button" aria-label="Previous month" onclick="bulletinMonthStep(-1)">‹</button>' +
      '<strong>' + BULLETIN_MONTHS[m] + ' ' + y + '</strong>' +
      '<button class="ghost small" type="button" aria-label="Next month" onclick="bulletinMonthStep(1)">›</button>' +
    '</div>' +
    '<div class="bc-week">' + BULLETIN_WEEKDAYS.map(w => '<span>' + w + '</span>').join("") + '</div>' +
    '<div class="bc-grid">' + cells.join("") + '</div>' +
    (bulletinDay
      ? '<div class="bc-day-title">' + esc(formatSheetDate(new Date(bulletinDay + "T00:00:00"))) + '</div>' +
        (dayItems.length ? dayItems.map(bulletinItem).join("") : emptyState("Nothing on this day."))
      : '<p class="muted small bc-hint">Tap a date with a dot to see its items.</p>');
}

function bulletinMonthStep(delta) {
  const base = bulletinMonth || { y: new Date().getFullYear(), m: new Date().getMonth() };
  const d = new Date(base.y, base.m + delta, 1);
  bulletinMonth = { y: d.getFullYear(), m: d.getMonth() };
  bulletinDay = null;
  renderTab();
}

function bulletinPick(iso) {
  bulletinDay = bulletinDay === iso ? null : iso;
  renderTab();
}

function bulletinListHtml() {
  const items = activeBulletins();
  if (!items.length) return emptyState("No active bulletin yet.");
  const shown = items.slice(0, bulletinShown);
  return '<div class="bl-list">' + shown.map(bulletinItem).join("") + '</div>' +
    (items.length > shown.length
      ? '<div class="gl-more"><button class="btn outline" type="button" onclick="bulletinMore()">Show more</button></div>'
      : '');
}

function bulletinMore() {
  bulletinShown += GUESTS_PAGE_SIZE;
  renderTab();
}

/** Satu item bulletin, dipakai di kalender (per hari) dan di daftar. Read more hanya membuka teks di tempat. */
function bulletinItem(r) {
  const text = String(r.description || "");
  const more = text.length > 80;
  const color = bulletinColor(r.type);
  return '<div class="bl-item ' + color + '">' +
    '<div class="bl-meta"><span class="bl-tag ' + color + '">' + esc(r.type || "Info") + '</span>' +
      '<span class="small muted">' + esc(r.date) + '</span></div>' +
    '<div class="note-title">' + esc(r.title) + '</div>' +
    (text
      ? '<p class="bl-text"><span class="bl-short">' + esc(clipText(text, 80)) + '</span><span class="bl-full">' + esc(text) + '</span></p>'
      : '') +
    '<div class="bl-actions">' +
      (more ? '<button class="more" type="button" onclick="toggleBulletinText(this)">Read more</button>' : '') +
      editBtn("bulletin", r) +
    '</div>' +
  '</div>';
}

function toggleBulletinText(btn) {
  const item = btn.closest(".bl-item");
  const open = item.classList.toggle("open");
  btn.innerText = open ? "Show less" : "Read more";
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
      : emptyState("No information yet."));
}

/**
 * Item aktif tampil biasa. Item nonaktif (hanya ada untuk editor) dilipat
 * dalam satu bagian tertutup supaya daftar utama tidak panjang.
 */
function listWithInactive(rows, renderItem) {
  const active = rows.filter(isActive);
  const inactive = rows.filter(r => !isActive(r));
  const activeHtml = active.map(renderItem).join("");
  if (!inactive.length) return activeHtml;
  return activeHtml +
    '<details class="inactive-group"><summary>Inactive (' + inactive.length + ')</summary>' +
    inactive.map(renderItem).join("") + '</details>';
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
/** Tanggal baris (format sheet, misalnya "20 Oct 2026") sama dengan hari ini? */
function isToday(sheetDate) {
  return isoFromSheetDate(sheetDate) === isoDate(new Date());
}

/** Satu definisi "aktif". Semua pengecekan status lewat sini. */
function isActive(rec) {
  return rec.status === "ACTIVE";
}

function showItem(rec) {
  return currentCanEdit || isActive(rec);
}

function inactiveClass(rec) {
  return isActive(rec) ? "" : " is-inactive";
}

/** Label "Nonaktif" hanya untuk editor. Staff tidak pernah melihat item nonaktif. */
function statusBadge(rec) {
  if (!currentCanEdit || isActive(rec)) return "";
  return ' <span class="badge off">Inactive</span>';
}

function sectionHead(title, sheetKey, extra) {
  return '<div class="section-head"><h2 class="section-title">' + esc(title) + '</h2>' +
    (extra || "") + addBtn(sheetKey, "+ Add") + '</div>';
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
  showForm("Add " + SHEET_LABELS[sheetKey], blank, false);
}

function openEdit(sheetKey, row) {
  closeGuest();
  const rec = (appData[sheetKey] || []).find(r => r._row === row);
  if (!rec) return toast("This data no longer exists. Refresh first.");

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
  setFormBusy(false);
  const modal = document.getElementById("editModal");
  if (modal) modal.classList.add("hidden");
}

/** Disable both form buttons. The one that was clicked gets a spinner and its label. */
function setFormBusy(busy, activeId, label) {
  ["editSave", "editDelete"].forEach(id => { document.getElementById(id).disabled = busy; });
  if (busy && activeId) setBusy(document.getElementById(activeId), true, label);
  if (!busy) ["editSave", "editDelete"].forEach(id => setBusy(document.getElementById(id), false));
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
  if (f.input === "number") return '<input class="input" type="number" inputmode="numeric" min="0" ' + key + ' value="' + esc(v) + '">';
  if (f.input === "phone") return '<input class="input" type="tel" inputmode="numeric" ' + key + ' value="' + esc(v) + '" placeholder="628...">';
  if (f.input === "photo" || f.input === "pdf") return uploadHtml(f, v);
  if (f.input === "url") return '<input class="input" type="url" ' + key + ' value="' + esc(v) + '" placeholder="https://...">';
  if (f.input === "multi") return '<textarea class="input" rows="4" ' + key + '>' + esc(v) + '</textarea>';
  if (f.options || f.src) return selectHtml(sheetKey, f, v);
  return '<input class="input" type="text" ' + key + ' value="' + esc(v) + '">';
}

/** Dropdown. Kalau src, ada "+ New…" yang memunculkan kotak isian. */
function selectHtml(sheetKey, f, v) {
  let opts = optionList(sheetKey, f);
  if (v && opts.indexOf(v) === -1) opts = [v].concat(opts);   // nilai lama tetap tampil apa adanya

  const isNew = f.src && !v && opts.length === 0;
  const blank = !v && opts.length > 0 ? '<option value="" selected>— choose —</option>' : '';

  return '<select class="input" data-key="' + f.key + '">' + blank +
    opts.map(o => '<option value="' + esc(o) + '"' + (o === v ? ' selected' : '') + '>' + esc(o) + '</option>').join("") +
    (f.src ? '<option value="__new__"' + (isNew ? ' selected' : '') + '>+ New…</option>' : '') +
    '</select>' +
    (f.src ? '<input class="input new-input' + (isNew ? '' : ' hidden') + '" type="text" data-new-for="' + f.key + '" placeholder="Type a new value">' : '');
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

/** Kotak "+ New…" muncul hanya saat dipilih. */
function onFormChange(e) {
  if (e.target.matches && e.target.matches('input[type="file"][data-file]')) {
    onFileChosen(e.target);
    return;
  }
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
  if (f.input === "url") {
    const t = raw.trim();
    if (t && !/^https?:\/\//i.test(t)) throw new Error(f.label + " must start with https://");
    return t;
  }
  if (el.tagName === "SELECT" && raw === "__new__") {
    const box = document.querySelector('#editForm [data-new-for="' + f.key + '"]');
    const nv = box ? box.value.trim() : "";
    if (!nv) throw new Error("Enter a new value for " + f.label + ".");
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

  setFormBusy(true, "editSave", "Saving...");
  document.getElementById("editError").innerText = "";

  try {
    const newValues = readForm();
    if (mode === "add") {
      await api("addRow", [sessionToken, sheetKey, newValues]);
      toast("Added.");
    } else {
      const res = await api("updateRow", [sessionToken, sheetKey, row, oldValues, newValues]);
      toast(res.changed ? "Saved." : "No changes.");
    }
    closeForm();
    loadData();
  } catch (e) {
    formError(e);
  }
}

async function deleteForm() {
  if (!formState || formState.mode !== "edit") return;
  if (!confirm("Delete this row? Its content is logged in the changelog, but this cannot be undone in the app.")) return;

  const sheetKey = formState.sheetKey;
  const row = formState.row;
  const oldValues = withoutRow(formState.original);

  setFormBusy(true, "editDelete", "Deleting...");
  document.getElementById("editError").innerText = "";

  try {
    await api("deleteRow", [sessionToken, sheetKey, row, oldValues]);
    toast("Deleted.");
    closeForm();
    loadData();
  } catch (e) {
    formError(e);
  }
}

/* ---------- FORMAT & PARSE ---------- */

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Nama bulan yang boleh ada di sheet: Inggris atau Indonesia. Hanya untuk membaca, penulisan tetap Inggris. */
const MONTH_ALIASES = { jan: 0, feb: 1, mar: 2, apr: 3, mei: 4, may: 4, jun: 5, jul: 6, agu: 7, aug: 7, sep: 8, okt: 9, oct: 9, nov: 10, des: 11, dec: 11 };

/** Indeks bulan (0-11) dari nama di sheet. -1 kalau tidak dikenali. */
function monthIndex(name) {
  const k = String(name || "").toLowerCase();
  return Object.prototype.hasOwnProperty.call(MONTH_ALIASES, k) ? MONTH_ALIASES[k] : -1;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

/** Tanggal dalam format YYYY-MM-DD (untuk perbandingan). */
function isoDate(d) {
  return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
}

/** Format yang dipakai sheet: "5 Oct 2026". */
function formatSheetDate(d) {
  return d.getDate() + " " + MONTHS_EN[d.getMonth()] + " " + d.getFullYear();
}

/** Ubah "5 Oct 2026" jadi "2026-10-05" untuk date picker. Kosong kalau formatnya tidak dikenali. */
function isoFromSheetDate(v) {
  const m = String(v || "").trim().match(/^(\d{1,2}) ([A-Za-z]{3})[a-z]* (\d{4})$/);
  if (!m) return "";
  const mi = monthIndex(m[2]);
  if (mi === -1) return "";
  return m[3] + "-" + pad2(mi + 1) + "-" + pad2(Number(m[1]));
}

/* ---------- UPLOAD FOTO & PDF ---------- */

function uploadHtml(f, v) {
  const isPhoto = f.input === "photo";
  const preview = isPhoto && v
    ? '<img class="upload-preview" data-preview="' + f.key + '" src="' + imgUrl(v) + '" alt="">'
    : '<div class="upload-preview empty" data-preview="' + f.key + '">' + (isPhoto ? 'No photo yet' : 'No file yet') + '</div>';
  const note = !isPhoto
    ? '<div class="small muted" data-note="' + f.key + '">' + (v ? 'File already saved' : '') + '</div>'
    : '';

  return '<div class="upload">' + preview +
    '<input type="hidden" data-key="' + f.key + '" value="' + esc(v) + '">' +
    '<label class="btn small outline upload-btn">' + (v ? 'Change ' : 'Choose ') + (isPhoto ? 'photo' : 'PDF file') +
      '<input type="file" hidden data-file="' + f.key + '" accept="' + (isPhoto ? 'image/*' : 'application/pdf') + '">' +
    '</label>' +
    '<div class="small muted" data-status="' + f.key + '"></div>' + note +
  '</div>';
}

function findField(sheetKey, key) {
  return EDIT_FIELDS[sheetKey].find(f => f.key === key);
}

/** Foto dikecilkan di browser dulu (maks 1000 px, JPEG), supaya ringan diunggah. */
async function onFileChosen(input) {
  const f = findField(formState.sheetKey, input.dataset.file);
  const file = input.files && input.files[0];
  input.value = "";
  if (!f || !file) return;

  const isPhoto = f.input === "photo";
  const status = document.querySelector('[data-status="' + f.key + '"]');
  const hidden = document.querySelector('#editForm [data-key="' + f.key + '"]');

  if (isPhoto ? !file.type.startsWith("image/") : file.type !== "application/pdf") {
    status.innerText = isPhoto ? "Please choose an image file." : "Please choose a PDF file.";
    return;
  }

  setFormBusy(true);
  status.innerHTML = '<span class="mini-spinner"></span>Uploading...';
  try {
    let base64, mime, name;
    if (isPhoto) {
      base64 = (await resizeImage(file, 1000)).split(",")[1];
      mime = "image/jpeg";
      name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    } else {
      if (file.size > 5 * 1024 * 1024) throw new Error("File is too large. Maximum 5 MB.");
      base64 = await readAsBase64(file);
      mime = "application/pdf";
      name = file.name;
    }

    const res = await api("uploadFile", [sessionToken, base64, mime, name]);
    hidden.value = res.id;
    status.innerText = "Uploaded.";

    if (isPhoto) {
      document.querySelector('[data-preview="' + f.key + '"]').outerHTML =
        '<img class="upload-preview" data-preview="' + f.key + '" src="' + imgUrl(res.id) + '" alt="">';
    } else {
      document.querySelector('[data-note="' + f.key + '"]').innerText = "New file uploaded.";
    }
  } catch (e) {
    if (isSessionExpired(e)) {
      handleApiError(e);
      return;
    }
    status.innerText = e.message;
  } finally {
    setFormBusy(false);
  }
}

function resizeImage(file, maxSide) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Can't read this image. Try another photo (JPG or PNG)."));
    };
    img.src = url;
  });
}

function readAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(new Error("Can't read this file."));
    reader.readAsDataURL(file);
  });
}

function formError(e) {
  if (isSessionExpired(e)) {
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

/** Terima ID file Drive, atau link gambar langsung (misalnya dari HR). */
function imgUrl(id) {
  if (/^https?:\/\//.test(id)) return id;
  return "https://drive.google.com/thumbnail?id=" + encodeURIComponent(id) + "&sz=w400";
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
