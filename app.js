/****************************************
 * RELOAD STAFF HUB — FRONTEND (GitHub Pages)
 ****************************************/

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

let sessionToken = readStore_("rsh_token");
let appData = null;
let activeTab = "home";
let searchText = "";

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
  document.getElementById("loginBtn").addEventListener("click", doLogin);
  document.getElementById("loginPin").addEventListener("keydown", function (e) {
    if (e.key === "Enter") doLogin();
  });
  document.getElementById("logoutBtn").addEventListener("click", doLogout);

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
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("appShell").classList.remove("hidden");
  document.getElementById("userBadge").innerText = user.name + " · " + user.tier;
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
  writeStore_("rsh_token", null);
  appData = null;
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
      '" onclick="showTab(\'' + t.key + '\')">' + t.label + '</button>';
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
    app.innerHTML = '<p class="caption">Memuat data...</p>';
    return;
  }

  let html = "";
  if (activeTab === "home")          html = viewHome();
  else if (activeTab === "food")     html = viewSearchable("Food Bible");
  else if (activeTab === "beverage") html = viewSearchable("Beverage Bible");
  else if (activeTab === "sop")      html = viewSearchable("SOP");
  else if (activeTab === "teams")    html = viewTeams();
  else if (activeTab === "academy")  html = viewSearchable("Reload Academy");
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

  return (quote
      ? '<div class="card quote"><p>"' + esc(quote.quote) + '"</p><span class="caption">— ' + esc(quote.author) + '</span></div>'
      : '') +

    '<h2 class="section-title">Important Info</h2>' +
    (info
      ? '<div class="card"><div class="caption">' + esc(info.date) + '</div>' +
        '<strong>' + esc(info.title) + '</strong>' +
        '<p class="pre">' + esc(info.description) + '</p></div>'
      : '<div class="card caption">Tidak ada info aktif.</div>') +

    '<h2 class="section-title">Staff Bulletin</h2>' +
    (news.length
      ? news.map(r =>
          '<div class="card"><div class="caption">' + esc(r.date) + ' · ' + esc(r.type) + '</div>' +
          '<strong>' + esc(r.title) + '</strong>' +
          '<p class="pre">' + esc(r.description) + '</p></div>'
        ).join("")
      : '<div class="card caption">Belum ada bulletin aktif.</div>');
}

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 11) return "Morning";
  if (h < 15) return "Afternoon";
  if (h < 19) return "Evening";
  return "Night";
}

/* ---------- MENU / SOP / ACADEMY (ada pencarian) ---------- */

function viewSearchable(title) {
  return '<h2 class="section-title">' + esc(title) + '</h2>' +
    '<input class="input" type="search" placeholder="Cari..." value="' + esc(searchText) +
    '" oninput="onSearch(this.value)">' +
    '<div id="listArea">' + listHtml() + '</div>';
}

function onSearch(value) {
  searchText = value.trim().toLowerCase();
  document.getElementById("listArea").innerHTML = listHtml();
}

function listHtml() {
  if (activeTab === "food")     return menuList(appData.food);
  if (activeTab === "beverage") return menuList(appData.beverage);
  if (activeTab === "sop")      return sopList();
  if (activeTab === "academy")  return academyList();
  return "";
}

function matches(fields) {
  return fields.join(" ").toLowerCase().indexOf(searchText) !== -1;
}

function menuList(rows) {
  const items = rows.filter(r => r.name && matches([r.category, r.name, r.description]));
  if (!items.length) return emptyState();

  return groupBy(items, "category").map(g =>
    '<h3 class="group">' + esc(g.key) + '</h3>' +
    g.items.map(r =>
      '<div class="card item">' +
        (r.image ? '<img class="thumb" src="' + imgUrl(r.image) + '" alt="">' : '') +
        '<div class="item-body">' +
          '<div class="row-between"><strong>' + esc(r.name) + '</strong>' +
          '<span class="price">Rp ' + esc(r.price) + '</span></div>' +
          '<p class="caption pre">' + esc(r.description) + '</p>' +
          (r.allergens ? '<p class="allergen">Alergen: ' + esc(r.allergens) + '</p>' : '') +
        '</div>' +
      '</div>'
    ).join("")
  ).join("");
}

function sopList() {
  const items = appData.sop.filter(r => r.name && r.file && matches([r.category, r.name, r.description]));
  if (!items.length) return emptyState();

  return groupBy(items, "category").map(g =>
    '<h3 class="group">' + esc(g.key) + '</h3>' +
    g.items.map(r =>
      '<a class="card link-card" target="_blank" rel="noopener" href="https://drive.google.com/file/d/' +
        encodeURIComponent(r.file) + '/view">' +
        '<strong>' + esc(r.name) + '</strong>' +
        '<div class="caption">Update: ' + esc(r.updated) + '</div>' +
      '</a>'
    ).join("")
  ).join("");
}

function academyList() {
  const items = appData.academy.filter(r => r.title && matches([r.category, r.title, r.shortDesc]));
  if (!items.length) return emptyState();

  return groupBy(items, "category").map(g =>
    '<h3 class="group">' + esc(g.key) + '</h3>' +
    g.items.map(r =>
      '<div class="card">' +
        '<div class="row-between"><strong>' + esc(r.title) + '</strong>' +
        (r.knowledge === "YES" ? '<span class="badge">Knowledge of the Week</span>' : '') + '</div>' +
        (r.shortDesc ? '<p class="caption">' + esc(r.shortDesc) + '</p>' : '') +
        '<div class="caption">' + esc(r.difficulty) + (r.readingTime ? ' · ' + esc(r.readingTime) : '') + '</div>' +
        (r.content ? '<p class="pre">' + esc(r.content) + '</p>' : '') +
        '<div class="actions">' +
          (r.video ? '<a class="btn small" target="_blank" rel="noopener" href="' + esc(r.video) + '">Tonton video</a>' : '') +
          (r.fullLink ? '<a class="btn small outline" target="_blank" rel="noopener" href="' + esc(r.fullLink) + '">Baca materi</a>' : '') +
        '</div>' +
      '</div>'
    ).join("")
  ).join("");
}

/* ---------- TEAMS / GUESTS / ABOUT ---------- */

function viewTeams() {
  const rows = appData.teams.filter(r => r.name);
  if (!rows.length) return emptyState();

  return '<h2 class="section-title">Our Teams</h2>' +
    groupBy(rows, "department").map(g =>
      '<h3 class="group">' + esc(g.key) + '</h3>' +
      g.items.map(r =>
        '<div class="card team">' +
          (r.image
            ? '<img class="avatar" src="' + imgUrl(r.image) + '" alt="">'
            : '<div class="avatar"></div>') +
          '<div class="team-body">' +
            '<strong>' + esc(r.name) + '</strong>' +
            '<div class="caption">' + esc(r.position) + '</div>' +
            (r.phone
              ? '<a class="caption" target="_blank" rel="noopener" href="https://wa.me/' +
                esc(r.phone.replace(/\D/g, "")) + '">WhatsApp</a>'
              : '') +
          '</div>' +
        '</div>'
      ).join("")
    ).join("");
}

function viewGuests() {
  const rows = appData.guests.filter(r => r.status === "ACTIVE");
  if (!rows.length) return '<h2 class="section-title">Guest Notes</h2>' + emptyState();

  return '<h2 class="section-title">Guest Notes</h2>' +
    rows.map(r =>
      '<div class="card item">' +
        (r.image ? '<img class="thumb" src="' + imgUrl(r.image) + '" alt="">' : '') +
        '<div class="item-body">' +
          '<div class="row-between"><strong>' + esc(r.guest) + '</strong>' +
          '<span class="badge">' + esc(r.category) + '</span></div>' +
          '<div class="caption">' + esc(r.date) + (r.title ? ' · ' + esc(r.title) : '') + '</div>' +
          '<p class="pre">' + esc(r.description) + '</p>' +
        '</div>' +
      '</div>'
    ).join("");
}

function viewAbout() {
  return '<h2 class="section-title">About Reload</h2>' +
    appData.about.filter(r => r.section).map(r =>
      '<div class="card"><strong>' + esc(r.section) + '</strong>' +
      '<p class="pre">' + esc(r.content) + '</p></div>'
    ).join("");
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

function emptyState() {
  return '<div class="card caption">Tidak ada hasil.</div>';
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
