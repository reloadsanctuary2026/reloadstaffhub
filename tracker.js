/* ---------- UPSELL TRACKER (editors only) ----------
 * Reads the POS sales report (xlsx) and the section board (pdf) in the browser. Nothing is saved.
 * Challenge items: tab 11_UpsellToday. POS waiter name -> staff: tab 13_PosWaiterMap.
 * Who is on duty: staff whose full name appears in the section board. */

const TRACKER_XLSX_URL = "vendor/xlsx.full.min.js";
const TRACKER_PDF_URL = "./vendor/pdf.min.mjs";   // import() needs ./ in front
const TRACKER_PDF_WORKER_URL = "vendor/pdf.worker.min.mjs";

let tracker = { date: "", lines: null, salesName: "", roster: null, rosterName: "", staff: null, staffBusy: false, filter: "all", busy: "" };

/* ---------- READING FILES ---------- */

function loadXlsx() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  return new Promise(function (resolve, reject) {
    const s = document.createElement("script");
    s.src = TRACKER_XLSX_URL;
    s.onload = function () { resolve(window.XLSX); };
    s.onerror = function () { reject(new Error("The Excel reader could not be loaded.")); };
    document.head.appendChild(s);
  });
}

let pdfLib = null;
async function loadPdfJs() {
  if (!pdfLib) {
    pdfLib = await import(TRACKER_PDF_URL);
    pdfLib.GlobalWorkerOptions.workerSrc = TRACKER_PDF_WORKER_URL;
  }
  return pdfLib;
}

/** Excel date (serial number, or dd-mm-yyyy text) -> "2026-10-24". */
function excelDateToIso(v) {
  if (typeof v === "number") {
    return new Date(Math.floor(v - 25569) * 86400000).toISOString().slice(0, 10);
  }
  const m = String(v || "").trim().match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
  return m ? m[3] + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0") : "";
}

function trackerNorm(s) {
  return String(s == null ? "" : s).toLowerCase().replace(/\s+/g, " ").trim();
}

/** Letters only, single spaces. Used to find names in the section board text. */
function trackerNameKey(s) {
  return trackerNorm(s).replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
}

/** Sales Recapitulation Detail Report -> one entry per sale line that has a quantity. */
async function parseSalesFile(file) {
  const XLSX = await loadXlsx();
  // Only the cell values are needed. These options make reading the 14 MB report faster.
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array", dense: true, cellStyles: false, cellNF: false, cellText: false, cellHTML: false, cellFormula: false, sheetStubs: false });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true, defval: "" });
  const head = rows.findIndex(r => r[0] === "Sales Number");
  if (head === -1) throw new Error("This is not a Sales Recapitulation Detail Report (column 'Sales Number' is missing).");
  const col = name => rows[head].indexOf(name);
  const c = { date: col("Sales Date"), menu: col("Menu"), custom: col("Custom Menu Name"), qty: col("Qty"), waiter: col("Waiter") };
  if (Object.keys(c).some(k => c[k] === -1)) throw new Error("Some columns are missing in the sales report.");

  const lines = [];
  for (let i = head + 1; i < rows.length; i++) {
    const r = rows[i];
    const qty = Number(r[c.qty]) || 0;
    if (!qty || r[c.date] === "") continue;
    const waiter = String(r[c.waiter] == null ? "" : r[c.waiter]).trim();
    lines.push({
      date: excelDateToIso(r[c.date]),
      menu: String(r[c.menu] || ""),
      custom: String(r[c.custom] || ""),
      qty: qty,
      waiter: trackerNorm(waiter) === "-" ? "" : waiter
    });
  }
  return lines;
}

/** Section board PDF -> one text string (all pages). */
async function readRosterText(file) {
  const pdfjs = await loadPdfJs();
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  let text = "";
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    text += content.items.map(i => i.str).join(" ") + " ";
  }
  return text;
}

/* ---------- MATCHING ---------- */

/** Challenge items for one date, from tab 11_UpsellToday. Target = sum of all sessions/shifts. */
function challengeFor(dateIso) {
  const items = [];
  (appData.upsell || []).forEach(function (r) {
    if (!r.item || isoFromSheetDate(r.date) !== dateIso) return;
    let it = items.find(x => trackerNorm(x.item) === trackerNorm(r.item));
    if (!it) {
      it = { item: r.item, target: 0, unit: r.satuan || "" };
      items.push(it);
    }
    it.target += Number(r.target) || 0;
  });
  return items;
}

/** A POS menu counts for a challenge item when its name contains the item name (promo versions included). */
function matchesItem(line, item) {
  const it = trackerNorm(item);
  return trackerNorm(line.menu).indexOf(it) !== -1 || trackerNorm(line.custom).indexOf(it) !== -1;
}

function posMapIndex() {
  const map = {};
  (appData.posMap || []).forEach(function (r) {
    if (r.pos && r.nik) map[trackerNorm(r.pos)] = r.nik;
  });
  return map;
}

/** Suggestion for an unlinked POS name: one staff whose nickname or first name is the same. Not saved until confirmed. */
function suggestStaff(posName) {
  const w = trackerNorm(posName);
  const staff = tracker.staff || [];
  const hits = staff.filter(s => trackerNorm(s.nickname) === w || trackerNorm(s.name.split(" ")[0]) === w);
  return hits.length === 1 ? hits[0].nik : "";
}

/** Counts per POS waiter and per item for one day, linked to staff where a link exists. */
function trackerResults(dateIso, items) {
  const map = posMapIndex();
  const byWaiter = {};
  tracker.lines.forEach(function (l) {
    if (l.date !== dateIso || !l.waiter) return;
    items.forEach(function (it) {
      if (!matchesItem(l, it.item)) return;
      byWaiter[l.waiter] = byWaiter[l.waiter] || {};
      byWaiter[l.waiter][it.item] = (byWaiter[l.waiter][it.item] || 0) + l.qty;
    });
  });

  const people = {};    // nik -> { pos: [names], items: { item: qty } }
  const unlinked = {};  // POS name -> { items: { item: qty } }
  Object.keys(byWaiter).forEach(function (w) {
    const nik = map[trackerNorm(w)];
    if (!nik) {
      unlinked[w] = { items: byWaiter[w] };
      return;
    }
    people[nik] = people[nik] || { pos: [], items: {} };
    if (people[nik].pos.indexOf(w) === -1) people[nik].pos.push(w);
    Object.keys(byWaiter[w]).forEach(function (item) {
      people[nik].items[item] = (people[nik].items[item] || 0) + byWaiter[w][item];
    });
  });
  return { people: people, unlinked: unlinked };
}

/** Staff whose full name is on the section board. */
function onDutyNiks(staff, rosterText) {
  const text = " " + trackerNameKey(rosterText) + " ";
  return staff.filter(s => text.indexOf(" " + trackerNameKey(s.name) + " ") !== -1).map(s => s.nik);
}

function sumItems(items) {
  return Object.keys(items || {}).reduce((a, k) => a + items[k], 0);
}

/* ---------- SCREEN ---------- */

function trackerDates() {
  const set = {};
  (tracker.lines || []).forEach(l => { if (l.date) set[l.date] = true; });
  return Object.keys(set).sort();
}

function ensureTrackerStaff() {
  if (tracker.staff || tracker.staffBusy) return;
  tracker.staffBusy = true;
  api("getStaffList", [sessionToken])
    .then(function (list) {
      tracker.staff = Array.isArray(list) ? list : [];
      tracker.staffBusy = false;
      renderTab();
    })
    .catch(function (e) {
      tracker.staffBusy = false;
      toast(e.message);
    });
}

function viewTracker() {
  ensureTrackerStaff();
  const dates = trackerDates();
  if (!tracker.date && dates.length) tracker.date = dates[dates.length - 1];
  const items = tracker.date ? challengeFor(tracker.date) : [];

  let html = '<div class="page-heading"><h2>Upsell Tracker</h2>' +
    '<p>See who has sold the challenge items. Results are built from the uploaded files and are not saved.</p></div>' +
    '<div class="tracker-steps">' +
    '<label class="tracker-step">Date<input type="date" class="input" value="' + esc(tracker.date) + '" onchange="onTrackerDate(this.value)"></label>' +
    '<label class="tracker-step">Sales report (.xlsx)<input type="file" accept=".xlsx" onchange="onTrackerSales(this)">' +
      '<small>' + esc(tracker.salesName || "No file yet") + (tracker.lines ? " · " + dates.length + " days, " + tracker.lines.length + " rows" : "") + '</small></label>' +
    '<label class="tracker-step">Roster / section board (.pdf, optional)<input type="file" accept=".pdf" onchange="onTrackerRoster(this)">' +
      '<small>' + esc(tracker.rosterName || "No file yet. Without a roster, only staff who sold are shown.") + '</small></label>' +
    '</div>';

  if (tracker.busy) return html + '<div class="empty">' + esc(tracker.busy) + '</div>';
  if (!tracker.lines) return html + '<div class="empty">Upload the sales report to start.</div>';

  html += '<div class="tracker-card"><strong>Challenge items for this date</strong>' +
    (items.length
      ? '<div class="tracker-items">' + items.map(it =>
          '<span class="tracker-item">' + esc(it.item) + ' <small>target ' + it.target + ' ' + esc(it.unit) + '</small></span>').join("") + '</div>'
      : '<p class="muted small">No challenge list for this date in tab 11_UpsellToday yet.</p>') +
    '</div>';

  if (!items.length) return html;
  if (!tracker.staff) return html + '<div class="empty">Loading staff list…</div>';

  const res = trackerResults(tracker.date, items);
  const onDuty = tracker.roster ? onDutyNiks(tracker.staff, tracker.roster) : [];
  const nikList = {};
  onDuty.forEach(n => { nikList[n] = true; });
  Object.keys(res.people).forEach(n => { nikList[n] = true; });
  const staffByNik = {};
  tracker.staff.forEach(s => { staffByNik[s.nik] = s; });

  const rows = Object.keys(nikList).map(function (nik) {
    const p = res.people[nik] || { pos: [], items: {} };
    const total = sumItems(p.items);
    return { nik: nik, name: (staffByNik[nik] || {}).name || nik, pos: p.pos, items: p.items, total: total, onRoster: onDuty.indexOf(nik) !== -1 };
  }).sort((a, b) => a.name.localeCompare(b.name));

  const unlinkedCount = Object.keys(res.unlinked).length;
  const shown = rows.filter(r => tracker.filter === "all" || (tracker.filter === "sold" ? r.total > 0 : r.total === 0));
  const soldCount = rows.filter(r => r.total > 0).length;

  html += '<div class="tracker-summary">' +
    '<div><strong>' + soldCount + '</strong><span>sold</span></div>' +
    (tracker.roster ? '<div><strong>' + rows.filter(r => r.total === 0).length + '</strong><span>not sold yet</span></div>' : '') +
    items.map(it => '<div><strong>' + rows.reduce((a, r) => a + (r.items[it.item] || 0), 0) + '</strong><span>' + esc(it.item) + '</span></div>').join("") +
    '</div>';

  if (unlinkedCount) {
    html += '<div class="tracker-warn">' + unlinkedCount + ' POS name(s) not linked to staff yet, so these results are incomplete. Link them below the table.</div>';
  }
  html += '<div class="tracker-save"><button class="button-primary" type="button" onclick="saveTrackerDay()">Save results for this day</button>' +
    '<small class="muted">Staff can then see their own items and targets in My Upsell.</small></div>';

  html += '<div class="tracker-filter">' +
    '<button class="' + (tracker.filter === "all" ? "button-primary" : "button-secondary") + '" type="button" onclick="setTrackerFilter(\'all\')">All</button>' +
    '<button class="' + (tracker.filter === "sold" ? "button-primary" : "button-secondary") + '" type="button" onclick="setTrackerFilter(\'sold\')">Sold</button>' +
    (tracker.roster ? '<button class="' + (tracker.filter === "none" ? "button-primary" : "button-secondary") + '" type="button" onclick="setTrackerFilter(\'none\')">Not sold yet</button>' : '') +
    '</div>';

  html += '<div class="tracker-table"><table><thead><tr><th>Staff</th><th>Status</th><th>Challenge items</th><th class="numeric">Total</th></tr></thead><tbody>' +
    (shown.length ? shown.map(function (r) {
      const chips = Object.keys(r.items).map(k => '<span class="tracker-chip">' + esc(k) + ' <b>' + r.items[k] + '</b></span>').join("");
      return '<tr><td><strong>' + esc(r.name) + '</strong>' + (r.pos.length ? '<br><small class="muted">POS: ' + esc(r.pos.join(", ")) + '</small>' : '') + '</td>' +
        '<td>' + (r.total > 0 ? '<span class="badge ok">Sold</span>' : '<span class="badge off">Not sold yet</span>') +
        (r.onRoster || !tracker.roster ? '' : '<br><small class="muted">not on roster</small>') + '</td>' +
        '<td>' + (chips || '<span class="muted">—</span>') + '</td>' +
        '<td class="numeric">' + r.total + '</td></tr>';
    }).join("") : '<tr><td colspan="4" class="muted">No data for this filter.</td></tr>') +
    '</tbody></table></div>';

  const unlinkedNames = Object.keys(res.unlinked);
  tracker.unlinkedNames = unlinkedNames;
  if (unlinkedNames.length) {
    html += '<div class="tracker-card tracker-link"><strong>POS names not linked to staff yet</strong>' +
      '<p class="muted small">Link each name once. After that it is counted automatically on later days.</p>' +
      unlinkedNames.map(function (w, i) {
        const sugg = suggestStaff(w);
        const opts = '<option value="">Choose staff…</option>' + tracker.staff.slice().sort((a, b) => a.name.localeCompare(b.name)).map(s =>
          '<option value="' + esc(s.nik) + '"' + (s.nik === sugg ? ' selected' : '') + '>' + esc(s.name) + '</option>').join("");
        return '<div class="tracker-link-row"><span><strong>' + esc(w) + '</strong> <small class="muted">' + sumItems(res.unlinked[w].items) + ' challenge items' + (sugg ? ' · suggested' : '') + '</small></span>' +
          '<select id="map-' + i + '">' + opts + '</select>' +
          '<button class="button-secondary" type="button" onclick="saveWaiterMap(' + i + ')">Save</button></div>';
      }).join("") + '</div>';
  }
  return html;
}

function setTrackerFilter(f) {
  tracker.filter = f;
  renderTab();
}

async function onTrackerSales(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  tracker.busy = "Reading the sales report… (large files can take a few seconds)";
  renderTab();
  try {
    tracker.lines = await parseSalesFile(file);
    tracker.salesName = file.name;
    const dates = trackerDates();
    tracker.date = dates.length ? dates[dates.length - 1] : "";
  } catch (e) {
    tracker.lines = null;
    toast(e.message);
  }
  tracker.busy = "";
  renderTab();
}

async function onTrackerRoster(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  tracker.busy = "Reading roster…";
  renderTab();
  try {
    tracker.roster = await readRosterText(file);
    tracker.rosterName = file.name;
  } catch (e) {
    tracker.roster = null;
    toast("The roster could not be read: " + e.message);
  }
  tracker.busy = "";
  renderTab();
}

function onTrackerDate(v) {
  tracker.date = v;
  renderTab();
}

/** Save one link POS name -> staff in tab 13_PosWaiterMap. */
async function saveWaiterMap(i) {
  const posName = tracker.unlinkedNames[i];
  const nik = document.getElementById("map-" + i).value;
  const staff = (tracker.staff || []).find(s => s.nik === nik);
  if (!staff) return toast("Choose a staff member first.");
  try {
    await api("addRow", [sessionToken, "posMap", { pos: posName, nik: nik, name: staff.name }]);
    toast("Saved: " + posName + " → " + staff.name);
    refreshSheet("posMap");
  } catch (e) {
    if (isSessionExpired(e)) return handleApiError(e);
    toast(e.message);
  }
}


/* ---------- SAVE A DAY (editors) ---------- */

/** Save the current results: one row per staff member per challenge item, including zeros. Replaces that date. */
async function saveTrackerDay() {
  if (!tracker.roster) return toast("Upload the roster first, so staff who did not sell are saved as well.");
  const items = challengeFor(tracker.date);
  if (!items.length) return toast("No challenge list for this date.");
  const res = trackerResults(tracker.date, items);
  const niks = Array.from(new Set(onDutyNiks(tracker.staff || [], tracker.roster).concat(Object.keys(res.people))));
  const names = {};
  (tracker.staff || []).forEach(s => { names[s.nik] = s.name; });
  const rows = [];
  niks.forEach(function (nik) {
    items.forEach(function (it) {
      const p = res.people[nik];
      rows.push({ nik: nik, name: names[nik] || "", item: it.item, sold: (p && p.items[it.item]) || 0, target: it.target });
    });
  });
  if (!confirm("Save results for " + tracker.date + " (" + niks.length + " staff)? Results already saved for this date will be replaced.")) return;
  try {
    await api("saveUpsellDay", [sessionToken, tracker.date, rows]);
    toast("Saved " + niks.length + " staff for " + tracker.date + ".");
  } catch (e) {
    if (isSessionExpired(e)) return handleApiError(e);
    toast(e.message);
  }
}

/* ---------- MY UPSELL (all staff, own rows only) ---------- */

let myUpsell = { dates: null, loading: false, date: "", rowsDate: "", rows: null };

function viewMyUpsell() {
  let html = '<div class="page-heading"><h2>My Upsell</h2><p>Your challenge items for each day, with the target and how many you sold.</p></div>';
  if (!myUpsell.dates) {
    loadMyUpsellDates();
    return html + '<div class="empty">Loading…</div>';
  }
  if (!myUpsell.dates.length) return html + '<div class="empty">No results have been saved yet.</div>';
  if (!myUpsell.date || myUpsell.dates.indexOf(myUpsell.date) === -1) myUpsell.date = myUpsell.dates[0];

  html += '<label class="tracker-step">Day<select class="input" onchange="onMyUpsellDate(this.value)">' +
    myUpsell.dates.map(d => '<option value="' + esc(d) + '"' + (d === myUpsell.date ? ' selected' : '') + '>' + esc(d) + '</option>').join("") +
    '</select></label>';

  if (myUpsell.rowsDate !== myUpsell.date) loadMyUpsellRows();
  if (!myUpsell.rows) return html + '<div class="empty">Loading…</div>';
  if (!myUpsell.rows.length) return html + '<div class="empty">No challenge items were saved for you on this day.</div>';

  const sold = myUpsell.rows.reduce((a, r) => a + r.sold, 0);
  html += '<div class="tracker-summary"><div><strong>' + sold + '</strong><span>items you sold</span></div></div>';
  html += '<div class="tracker-table"><table><thead><tr><th>Challenge item</th><th class="numeric">Target</th><th class="numeric">You sold</th></tr></thead><tbody>' +
    myUpsell.rows.map(r => '<tr><td>' + esc(r.item) + '</td><td class="numeric">' + r.target + '</td><td class="numeric"><strong>' + r.sold + '</strong></td></tr>').join("") +
    '</tbody></table></div>';
  return html;
}

function loadMyUpsellDates() {
  if (myUpsell.loading) return;
  myUpsell.loading = true;
  api("getMyUpsellDates", [sessionToken])
    .then(function (dates) {
      myUpsell.dates = Array.isArray(dates) ? dates : [];
      myUpsell.loading = false;
      renderTab();
    })
    .catch(function (e) {
      myUpsell.loading = false;
      if (isSessionExpired(e)) return handleApiError(e);
      toast(e.message);
    });
}

function loadMyUpsellRows() {
  const date = myUpsell.date;
  myUpsell.rowsDate = date;
  myUpsell.rows = null;
  api("getMyUpsellDay", [sessionToken, date])
    .then(function (rows) {
      if (myUpsell.date !== date) return;   // the user picked another day meanwhile
      myUpsell.rows = Array.isArray(rows) ? rows : [];
      renderTab();
    })
    .catch(function (e) {
      if (isSessionExpired(e)) return handleApiError(e);
      toast(e.message);
    });
}

function onMyUpsellDate(d) {
  myUpsell.date = d;
  renderTab();
}
