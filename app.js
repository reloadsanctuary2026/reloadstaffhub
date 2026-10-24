/****************************************
 * RELOAD STAFF HUB — FRONTEND (GitHub Pages)
 * Version : see APP_VERSION (full Our Guests page: search, category filter, sort, grid/list)
 * Change history is in CHANGELOG.md
 ****************************************/

const APP_VERSION = "2.42.0";

const HOME_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>';

const TABS = [
  { key: "home",     label: "Home", icon: HOME_ICON },
  { key: "myupsell", label: "My Upsell", staffOnly: true },
  { key: "tracker",  label: "Upsell Tracker", editorsOnly: true },
  { key: "food",     label: "Food Bible" },
  { key: "beverage", label: "Beverage Bible" },
  { key: "sop",      label: "SOP" },
  { key: "teams",    label: "Our Teams" },
  { key: "academy",  label: "Reload Academy" },
  { key: "about",    label: "About Reload" }
];

/*
 * Form configuration. Each field has its own input type, so users do not have to type what can be picked
 * from a list:
 *   input: "date" | "today" | "price" | "phone" | "photo" | "pdf" | "url" | "multi" | "allergens"
 *          (empty = plain text)
 *   options: fixed list of choices
 *   src: true = choices taken from values already in the sheet, plus "+ New…"
 */
/* Same as the Status dropdown in the sheet. */
const STATUS_OPTIONS = ["ACTIVE", "NOT ACTIVE"];
const SESI_ORDER = ["Morning", "Afternoon", "Evening"];
const ALLERGEN_OPTIONS = ["Gluten", "Milk", "Egg", "Nut", "Seafood", "Soy"];
/* Logo per allergen (folder allergen/). Key = lowercase name, so old spellings like "Nuts" also get a logo. */
const ALLERGEN_ICON_FILES = {
  gluten: "allergen/gluten.png", milk: "allergen/milk.png", egg: "allergen/egg.png",
  nut: "allergen/nut.png", nuts: "allergen/nut.png", seafood: "allergen/seafood.png",
  soy: "allergen/soy.png", soybeans: "allergen/soy.png"
};
const DIFFICULTY_OPTIONS = ["Beginner", "Intermediate", "Advanced"];
const SECTION_OPTIONS = ["Company Story", "Vision", "Mission", "Identity & Essences", "Core Values"];
/* Guest categories. Same as GUEST_CATEGORIES in the backend (Code.gs). If one changes, change both. */
const GUEST_CATEGORIES = ["Birthday", "Preference", "VIP", "Farewell", "Celebration", "Achievement", "Complaint"];
/* Bulletin types now come from the 12_BulletinTypes tab (see DEFAULT_BULLETIN_TYPES below). */
/* Used when the 12_BulletinTypes tab is still empty. The real names and colors are set in that sheet. */
const DEFAULT_BULLETIN_TYPES = [
  { type: "Meeting", color: "#8FAA4B" },
  { type: "Internal Information", color: "#E0B43A" }
];

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
    { key: "type",        label: "Type", options: [], dynamicOptions: bulletinTypeNames },
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
    { key: "materials",   label: "Materials (one per line: Name | link)", input: "materials" },
    { key: "fullLink",    label: "Main material link (optional)", input: "url" },
    { key: "video",       label: "Video link (YouTube or Google Drive)", input: "url" },
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
let currentJobTitle = "";   // used to show My Upsell to servers only
let currentCanEdit = false;   // from the backend (canEditTier_), the single source of truth
let appData = null;
let activeTab = "home";
let searchText = "";
let guestsLanding = false;
let bulletinLanding = false;
let bulletinView = "list";
let bulletinMonth = null;   // { y, m } month currently shown in the calendar
let bulletinDay = null;     // "YYYY-MM-DD" day selected in the calendar
let bulletinShown = 0;   // set when the Staff Bulletin page is opened
const GUESTS_PAGE_SIZE = 12;
let guestFilter = { q: "", cat: -1, sort: "newest", view: "grid", status: "all", shown: GUESTS_PAGE_SIZE };
let formState = null;   // { mode: "add" | "edit", sheetKey, row, original }

/* ---------- API ---------- */

/**
 * Call the Apps Script backend. Uses text/plain so it does not trigger a CORS preflight.
 * Reply: { ok, data } or { ok:false, error }.
 */
const API_TIMEOUT_MS = 20000;
let pendingRequests = 0;

/** Thin loading bar at the top of the screen, shown while requests are running. */
function trackRequest(delta) {
  pendingRequests = Math.max(0, pendingRequests + delta);
  const bar = document.getElementById("progress");
  if (bar) bar.classList.toggle("hidden", pendingRequests === 0);
}

/** Button with a spinner and a temporary label. Used for actions that wait for the server. */
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

/* ---------- STORAGE (safe if the browser blocks it) ---------- */

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
  document.querySelectorAll(".app-version").forEach(function (el) { el.innerText = APP_VERSION; });
  document.getElementById("loginBtn").addEventListener("click", doLogin);
  document.getElementById("loginPin").addEventListener("keydown", function (e) {
    if (e.key === "Enter") doLogin();
  });
  document.getElementById("logoutBtn").addEventListener("click", doLogout);
  document.getElementById("editClose").addEventListener("click", closeForm);
  document.getElementById("guestClose").addEventListener("click", closeGuest);
  document.getElementById("detailClose").addEventListener("click", closeDetail);
  document.getElementById("detailModal").addEventListener("click", function (e) {
    if (e.target.id === "detailModal") closeDetail();
  });
  document.getElementById("photoModal").addEventListener("click", closePhoto);
  const appEl = document.getElementById("app");
  appEl.addEventListener("pointerdown", onRearrangePointerDown);
  appEl.addEventListener("click", onAppClickCapture, true);
  window.addEventListener("pointermove", onRearrangePointerMove);
  window.addEventListener("pointerup", onRearrangePointerUp);
  window.addEventListener("pointercancel", onRearrangePointerUp);
  document.getElementById("guestModal").addEventListener("click", function (e) {
    if (e.target.id === "guestModal") closeGuest();
  });
  document.getElementById("editSave").addEventListener("click", saveForm);
  document.getElementById("editDelete").addEventListener("click", deleteForm);
  document.getElementById("editForm").addEventListener("change", onFormChange);
  let backdropDown = false;
  const editModalEl = document.getElementById("editModal");
  editModalEl.addEventListener("pointerdown", function (e) {
    backdropDown = e.target.id === "editModal";
  });
  editModalEl.addEventListener("click", function (e) {
    if (e.target.id === "editModal" && backdropDown) closeForm();
    backdropDown = false;
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

/** Photo from HR if available, otherwise the name initials. */
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
  currentJobTitle = user.jobTitle || "";
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
  loadedKeys = {};
  loadedAt = {};
  fetchingTab = {};
  refreshing = {};
  tabCategory = {};
  closeForm();
  showLogin();
}

/** Sheets that may be missing from the backend response are treated as empty. */
const DATA_KEYS = ["importantInfo", "upsell", "bulletin", "inspiration", "food", "beverage", "sop", "teams", "about", "guests", "academy", "bulletinTypes"];

/* Data is loaded per section. Home loads at login. Each tab loads when opened, then is kept. */
const HOME_DATA = ["guests", "bulletin", "upsell", "inspiration", "bulletinTypes"];
const TAB_DATA = { food: ["food"], beverage: ["beverage"], sop: ["sop"], academy: ["academy"], teams: ["teams"], about: ["about"], tracker: ["upsell", "posMap"] };
const TAB_CATEGORY_FIELD = { food: "category", beverage: "category", sop: "category", academy: "category", teams: "department" };
let loadedKeys = {};
let loadedAt = {};        // last load time of each sheet (ms)
let fetchingTab = {};
let refreshing = {};
const STALE_MS = 60000;   // data older than this is re-checked silently
const PREFETCH_ORDER = ["food", "beverage", "sop", "teams", "academy", "about"];
const PREFETCH_DELAY_MS = 1500;
const PREFETCH_SLOW_MS = 6000;    // requests slower than this count as slow (a cold start can take several seconds)
const PREFETCH_SLOW_LIMIT = 2;    // two slow requests in a row: prefetch stops until the next login
let tabCategory = {};   // category selected per tab, "" = all
let tabView = {};       // view per tab: "grid" (cards) or "list" (rows)

/** Active view of each tab. SOP defaults to list because it is already rows. */
function viewOf(tab) {
  return tabView[tab] || (tab === "sop" ? "list" : "grid");
}

function withDefaults(data) {
  const out = Object.assign({}, data);
  DATA_KEYS.forEach(k => { if (!Array.isArray(out[k])) out[k] = []; });
  return out;
}

/** At login: Home data is loaded through renderTab, so a reset is enough here. */
function loadData() {
  loadedKeys = {};
  loadedAt = {};
  fetchingTab = {};
  appData = withDefaults({});
  renderTab();
}

/** Loads the data this tab needs, only what is missing. When done, the page is redrawn. */
function ensureTab(tab) {
  const keys = tab === "home" ? HOME_DATA : (TAB_DATA[tab] || []);
  const missing = keys.filter(k => !loadedKeys[k]);
  if (!missing.length || fetchingTab[tab]) return;
  fetchingTab[tab] = true;
  const hintTimer = setTimeout(function () {
    const hint = document.getElementById("loadHint");
    if (hint) hint.innerText = "Still loading. The first load after a while can take a few seconds.";
  }, 4000);
  api("getData", [sessionToken, missing])
    .then(function (data) {
      fetchingTab[tab] = false;
      clearTimeout(hintTimer);
      if (!appData) return;   // already logged out
      missing.forEach(function (k) {
        appData[k] = Array.isArray(data[k]) ? data[k] : [];
      });
      markLoaded(missing);
      if (tab === "home") setTimeout(prefetchTabs, PREFETCH_DELAY_MS);
      if (activeTab === tab) renderTab();
    })
    .catch(function (e) {
      fetchingTab[tab] = false;
      clearTimeout(hintTimer);
      handleApiError(e);
      if (activeTab === tab) showLoadError(e.message);
    });
}

function markLoaded(keys) {
  const now = Date.now();
  keys.forEach(function (k) {
    loadedKeys[k] = true;
    loadedAt[k] = now;
  });
}

/** Loads in the background, one at a time, so other tabs are ready when opened. Shows nothing. */
async function prefetchTabs() {
  let slowInARow = 0;
  for (const tab of PREFETCH_ORDER) {
    if (!appData) return;   // already logged out
    const keys = (TAB_DATA[tab] || []).filter(k => !loadedKeys[k]);
    if (!keys.length) continue;
    const started = Date.now();
    try {
      const data = await api("getData", [sessionToken, keys]);
      if (!appData) return;
      keys.forEach(function (k) {
        appData[k] = Array.isArray(data[k]) ? data[k] : [];
      });
      markLoaded(keys);
    } catch (e) {
      return;   // failed silently; the tab will load itself when opened
    }
    slowInARow = Date.now() - started > PREFETCH_SLOW_MS ? slowInARow + 1 : 0;
    if (slowInARow >= PREFETCH_SLOW_LIMIT) return;   // server is busy, stop for now
  }
}

/** Data that is old is re-checked silently. The page is redrawn only if the content changed. */
function refreshIfStale(tab) {
  const keys = tab === "home" ? HOME_DATA : (TAB_DATA[tab] || []);
  const old = keys.filter(k => loadedKeys[k] && Date.now() - (loadedAt[k] || 0) > STALE_MS);
  if (!old.length || refreshing[tab]) return;
  refreshing[tab] = true;
  const before = JSON.stringify(old.map(k => appData[k]));
  api("getData", [sessionToken, old])
    .then(function (data) {
      refreshing[tab] = false;
      if (!appData) return;
      old.forEach(function (k) {
        appData[k] = Array.isArray(data[k]) ? data[k] : [];
      });
      markLoaded(old);
      if (activeTab === tab && before !== JSON.stringify(old.map(k => appData[k]))) renderTab();
    })
    .catch(function () {
      refreshing[tab] = false;
    });
}

function dataReady(tab) {
  const keys = tab === "home" ? HOME_DATA : (TAB_DATA[tab] || []);
  return keys.every(k => loadedKeys[k]);
}

/** After a save or delete: reload only that sheet. */
async function refreshSheet(sheetKey) {
  try {
    const data = await api("getData", [sessionToken, [sheetKey]]);
    appData[sheetKey] = Array.isArray(data[sheetKey]) ? data[sheetKey] : [];
    markLoaded([sheetKey]);
  } catch (e) {
    handleApiError(e);
  }
  renderTab();
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
  fetchingTab = {};
  renderTab();
}

/** Session expired: the backend message contains SESSION_EXPIRED. */
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

/* ---------- NAVIGATION ---------- */

function renderTabbar() {
  document.getElementById("tabbar").innerHTML = TABS.filter(t => (!t.editorsOnly || canEdit()) && (!t.staffOnly || (!canEdit() && isServerTitle(currentJobTitle)))).map(function (t) {
    const inner = t.icon ? '<span class="nav-icon">' + t.icon + '</span>' : esc(t.label);
    return '<button class="tab' + (t.key === activeTab ? ' active' : '') +
      '" type="button" aria-label="' + esc(t.label) + '" onclick="showTab(\'' + t.key + '\')">' + inner + '</button>';
  }).join("");
}

function showTab(key) {
  activeTab = key;
  if (key === "myupsell") myUpsell = { recap: null, loading: false, date: "" };   // reload, so new saves show up
  if (key === "home") upsellSummary = null;                                          // reload yesterday's totals
  rearranging = false;
  guestsLanding = false;
  bulletinLanding = false;
  searchText = "";
  renderTabbar();
  renderTab();
  window.scrollTo(0, 0);
}

function renderTab() {
  const app = document.getElementById("app");
  if (!appData || !dataReady(activeTab)) {
    app.innerHTML = skeletonHtml();
    if (appData) ensureTab(activeTab);
    return;
  }

  try {
    app.innerHTML = renderActiveView();
  } catch (e) {
    console.error(e);
    app.innerHTML = '<div class="empty">Something went wrong while showing this page.<br><small>' + esc(e.message) + '</small></div>';
  }
  refreshIfStale(activeTab);
}

function renderActiveView() {
  if (guestsLanding) return viewGuestsLanding();
  if (bulletinLanding) return viewBulletinLanding();

  let html = "";
  if (activeTab === "home")          html = upsellSummaryHtml() + viewHome();
  else if (activeTab === "food")     html = viewSearchable("food");
  else if (activeTab === "beverage") html = viewSearchable("beverage");
  else if (activeTab === "sop")      html = viewSearchable("sop");
  else if (activeTab === "teams")    html = viewTeams();
  else if (activeTab === "academy")  html = viewSearchable("academy");
  else if (activeTab === "about")    html = viewAbout();
  else if (activeTab === "tracker")  html = viewTracker();
  else if (activeTab === "myupsell") html = viewMyUpsell();

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

/** One column on Home: title + add button, then its content. */
function homeCol(title, sheetKey, body, extra) {
  return '<section class="home-col">' + sectionHead(title, sheetKey, extra) + body + '</section>';
}

/** The shift running right now, or null if none matches. */
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
  const rank = name => (SHIFT_NAMES.indexOf(name) === -1 ? 99 : SHIFT_NAMES.indexOf(name));  // ordered by SHIFT_START
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
  return '<div class="note clickable' + inactiveClass(r) + '" onclick="openDetail(\'bulletin\',' + r._row + ')"><div class="note-body">' +
    (r.image ? photoBtn(r.image, '<img class="bl-photo" src="' + imgUrl(r.image) + '" alt="" loading="lazy">') : '') +
    '<div class="small muted">' + esc(r.date) + (r.type ? ' · ' + esc(r.type) : '') + statusBadge(r) + '</div>' +
    '<div class="note-title">' + esc(r.title) + '</div>' +
    '<p class="pre muted">' + esc(r.description) + '</p>' +
    editBtn("bulletin", r, true) + '</div></div>';
}
/** Part of day: the key for the daily quote and greeting. */
function dayPart() {
  const h = new Date().getHours();
  if (h < 11) return { key: "Morning", word: "morning" };
  if (h < 15) return { key: "Afternoon", word: "afternoon" };
  if (h < 19) return { key: "Evening", word: "evening" };
  return { key: "Night", word: "night" };
}

/* ---------- MENU / SOP / ACADEMY (with search) ---------- */

function viewSearchable(sheetKey) {
  const isMenu = sheetKey === "food" || sheetKey === "beverage";
  const hasView = ["food", "beverage", "sop", "academy"].indexOf(sheetKey) !== -1;
  return sectionHead(SHEET_LABELS[sheetKey], sheetKey, hasView ? viewToggleHtml(sheetKey) : "") +
    '<input class="input search" type="search" placeholder="Search..." value="' + esc(searchText) +
    '" oninput="onSearch(this.value)">' +
    categoryChips(sheetKey) +
    '<div id="listArea">' + listHtml() + '</div>';
}

/** All chip and categories from this tab's data. */
function categoryChips(tab) {
  const field = TAB_CATEGORY_FIELD[tab];
  if (!field) return "";
  const cats = distinctValues(tab, field);
  const cur = tabCategory[tab] || "";
  const chip = (i, label, on) =>
    '<button type="button" class="chip-btn' + (on ? ' on' : '') + '" onclick="setTabCategory(' + i + ')">' + esc(label) + '</button>';
  return '<div class="gl-chips">' + chip(-1, "All", cur === "") + cats.map((c, i) => chip(i, c, cur === c)).join("") + '</div>';
}

function setTabCategory(i) {
  const cats = distinctValues(activeTab, TAB_CATEGORY_FIELD[activeTab]);
  tabCategory[activeTab] = i < 0 ? "" : cats[i];
  renderTab();
}

function inTabCategory(tab, r) {
  const cur = tabCategory[tab] || "";
  return !cur || r[TAB_CATEGORY_FIELD[tab]] === cur;
}

function viewToggleHtml(tab) {
  const cur = viewOf(tab);
  return '<div class="seg menu-view" role="group" aria-label="View">' +
    [["grid", "Cards"], ["list", "List"]].map(o =>
      '<button type="button" class="' + (cur === o[0] ? "on" : "") + '" onclick="setTabView(\'' + tab + '\',\'' + o[0] + '\')">' + o[1] + '</button>'
    ).join("") + '</div>';
}

function setTabView(tab, mode) {
  tabView[tab] = mode;
  renderTab();
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

/** Group items by field; group title on top, contents from renderBody. */
function grouped(items, field, renderBody) {
  return groupBy(items, field).map(g =>
    '<h3 class="group">' + esc(g.key) + '</h3>' + renderBody(g.items)
  ).join("");
}

/* Tiap kategori: judul di kiri, kartunya di kanan. Di HP judul di atas kartu. */
function categoryRows(items, field, renderCard, gridClass) {
  return groupBy(items, field).map(g =>
    '<section class="cat-row"><h3 class="group">' + esc(g.key) + '</h3>' +
    '<div class="' + gridClass + '">' + g.items.map(renderCard).join("") + '</div></section>'
  ).join("");
}

function menuList(rows, sheetKey) {
  const items = rows.filter(r => r.name && inTabCategory(sheetKey, r) && matches([r.category, r.name, r.description]));
  if (!items.length) return emptyState("No matching menu items.");
  if (viewOf(sheetKey) === "list") {
    return grouped(items, "category", list => list.map(r => menuRow(r, sheetKey)).join(""));
  }
  return categoryRows(items, "category", r => menuCard(r, sheetKey), "grid");
}

function menuRow(r, sheetKey) {
  return '<div class="row menu-row clickable" onclick="openDetail(\'' + sheetKey + '\',' + r._row + ')">' +
    '<div class="row-main"><strong>' + esc(r.name) + '</strong>' +
      '<span class="small muted">' + esc(r.description) + '</span></div>' +
    '<span class="price">Rp ' + esc(r.price) + '</span>' +
    editBtn(sheetKey, r) +
  '</div>';
}
function menuCard(r, sheetKey) {
  return '<article class="tile clickable" onclick="openDetail(\'' + sheetKey + '\',' + r._row + ')">' +
    (r.image
      ? photoBtn(r.image, '<img class="tile-img" src="' + imgUrl(r.image) + '" alt="" loading="lazy">')
      : '<div class="tile-img placeholder">' + esc(initial(r.name)) + '</div>') +
    '<div class="tile-body">' +
      '<div class="tile-head"><h3>' + esc(r.name) + '</h3>' +
      '<span class="price">Rp ' + esc(r.price) + '</span></div>' +
      '<p class="muted small pre">' + esc(r.description) + '</p>' +
      (r.allergens ? '<span class="allergen">Allergen: ' + allergenHtml(r.allergens) + '</span>' : '') +
      editBtn(sheetKey, r, true) +
    '</div>' +
  '</article>';
}
function sopList() {
  const items = appData.sop.filter(r => r.name && r.file && inTabCategory("sop", r) && matches([r.category, r.name, r.description]));
  if (!items.length) return emptyState("No matching SOPs.");
  if (viewOf("sop") === "list") {
    return grouped(items, "category", list => list.map(sopRow).join(""));
  }
  return categoryRows(items, "category", sopCard, "grid");
}

function sopCard(r) {
  return '<article class="card">' +
    '<h3>' + esc(r.name) + '</h3>' +
    '<p class="small muted">Update: ' + esc(r.updated) + '</p>' +
    (r.description ? '<p class="muted small">' + esc(r.description) + '</p>' : '') +
    '<div class="actions"><a class="btn small outline" target="_blank" rel="noopener" href="https://drive.google.com/file/d/' +
      encodeURIComponent(r.file) + '/view">Open SOP</a></div>' +
    editBtn("sop", r, true) +
  '</article>';
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
  const items = appData.academy.filter(r => r.title && inTabCategory("academy", r) && matches([r.category, r.title, r.shortDesc]));
  if (!items.length) return emptyState("No matching materials.");
  if (viewOf("academy") === "list") {
    return grouped(items, "category", list => list.map(academyRow).join(""));
  }
  return categoryRows(items, "category", academyCard, "grid academy-grid");
}

function academyRow(r) {
  const meta = [r.difficulty, r.readingTime, r.updated ? "Update " + r.updated : ""].filter(Boolean).join(" · ");
  return '<div class="row clickable" onclick="openDetail(\'academy\',' + r._row + ')">' +
    '<div class="row-main"><strong>' + esc(r.title) + '</strong>' +
      '<span class="small muted">' + esc(meta) + '</span></div>' +
    '<span class="chev">›</span>' +
    editBtn("academy", r) +
  '</div>';
}
function academyCard(r) {
  return '<article class="card clickable" onclick="openDetail(\'academy\',' + r._row + ')">' +
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
      (r.video ? '<a class="btn small outline" target="_blank" rel="noopener" onclick="event.stopPropagation()" href="' + safeUrl(r.video) + '">Watch video</a>' : '') +
      materialButtons(r) +
    '</div>' +
    editBtn("academy", r, true) +
  '</article>';
}
/* ---------- TEAMS / GUESTS / ABOUT ---------- */

/* Urutan Our Teams: kolom Order di sheet. Yang kosong ditaruh paling bawah. */
function orderKey(r) {
  const n = Number(r.order);
  return r.order !== "" && r.order != null && !isNaN(n) ? n : 1e9;
}

/* ---------- REARRANGE (Our Teams, hanya editor) ---------- */

let rearranging = false;
let dragState = null;
let suppressClick = false;

function teamsActions() {
  if (!canEdit() || viewOf("teams") !== "grid") return "";
  return rearranging
    ? '<button class="ghost small" type="button" onclick="saveRearrange()">Done</button>' +
      '<button class="ghost small" type="button" onclick="cancelRearrange()">Cancel</button>'
    : '<button class="ghost small" type="button" onclick="startRearrange()">⇅ Rearrange</button>';
}

function startRearrange() {
  rearranging = true;
  renderTab();
}

function cancelRearrange() {
  rearranging = false;
  renderTab();
}

/** Kirim urutan kartu yang sekarang (dari atas ke bawah) ke sheet. */
async function saveRearrange() {
  const niks = Array.from(document.querySelectorAll("#app .person[data-row]")).map(el => {
    const r = appData.teams.find(x => x._row === Number(el.dataset.row));
    return r ? r.nik : "";
  }).filter(Boolean);
  rearranging = false;
  try {
    await api("saveOrder", [sessionToken, niks]);
    toast("Order saved.");
  } catch (e) {
    if (isSessionExpired(e)) {
      handleApiError(e);
      return;
    }
    toast(e.message);
  }
  refreshSheet("teams");
}

let dragHover = null;
let dragSide = null;

function onRearrangePointerDown(e) {
  if (!rearranging || !canEdit() || activeTab !== "teams" || viewOf("teams") !== "grid") return;
  const card = e.target.closest(".person[data-row]");
  if (!card || e.target.closest(".corner-edit")) return;
  const rect = card.getBoundingClientRect();
  const ph = document.createElement("div");
  ph.className = "person-placeholder";
  ph.style.width = rect.width + "px";
  ph.style.height = rect.height + "px";
  card.parentNode.insertBefore(ph, card);
  dragState = { card: card, ph: ph, group: card.parentNode, offX: e.clientX - rect.left, offY: e.clientY - rect.top };
  dragHover = null;
  dragSide = null;
  Object.assign(card.style, { position: "fixed", left: rect.left + "px", top: rect.top + "px", width: rect.width + "px", zIndex: "50", pointerEvents: "none" });
  e.preventDefault();
}

/* Placeholder hanya pindah saat kursor MASUK ke kartu lain, bukan tiap gerakan.
   Jadi tidak bolak-balik (ketuker) di tengah kartu. */
function onRearrangePointerMove(e) {
  if (!dragState) return;
  const d = dragState;
  d.card.style.left = (e.clientX - d.offX) + "px";
  d.card.style.top = (e.clientY - d.offY) + "px";
  const hit = document.elementFromPoint(e.clientX, e.clientY);
  const target = hit && hit.closest(".person[data-row]");
  if (!target || target === d.card || target.parentNode !== d.group) return;
  const b = target.getBoundingClientRect();
  const oneColumn = b.width > d.group.getBoundingClientRect().width * 0.8;
  const pos = oneColumn ? (e.clientY - b.top) / b.height : (e.clientX - b.left) / b.width;
  if (target !== dragHover) {
    dragHover = target;
    dragSide = pos < 0.5 ? "before" : "after";
  } else if (dragSide === "after" && pos < 0.3) {
    dragSide = "before";
  } else if (dragSide === "before" && pos > 0.7) {
    dragSide = "after";
  } else {
    return;
  }
  d.group.insertBefore(d.ph, dragSide === "before" ? target : target.nextSibling);
}

function onRearrangePointerUp() {
  if (!dragState) return;
  const d = dragState;
  dragState = null;
  dragHover = null;
  dragSide = null;
  Object.assign(d.card.style, { position: "", left: "", top: "", width: "", zIndex: "", pointerEvents: "" });
  d.ph.replaceWith(d.card);
  suppressClick = true;
}

/* Saat Rearrange, klik kartu tidak membuka popup. Klik setelah drag juga diabaikan. */
function onAppClickCapture(e) {
  const onCard = e.target.closest(".person");
  if (onCard && (suppressClick || rearranging)) {
    e.stopPropagation();
    e.preventDefault();
  }
  suppressClick = false;
}

function viewTeams() {
  const rows = appData.teams.filter(r => r.name && inTabCategory("teams", r)).slice().sort((x, y) => orderKey(x) - orderKey(y));
  return sectionHead(SHEET_LABELS.teams, "teams", viewToggleHtml("teams") + teamsActions()) +
    categoryChips("teams") +
    '<div class="' + (rearranging ? "rearranging" : "") + '">' +
    (rearranging ? '<p class="muted small">Drag a card to move it inside its department. Tap Done to save.</p>' : "") +
    (rows.length
      ? (viewOf("teams") === "list"
          ? grouped(rows, "department", list => list.map(personRow).join(""))
          : grouped(rows, "department", list => '<div class="grid">' + list.map(personCard).join("") + '</div>'))
      : emptyState("No team data yet.")) +
    '</div>';
}
function personRow(r) {
  return '<div class="row clickable" onclick="openDetail(\'teams\',' + r._row + ')">' +
    '<div class="row-main"><strong>' + esc(r.name) + '</strong>' +
      '<span class="small muted">' + esc(r.position) + '</span></div>' +
    '<span class="chev">›</span>' +
    editBtn("teams", r) +
  '</div>';
}
function personCard(r) {
  return '<div class="person clickable" data-row="' + r._row + '" onclick="openDetail(\'teams\',' + r._row + ')">' +
    (r.image
      ? photoBtn(r.image, '<img class="person-photo" src="' + imgUrl(r.image) + '" alt="" loading="lazy">')
      : '<div class="person-photo initials">' + esc(initials(r.name)) + '</div>') +
    '<div class="person-name">' + esc(r.name) + '</div>' +
    '<div class="muted">' + esc(r.position) + '</div>' +
    editBtn("teams", r, true) +
  '</div>';
}
/** Greeting: nickname from HR; if empty, use the first name. */
function greetingName() {
  return currentNickname || firstName(currentName);
}

/**
 * Guest time from the sheet's date text ("18 Sep" or "18 Sep 2026").
 * Without a year, the current year is assumed; if the result is in the future, last year.
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
 * Guest order: by date (newest first, or oldest first), then name A-Z when dates are equal.
 * Unreadable dates (0) sort as oldest.
 */
function compareGuests(a, b, newest) {
  const byDate = newest ? guestTime(b) - guestTime(a) : guestTime(a) - guestTime(b);
  if (byDate) return byDate;
  return String(a.guest).localeCompare(String(b.guest), "id", { sensitivity: "base" });
}

/** Newest first. Unreadable dates go to the bottom. */
function newestFirst(rows) {
  return rows.slice().sort((a, b) => compareGuests(a, b, true));
}

/** Text cut to n characters, with "…" added when cut. */
function clipText(text, n) {
  return text.length > n ? text.slice(0, n).trimEnd() + "…" : text;
}

/**
 * Guest card on Home. Note snippet is 50 characters on phones and 80 on desktop (set by CSS).
 * Read more only expands the text in place, it does not open a pop-up.
 */
function guestCard(r) {
  const text = String(r.description || "");
  const phoneMore = text.length > GUEST_PREVIEW_PHONE;
  const desktopMore = text.length > GUEST_PREVIEW_DESKTOP;
  return '<div class="note guest' + inactiveClass(r) + '">' +
    '<div class="guest-card-head">' +
      (r.image
        ? photoBtn(r.image, '<img class="guest-card-photo" src="' + imgUrl(r.image) + '" alt="" loading="lazy">')
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
/** Expand or collapse the note text inside the card. */
function toggleGuestText(btn) {
  const card = btn.closest(".guest");
  const open = card.classList.toggle("open");
  card.querySelectorAll(".more").forEach(b => { b.innerText = open ? "Show less" : "Read more"; });
}

/** Guest details: large photo and full notes. */
function openGuest(row) {
  const r = (appData.guests || []).find(x => x._row === row);
  if (!r) return toast("This data no longer exists. Refresh first.");
  document.getElementById("guestBody").innerHTML =
    (r.image ? photoBtn(r.image, '<img class="guest-hero" src="' + imgUrl(r.image) + '" alt="' + esc(r.guest) + '">') : '') +
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

/* ---------- OUR GUESTS: full page ---------- */

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

/** Category options: "All" plus categories from the data. The choice is sent as an index, not text. */
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

/** Guests the user may see, then narrowed by status. Used for the list and the category chip counts. */
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
  return '<div class="guest-tile' + inactiveClass(r) + '" role="button" tabindex="0" onclick="openGuest(' + r._row + ')">' +
    guestPhotoHtml(r, "guest-tile-img") +
    '<div class="guest-tile-body"><strong>' + esc(r.guest) + '</strong>' +
      '<span class="badge">' + esc(r.category) + '</span>' + statusBadge(r) +
      '<span class="small muted">' + esc(r.date) + '</span></div>' +
  '</div>';
}
function guestLine(r) {
  return '<div class="guest-line' + inactiveClass(r) + '" role="button" tabindex="0" onclick="openGuest(' + r._row + ')">' +
    guestPhotoHtml(r, "guest-line-img") +
    '<span class="guest-line-body"><strong>' + esc(r.guest) + '</strong>' +
      '<span class="small muted">' + esc(r.category) + ' · ' + esc(r.date) + '</span></span>' +
    statusBadge(r) +
    '<span class="chev">›</span>' +
  '</div>';
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

/* ---------- STAFF BULLETIN: full page (calendar and list) ---------- */

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

/** Active bulletins only, newest first. Used by the calendar and the list. */
function activeBulletins() {
  return newestFirst(appData.bulletin.filter(isActive));
}

/** Bulletin types: from the sheet, or defaults if the sheet is empty. */
function bulletinTypeList() {
  const rows = (appData && appData.bulletinTypes || []).filter(r => r.type);
  return rows.length ? rows : DEFAULT_BULLETIN_TYPES;
}

function bulletinTypeNames() {
  return bulletinTypeList().map(r => r.type);
}

function bulletinColor(type) {
  const row = bulletinTypeList().find(r => r.type === type);
  return row && row.color ? row.color : "var(--muted)";
}

/** Style attribute for a type color: text, border, and a faint background from the same color. */
function bulletinStyle(type) {
  const c = esc(bulletinColor(type));
  return 'style="--tag:' + c + ';--tag-bg:color-mix(in srgb, ' + c + ' 16%, transparent)"';
}
function viewBulletinLanding() {
  return '<div class="gl-head">' +
      '<button class="ghost" type="button" onclick="showTab(\'home\')">← Back</button>' +
      '<h2 class="section-title">Staff Bulletin</h2>' +
      '<div class="section-actions">' +
        '<div class="seg" role="group" aria-label="View">' +
          [["calendar", "Calendar"], ["list", "List"]].map(o =>
            '<button type="button" class="' + (bulletinView === o[0] ? "on" : "") + '" onclick="bulletinSetView(\'' + o[0] + '\')">' + o[1] + '</button>'
          ).join("") +
        '</div>' +
        addBtn("bulletin", "+ Add") +
      '</div>' +
    '</div>' +
    '<div class="bl-legend">' + bulletinTypeList().map(row =>
      '<span class="bl-tag" ' + bulletinStyle(row.type) + '>' + esc(row.type) + '</span>').join("") + '</div>' +
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

  const lead = (new Date(y, m, 1).getDay() + 6) % 7;   // week starts on Monday
  const days = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push('<span class="bc-cell bc-empty"></span>');
  for (let d = 1; d <= days; d++) {
    const iso = y + "-" + pad2(m + 1) + "-" + pad2(d);
    const list = byDay[iso] || [];
    const dots = Array.from(new Set(list.map(r => bulletinColor(r.type))))
      .map(c => '<i class="bc-dot" style="--tag:' + esc(c) + '"></i>').join("");
    const classes = "bc-cell" + (iso === todayIso ? " bc-today" : "") + (iso === bulletinDay ? " bc-picked" : "");
    cells.push('<button type="button" class="' + classes + '" onclick="bulletinPick(\'' + iso + '\')">' +
      '<span>' + d + '</span><span class="bc-dots">' + dots + '</span></button>');
  }

  const dayItems = bulletinDay ? (byDay[bulletinDay] || []) : [];
  const dayHead = bulletinDay
    ? '<div class="bc-day-head"><div class="bc-day-title">' + esc(formatSheetDate(new Date(bulletinDay + "T00:00:00"))) + '</div>' +
      (canEdit() ? '<button class="add-btn" type="button" onclick="openAdd(\'bulletin\',\'' + bulletinDay + '\')">+ Add on this day</button>' : '') +
      '</div>'
    : "";
  return '<div class="bc-head">' +
      '<button class="ghost small" type="button" aria-label="Previous month" onclick="bulletinMonthStep(-1)">‹</button>' +
      '<strong>' + BULLETIN_MONTHS[m] + ' ' + y + '</strong>' +
      '<button class="ghost small" type="button" aria-label="Next month" onclick="bulletinMonthStep(1)">›</button>' +
    '</div>' +
    '<div class="bc-week">' + BULLETIN_WEEKDAYS.map(w => '<span>' + w + '</span>').join("") + '</div>' +
    '<div class="bc-grid">' + cells.join("") + '</div>' +
    (bulletinDay
      ? dayHead + (dayItems.length ? dayItems.map(bulletinItem).join("") : emptyState("Nothing on this day yet."))
      : '<p class="muted small bc-hint">Tap a date to see its items or add one.</p>');
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

/** One bulletin item, used in the calendar (per day) and in the list. Read more only expands the text in place. */
function bulletinItem(r) {
  const text = String(r.description || "");
  const more = text.length > 80;
  return '<div class="bl-item clickable" ' + bulletinStyle(r.type) + ' onclick="openDetail(\'bulletin\',' + r._row + ')">' +
    (r.image ? photoBtn(r.image, '<img class="bl-photo" src="' + imgUrl(r.image) + '" alt="" loading="lazy">') : '') +
    '<div class="bl-meta"><span class="bl-tag" ' + bulletinStyle(r.type) + '>' + esc(r.type || "Info") + '</span>' +
      '<span class="small muted">' + esc(r.date) + '</span></div>' +
    '<div class="note-title">' + esc(r.title) + '</div>' +
    (text
      ? '<p class="bl-text"><span class="bl-short">' + esc(clipText(text, 80)) + '</span><span class="bl-full">' + esc(text) + '</span></p>'
      : '') +
    '<div class="bl-actions">' +
      (more ? '<button class="more" type="button" onclick="event.stopPropagation();toggleBulletinText(this)">Read more</button>' : '') +
      editBtn("bulletin", r) +
    '</div>' +
  '</div>';
}function toggleBulletinText(btn) {
  const item = btn.closest(".bl-item");
  const open = item.classList.toggle("open");
  btn.innerText = open ? "Show less" : "Read more";
}

/* ---------- PHOTO & DETAIL ---------- */

function imgUrlLarge(id) {
  if (/^https:\/\/[^\s"'<>]+$/.test(id)) return id;
  return "https://drive.google.com/thumbnail?id=" + encodeURIComponent(id) + "&sz=w1600";
}

/** Photo that can be enlarged. Clicking the photo does not also open the card behind it. */
function photoBtn(id, imgHtml) {
  return '<button class="photo-btn" type="button" data-photo="' + esc(id) + '" onclick="event.stopPropagation();openPhoto(this.dataset.photo)">' + imgHtml + '</button>';
}

function guestPhotoHtml(r, cls) {
  return r.image
    ? photoBtn(r.image, '<img class="' + cls + '" src="' + imgUrl(r.image) + '" alt="" loading="lazy">')
    : '<div class="' + cls + ' gph">' + esc(initial(r.guest)) + '</div>';
}

function openPhoto(id) {
  document.getElementById("photoFull").src = imgUrlLarge(id);
  document.getElementById("photoModal").classList.remove("hidden");
}

function closePhoto() {
  document.getElementById("photoModal").classList.add("hidden");
}

/* Info popup contents per sheet. meta: [label, column, prefix]. */
const DETAIL_CONFIG = {
  food:     { label: "Food Bible", title: "name", meta: [["Category", "category"], ["Price", "price", "Rp "], ["Allergens", "allergens"]], text: "description", links: [] },
  beverage: { label: "Beverage Bible", title: "name", meta: [["Category", "category"], ["Price", "price", "Rp "], ["Allergens", "allergens"]], text: "description", links: [] },
  teams:    { label: "Our Teams", title: "name", meta: [["Department", "department"], ["Position", "position"]], text: null, links: [] },
  academy:  { label: "Reload Academy", title: "title", meta: [["Category", "category"], ["Difficulty", "difficulty"], ["Reading time", "readingTime"], ["Updated", "updated"], ["Summary", "shortDesc"]], text: "content", links: [["Read material", "fullLink"], ["Watch video", "video"]] },
  bulletin: { label: "Staff Bulletin", title: "title", meta: [["Date", "date"], ["Type", "type"]], text: "description", links: [] }
};

function openDetail(sheetKey, row) {
  const cfg = DETAIL_CONFIG[sheetKey];
  const r = (appData[sheetKey] || []).find(x => x._row === row);
  if (!cfg || !r) return toast("This data no longer exists. Refresh first.");
  const metaRow = m => r[m[1]]
    ? '<div class="detail-row"><span class="muted">' + esc(m[0]) + '</span><span>' + (m[1] === "allergens" ? allergenHtml(r[m[1]]) : esc((m[2] || "") + r[m[1]])) + '</span></div>'
    : "";
  const links = sheetKey === "academy"
    ? (r.video ? '<a class="btn small outline" target="_blank" rel="noopener" href="' + safeUrl(r.video) + '">Watch video</a>' : '') + materialButtons(r)
    : cfg.links.filter(l => r[l[1]]).map(l =>
        '<a class="btn small outline" target="_blank" rel="noopener" href="' + safeUrl(r[l[1]]) + '">' + esc(l[0]) + '</a>').join("");
  document.getElementById("detailTitle").innerText = cfg.label;
  document.getElementById("detailBody").innerHTML =
    (r.image ? photoBtn(r.image, '<img class="detail-hero" src="' + imgUrl(r.image) + '" alt="">') : "") +
    '<strong class="detail-name">' + esc(r[cfg.title]) + '</strong>' +
    cfg.meta.map(metaRow).join("") +
    (cfg.text && r[cfg.text] ? '<p class="pre detail-text">' + esc(r[cfg.text]) + '</p>' : "") +
    (links ? '<div class="detail-links">' + links + '</div>' : "");
  document.getElementById("detailModal").classList.remove("hidden");
}

function closeDetail() {
  document.getElementById("detailModal").classList.add("hidden");
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
 * Active items show normally. Inactive items (editors only) are folded
 * into one collapsed section so the main list stays short.
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

/* ---------- EDIT / ADD BUTTONS ---------- */

/** One definition of "can edit": from the backend. Used by all add/edit/delete buttons. */
function canEdit() {
  return currentCanEdit;
}

/**
 * Items shown: staff only see ACTIVE ones, editors see all
 * so they can reactivate inactive items.
 */
/** Is the row date (sheet format, for example "20 Oct 2026") today? */
function isToday(sheetDate) {
  return isoFromSheetDate(sheetDate) === isoDate(new Date());
}

/** One definition of "active". All status checks go through here. */
function isActive(rec) {
  return rec.status === "ACTIVE";
}

function showItem(rec) {
  return currentCanEdit || isActive(rec);
}

function inactiveClass(rec) {
  return isActive(rec) ? "" : " is-inactive";
}

/** The "Inactive" label is for editors only. Staff never see inactive items. */
function statusBadge(rec) {
  if (!currentCanEdit || isActive(rec)) return "";
  return ' <span class="badge off">Inactive</span>';
}

function sectionHead(title, sheetKey, extra) {
  return '<div class="section-head"><h2 class="section-title">' + esc(title) + '</h2>' +
    '<div class="section-actions">' + (extra || "") + addBtn(sheetKey, "+ Add") + '</div></div>';
}

/* Data that comes from HR, not from a Staff Hub sheet: shown read-only (no Add or Edit). */
const HR_SOURCED = ["teams"];

function addBtn(sheetKey, label) {
  if (!canEdit() || HR_SOURCED.indexOf(sheetKey) !== -1) return "";
  return '<button class="add-btn" type="button" onclick="openAdd(\'' + sheetKey + '\')">' + esc(label) + '</button>';
}

function editBtn(sheetKey, rec, corner) {
  if (HR_SOURCED.indexOf(sheetKey) !== -1) return "";
  if (!canEdit() || !rec || !rec._row) return "";
  return '<button class="edit-btn' + (corner ? ' corner-edit' : '') + '" type="button" onclick="event.stopPropagation();closeDetail();openEdit(\'' + sheetKey + '\',' + rec._row + ')">Edit</button>';
}/* ---------- FORM (tambah, edit, hapus) ---------- */

function openAdd(sheetKey, presetDate) {
  const blank = {};
  EDIT_FIELDS[sheetKey].forEach(f => { blank[f.key] = defaultValue(sheetKey, f); });
  if (presetDate) {
    const dateField = EDIT_FIELDS[sheetKey].find(f => f.input === "date");
    if (dateField) blank[dateField.key] = formatSheetDate(new Date(presetDate + "T00:00:00"));
  }
  formState = { mode: "add", sheetKey: sheetKey, row: null, original: blank };
  const restored = takeDraft("add", sheetKey, null);
  showForm("Add " + SHEET_LABELS[sheetKey], restored || blank, false);
}

function openEdit(sheetKey, row) {
  closeGuest();
  const rec = (appData[sheetKey] || []).find(r => r._row === row);
  if (!rec) return toast("This data no longer exists. Refresh first.");

  formState = { mode: "edit", sheetKey: sheetKey, row: row, original: rec };
  const restored = takeDraft("edit", sheetKey, row);
  showForm("Edit " + SHEET_LABELS[sheetKey], restored || rec, true);
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

let formDraft = null;     // isi form yang belum disimpan, kalau form tertutup
let formUploading = false;

/** Isi form yang sekarang, untuk disimpan sementara. Null kalau tidak bisa dibaca. */
function currentDraft() {
  try {
    return { sheetKey: formState.sheetKey, mode: formState.mode, row: formState.row, values: readForm() };
  } catch (e) {
    return null;
  }
}

/** Ambil draft yang cocok dengan form yang mau dibuka, lalu hapus draft-nya. */
function takeDraft(mode, sheetKey, row) {
  const d = formDraft;
  formDraft = null;
  if (d && d.mode === mode && d.sheetKey === sheetKey && d.row === row) {
    toast("Restored your unsaved changes.");
    return d.values;
  }
  return null;
}

/** discard = true kalau form ditutup karena sudah disimpan (tidak perlu draft). */
function closeForm(discard) {
  if (formUploading) {
    toast("Still uploading. Please wait.");
    return;
  }
  if (formState && !discard) formDraft = currentDraft();
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

/* ---------- DEFAULT VALUES & OPTIONS ---------- */

/** Initial value when adding a new row. */
function defaultValue(sheetKey, f) {
  if (f.dynamicOptions) return f.dynamicOptions()[0] || "";
  if (f.input === "date" || f.input === "today") return formatSheetDate(new Date());
  if (f.input === "phone") return "62";
  if (f.options) return f.options[0];
  if (f.src) {
    const list = distinctValues(sheetKey, f.key);
    return list.length ? list[0] : "";
  }
  return "";
}

/** Unique values from the sheet, used as options (one source: the data itself). */
function distinctValues(sheetKey, key) {
  const seen = [];
  (appData[sheetKey] || []).forEach(r => {
    const v = String(r[key] || "").trim();
    if (v && seen.indexOf(v) === -1) seen.push(v);
  });
  return seen.sort((a, b) => a.localeCompare(b));
}

function optionList(sheetKey, f) {
  if (f.dynamicOptions) return f.dynamicOptions();
  const list = (f.options || []).slice();
  if (f.src) {
    distinctValues(sheetKey, f.key).forEach(v => {
      if (list.indexOf(v) === -1) list.push(v);
    });
  }
  return list;
}

/* ---------- INPUT BY TYPE ---------- */

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
  if (f.input === "materials") return materialsHtml(f, v);
  if (f.input === "readonly") return '<input class="input" type="text" readonly ' + key + ' value="' + esc(v) + '">';
  if (f.input === "url") return '<input class="input" type="url" ' + key + ' value="' + esc(v) + '" placeholder="https://...">';
  if (f.input === "multi") return '<textarea class="input" rows="4" ' + key + '>' + esc(v) + '</textarea>';
  if (f.options || f.src) return selectHtml(sheetKey, f, v);
  return '<input class="input" type="text" ' + key + ' value="' + esc(v) + '">';
}

/** Dropdown. If src, a "+ New…" option shows a text box. */
function selectHtml(sheetKey, f, v) {
  let opts = optionList(sheetKey, f);
  if (v && opts.indexOf(v) === -1) opts = [v].concat(opts);   // old value still shown as is

  const isNew = f.src && !v && opts.length === 0;
  const blank = !v && opts.length > 0 ? '<option value="" selected>— choose —</option>' : '';

  return '<select class="input" data-key="' + f.key + '">' + blank +
    opts.map(o => '<option value="' + esc(o) + '"' + (o === v ? ' selected' : '') + '>' + esc(o) + '</option>').join("") +
    (f.src ? '<option value="__new__"' + (isNew ? ' selected' : '') + '>+ New…</option>' : '') +
    '</select>' +
    (f.src ? '<input class="input new-input' + (isNew ? '' : ' hidden') + '" type="text" data-new-for="' + f.key + '" placeholder="Type a new value">' : '');
}

/** Allergen checkboxes. Old values not in the list are still shown and checked. */
/** Logo for one allergen name, or "" if there is no logo for it. */
function allergenIconHtml(name, cls) {
  const file = ALLERGEN_ICON_FILES[String(name).trim().toLowerCase()];
  return file ? '<img class="' + cls + '" src="' + file + '" alt="" loading="lazy">' : "";
}

/** Allergen text "Gluten,Milk" -> logo + name for each one. Names without a logo are shown as text. */
function allergenHtml(text) {
  return String(text || "").split(",").map(s => s.trim()).filter(Boolean).map(a =>
    '<span class="allergen-item">' + allergenIconHtml(a, "allergen-icon") + esc(a) + '</span>'
  ).join("");
}

function checksHtml(f, v) {
  const current = v.split(",").map(s => s.trim()).filter(Boolean);
  const all = ALLERGEN_OPTIONS.concat(current.filter(x => ALLERGEN_OPTIONS.indexOf(x) === -1));
  return '<div class="checks">' + all.map(o =>
    '<label class="check"><input type="checkbox" data-check="' + f.key + '" value="' + esc(o) + '"' +
      (current.indexOf(o) !== -1 ? ' checked' : '') + '> ' + allergenIconHtml(o, "allergen-icon") + esc(o) + '</label>'
  ).join("") + '</div>';
}

/** The "+ New…" box appears only when selected. */
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

/* ---------- READ FORM ---------- */

/**
 * Form contents are read back. Columns that were not changed (readonly, or dates in an old format
 * that the date picker cannot read) keep their original value, so nothing silently becomes empty.
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

/** Return undefined when this column should keep its original value. */
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
      const res = (await api("updateRow", [sessionToken, sheetKey, row, oldValues, newValues])) || {};
      toast(res.changed === 0 ? "No changes." : "Saved.");
    }
    closeForm(true);
    refreshSheet(sheetKey);
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
    closeForm(true);
    refreshSheet(sheetKey);
  } catch (e) {
    formError(e);
  }
}

/* ---------- FORMAT & PARSE ---------- */

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Month names allowed in the sheet: English or Indonesian. For reading only; writing stays English. */
const MONTH_ALIASES = { jan: 0, feb: 1, mar: 2, apr: 3, mei: 4, may: 4, jun: 5, jul: 6, agu: 7, aug: 7, sep: 8, okt: 9, oct: 9, nov: 10, des: 11, dec: 11 };

/** Month index (0-11) from a sheet name. -1 if not recognized. */
function monthIndex(name) {
  const k = String(name || "").toLowerCase();
  return Object.prototype.hasOwnProperty.call(MONTH_ALIASES, k) ? MONTH_ALIASES[k] : -1;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

/** Date in YYYY-MM-DD format (for comparison). */
function isoDate(d) {
  return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
}

/** The format the sheet uses: "5 Oct 2026". */
function formatSheetDate(d) {
  return d.getDate() + " " + MONTHS_EN[d.getMonth()] + " " + d.getFullYear();
}

/** Convert "5 Oct 2026" to "2026-10-05" for the date picker. Empty if the format is not recognized. */
function isoFromSheetDate(v) {
  const m = String(v || "").trim().match(/^(\d{1,2}) ([A-Za-z]{3})[a-z]* (\d{4})$/);
  if (!m) return "";
  const mi = monthIndex(m[2]);
  if (mi === -1) return "";
  return m[3] + "-" + pad2(mi + 1) + "-" + pad2(Number(m[1]));
}

/* ---------- MATERIALS (Academy) ---------- */

/** Textarea materials + tombol upload PDF. Satu baris per materi: "Nama | link atau ID file". */
function materialsHtml(f, v) {
  return '<textarea class="input" rows="4" data-key="' + f.key + '" placeholder="Name | https://...  (one per line)">' + esc(v) + '</textarea>' +
    '<div class="materials-add">' +
      '<button class="ghost small" type="button" onclick="document.getElementById(\'materialPdf\').click()">+ Add PDF (max 8 MB)</button>' +
      '<input type="file" id="materialPdf" hidden accept="application/pdf" onchange="onMaterialPdf(this)">' +
      '<span class="small muted" data-status="' + f.key + '"></span>' +
    '</div>';
}

/** Upload PDF ke Drive, lalu tambahkan barisnya ke daftar materials di form. */
async function onMaterialPdf(input) {
  const file = input.files && input.files[0];
  input.value = "";
  if (!file) return;
  const status = document.querySelector('[data-status="materials"]');
  const box = document.querySelector('#editForm [data-key="materials"]');
  if (file.type !== "application/pdf") { status.innerText = "Please choose a PDF file."; return; }
  if (file.size > 8 * 1024 * 1024) { status.innerText = "File is too large. Maximum 8 MB."; return; }
  const name = prompt("Name for this material", file.name.replace(/\.pdf$/i, ""));
  if (!name || !name.trim()) { status.innerText = ""; return; }

  setFormBusy(true);
  status.innerHTML = '<span class="mini-spinner"></span>Uploading...';
  try {
    const base64 = await readAsBase64(file);
    const res = await api("uploadFile", [sessionToken, base64, "application/pdf", file.name]);
    const line = name.trim().replace(/\s*\|\s*/g, " ") + " | " + res.id;
    box.value = box.value.trim() ? box.value.replace(/\s+$/, "") + "\n" + line : line;
    status.innerText = "Uploaded.";
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

/**
 * Materials jadi daftar tombol. Baris "Nama | link" atau "Nama | ID file Drive".
 * Link utama lama (fullLink) ikut ditampilkan kalau belum ada di daftar.
 */
function materialsOf(r) {
  const out = [];
  String(r.materials || "").split("\n").forEach(function (line) {
    const t = line.trim();
    if (!t) return;
    const bar = t.indexOf("|");
    const name = bar === -1 ? t : t.slice(0, bar).trim();
    const value = bar === -1 ? "" : t.slice(bar + 1).trim();
    let href = "";
    if (/^https?:\/\//i.test(value)) href = value;
    else if (/^[\w-]{20,}$/.test(value)) href = "https://drive.google.com/file/d/" + value + "/view";
    if (href) out.push({ name: name || "Material", href: href });
  });
  if (r.fullLink && !out.some(function (m) { return m.href === r.fullLink; })) {
    out.unshift({ name: "Read material", href: r.fullLink });
  }
  return out;
}

function materialButtons(r) {
  return materialsOf(r).map(function (m) {
    return '<a class="btn small outline" target="_blank" rel="noopener" onclick="event.stopPropagation()" href="' + safeUrl(m.href) + '">' + esc(m.name) + '</a>';
  }).join("");
}

/* ---------- PHOTO & PDF UPLOAD ---------- */

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

/** Photos are shrunk in the browser first (max 1000 px, JPEG), so uploads are light. */
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
  formUploading = true;
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
    formUploading = false;
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

/** Accepts a Drive file ID, or a direct image link (for example from HR). */
function imgUrl(id) {
  if (/^https:\/\/[^\s"'<>]+$/.test(id)) return id;
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

/** Link for href: only http(s) links, so a javascript: link from the sheet cannot run. */
function safeUrl(u) {
  const s = String(u == null ? "" : u).trim();
  return /^https?:\/\//i.test(s) ? esc(s) : "#";
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
