/* ---------- UPSELL TRACKER (editors) and MY UPSELL (staff) ----------
 * The tracker reads the POS sales report (xlsx) and the section board (pdf) in the browser.
 * Challenge items and targets: tab 11_UpsellToday. Target = the full target of the staff member's shift.
 * POS waiter name -> staff: tab 13_PosWaiterMap. Who is on duty and on which shift: the section board.
 * Saved results (Save results for this day) are read by staff in My Upsell and on Home. */

const TRACKER_XLSX_URL = "vendor/xlsx.full.min.js";
const TRACKER_PDF_URL = "./vendor/pdf.min.mjs";   // import() needs ./ in front
const TRACKER_PDF_WORKER_URL = "vendor/pdf.worker.min.mjs";
const ROSTER_SHIFTS = ["M6", "M7", "M8", "M11", "MD12", "E2", "EO"];

let tracker = { date: "", lines: null, salesName: "", roster: null, rosterName: "", rosterShifts: {}, staff: null, staffBusy: false, filter: "all", busy: "", unlinkedNames: [] };
let myUpsell = { recap: null, loading: false, date: "" };
let upsellSummary = null;
let upsellSummaryLoading = false;

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

/** Reads the section board: the full text, and the shift column of each staff member's name. */
async function readRosterFile(file) {
  const pdfjs = await loadPdfJs();
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const staff = tracker.staff || [];
  let text = "";
  const shifts = {};
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const items = (await page.getTextContent()).items
      .filter(i => i.str && i.str.trim())
      .map(i => ({ str: i.str.trim(), x: i.transform[4], y: i.transform[5], w: i.width || 0 }));
    text += items.map(i => i.str).join(" ") + " ";
    readShiftsFromItems(items, staff, shifts);
  }
  return { text: text, shifts: shifts };
}

/**
 * On one page: find each staff name in the board, and the shift header above it (M6, M7, ...)
 * whose column is closest to the name's centre. Names outside a shift table (notes, duties) are skipped.
 */
function readShiftsFromItems(items, staff, shifts) {
  const headers = items.filter(i => ROSTER_SHIFTS.indexOf(i.str) !== -1).map(h => ({ str: h.str, y: h.y, cx: h.x + h.w / 2 }));
  if (!headers.length) return;
  staff.forEach(function (s) {
    const key = trackerNameKey(s.name);
    if (!key || shifts[key]) return;
    for (let i = 0; i < items.length; i++) {
      if (!trackerNameKey(items[i].str)) continue;   // skip marks such as (7) or ★
      let joined = "";
      for (let k = i; k < items.length && k < i + 8; k++) {
        joined = trackerNameKey(joined + " " + items[k].str);
        if (joined === key) {
          const parts = items.slice(i, k + 1);
          const cx = parts.reduce((a, p) => a + p.x + p.w / 2, 0) / parts.length;
          const y = items[i].y;
          const above = headers.filter(h => h.y > y);
          if (!above.length) return;
          const hdrY = above.reduce((best, h) => (h.y - y < best.y - y ? h : best)).y;
          const cols = headers.filter(h => h.y === hdrY);
          const col = cols.reduce((best, h) => (Math.abs(h.cx - cx) < Math.abs(best.cx - cx) ? h : best));
          shifts[key] = col.str;
          return;
        }
        if (joined.length > key.length) break;
      }
    }
  });
}

/* ---------- MATCHING ---------- */

/** Challenge items for one date (names only). Targets are per shift, see shiftTarget. */
function challengeFor(dateIso) {
  const items = [];
  (appData.upsell || []).forEach(function (r) {
    if (!r.item || isoFromSheetDate(r.date) !== dateIso) return;
    if (!items.find(x => trackerNorm(x.item) === trackerNorm(r.item))) items.push({ item: r.item, unit: r.satuan || "" });
  });
  return items;
}

/** Full target of one item for one shift on one day. Every person on that shift gets this target. */
function shiftTarget(dateIso, item, shift) {
  return (appData.upsell || []).reduce(function (sum, r) {
    if (!r.item || isoFromSheetDate(r.date) !== dateIso) return sum;
    if (trackerNorm(r.shift) !== trackerNorm(shift) || trackerNorm(r.item) !== trackerNorm(item)) return sum;
    return sum + (Number(r.target) || 0);
  }, 0);
}

/** Shifts that have a target for one item on one day: [{ shift, target }]. */
function targetsByShift(dateIso, item) {
  const out = {};
  (appData.upsell || []).forEach(function (r) {
    if (!r.item || isoFromSheetDate(r.date) !== dateIso || trackerNorm(r.item) !== trackerNorm(item)) return;
    out[r.shift] = (out[r.shift] || 0) + (Number(r.target) || 0);
  });
  return Object.keys(out).map(s => ({ shift: s, target: out[s] }));
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
  const hits = (tracker.staff || []).filter(s => trackerNorm(s.nickname) === w || trackerNorm(s.name.split(" ")[0]) === w);
  return hits.length === 1 ? hits[0].nik : "";
}

/** Sold counts per POS waiter and per item for one day, linked to staff where a link exists. */
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

/** Shift of one staff member on the section board (M6, E2, ...), or "" if not found. */
function shiftOfStaff(staffName) {
  return (tracker.rosterShifts || {})[trackerNameKey(staffName)] || "";
}

function sumItems(items) {
  return Object.keys(items || {}).reduce((a, k) => a + items[k], 0);
}

function trackerDates() {
  const set = {};
  (tracker.lines || []).forEach(l => { if (l.date) set[l.date] = true; });
  return Object.keys(set).sort();
}

/* ---------- LOADING STAFF ---------- */

function ensureStaff() {
  if (tracker.staff) return Promise.resolve(tracker.staff);
  if (!tracker.staffBusy) {
    tracker.staffBusy = true;
    api("getStaffList", [sessionToken])
      .then(function (list) {
        tracker.staff = Array.isArray(list) ? list : [];
        tracker.staffBusy = false;
        renderTab();
      })
      .catch(function (e) {
        tracker.staffBusy = false;
        tracker.staff = tracker.staff || [];   // unblock waiting code; names will not be matched
        toast(e.message);
      });
  }
  return new Promise(function (resolve) {
    const timer = setInterval(function () {
      if (tracker.staff) { clearInterval(timer); resolve(tracker.staff); }
    }, 100);
  });
}

/* ---------- EDITOR SCREEN: UPSELL TRACKER ---------- */

function viewTracker() {
  if (!tracker.staff && !tracker.staffBusy) ensureStaff();
  const dates = trackerDates();
  if (!tracker.date && dates.length) tracker.date = dates[dates.length - 1];
  const items = tracker.date ? challengeFor(tracker.date) : [];

  let html = '<div class="page-heading"><h2>Upsell Tracker</h2>' +
    '<p>See who has sold the challenge items. Results are built from the uploaded files. Save a day to show it to staff.</p></div>' +
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
      ? '<div class="tracker-items">' + items.map(function (it) {
          const parts = targetsByShift(tracker.date, it.item).map(t => t.shift + " " + t.target).join(" · ");
          return '<span class="tracker-item">' + esc(it.item) + ' <small>' + esc(parts || "no target") + '</small></span>';
        }).join("") + '</div>'
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
    const s = staffByNik[nik] || { name: nik, nickname: "" };
    const p = res.people[nik] || { pos: [], items: {} };
    const shift = shiftOfStaff(s.name);
    const targets = {};
    items.forEach(it => { targets[it.item] = shift ? shiftTarget(tracker.date, it.item, shift) : 0; });
    return { nik: nik, name: s.name, shift: shift, pos: p.pos, items: p.items, targets: targets, total: sumItems(p.items), onRoster: onDuty.indexOf(nik) !== -1 };
  }).sort((a, b) => a.name.localeCompare(b.name));
  tracker.lastRows = rows;
  tracker.lastItems = items;

  const unlinkedNames = Object.keys(res.unlinked);
  tracker.unlinkedNames = unlinkedNames;
  const shown = rows.filter(r => tracker.filter === "all" || (tracker.filter === "sold" ? r.total > 0 : r.total === 0));
  const soldCount = rows.filter(r => r.total > 0).length;

  html += '<div class="tracker-summary">' +
    '<div><strong>' + soldCount + '</strong><span>sold</span></div>' +
    (tracker.roster ? '<div><strong>' + rows.filter(r => r.total === 0).length + '</strong><span>not sold yet</span></div>' : '') +
    items.map(it => '<div><strong>' + rows.reduce((a, r) => a + (r.items[it.item] || 0), 0) + '</strong><span>' + esc(it.item) + '</span></div>').join("") +
    '</div>';

  if (unlinkedNames.length) {
    html += '<div class="tracker-warn">' + unlinkedNames.length + ' POS name(s) not linked to staff yet, so these results are incomplete. Link them below the table.</div>';
  }
  html += '<div class="tracker-save"><button class="button-primary" type="button" onclick="saveTrackerDay()">Save results for this day</button>' +
    '<small class="muted">Staff can then see their own items and targets in My Upsell and on Home.</small></div>';

  html += '<div class="tracker-filter">' +
    '<button class="' + (tracker.filter === "all" ? "button-primary" : "button-secondary") + '" type="button" onclick="setTrackerFilter(\'all\')">All</button>' +
    '<button class="' + (tracker.filter === "sold" ? "button-primary" : "button-secondary") + '" type="button" onclick="setTrackerFilter(\'sold\')">Sold</button>' +
    (tracker.roster ? '<button class="' + (tracker.filter === "none" ? "button-primary" : "button-secondary") + '" type="button" onclick="setTrackerFilter(\'none\')">Not sold yet</button>' : '') +
    '</div>';

  html += '<div class="tracker-table"><table><thead><tr><th>Staff</th><th>Shift</th><th>Status</th><th>Challenge items (sold / target)</th><th class="numeric">Total</th></tr></thead><tbody>' +
    (shown.length ? shown.map(function (r) {
      const chips = items.filter(it => (r.items[it.item] || 0) > 0 || r.targets[it.item] > 0).map(function (it) {
        return '<span class="tracker-chip">' + esc(it.item) + ' <b>' + (r.items[it.item] || 0) + ' / ' + r.targets[it.item] + '</b></span>';
      }).join("");
      return '<tr><td><strong>' + esc(r.name) + '</strong>' + (r.pos.length ? '<br><small class="muted">POS: ' + esc(r.pos.join(", ")) + '</small>' : '') + '</td>' +
        '<td>' + (r.shift ? esc(r.shift) : '<small class="muted">not found</small>') + '</td>' +
        '<td>' + (r.total > 0 ? '<span class="badge ok">Sold</span>' : '<span class="badge off">Not sold yet</span>') +
        (r.onRoster || !tracker.roster ? '' : '<br><small class="muted">not on roster</small>') + '</td>' +
        '<td>' + (chips || '<span class="muted">—</span>') + '</td>' +
        '<td class="numeric">' + r.total + '</td></tr>';
    }).join("") : '<tr><td colspan="5" class="muted">No data for this filter.</td></tr>') +
    '</tbody></table></div>';

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

/** Save the current results: one row per staff member per challenge item, with that person's shift target. */
async function saveTrackerDay() {
  if (!tracker.roster) return toast("Upload the roster first, so staff who did not sell are saved as well.");
  if (!tracker.lastRows || !tracker.lastRows.length) return toast("No results to save for this date.");
  const withShift = tracker.lastRows.filter(r => r.shift);
  const skipped = tracker.lastRows.length - withShift.length;
  const rows = [];
  withShift.forEach(function (r) {
    tracker.lastItems.forEach(function (it) {
      rows.push({ nik: r.nik, name: r.name, item: it.item, sold: r.items[it.item] || 0, target: r.targets[it.item] || 0 });
    });
  });
  if (!rows.length) return toast("None of the staff have a shift on the roster.");
  const msg = "Save results for " + tracker.date + " (" + withShift.length + " staff)?" +
    (skipped ? " " + skipped + " staff without a shift on the roster will not be saved." : "") +
    " Results already saved for this date will be replaced.";
  if (!confirm(msg)) return;
  try {
    await api("saveUpsellDay", [sessionToken, tracker.date, rows]);
    toast("Saved " + withShift.length + " staff for " + tracker.date + ".");
  } catch (e) {
    if (isSessionExpired(e)) return handleApiError(e);
    toast(e.message);
  }
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
    await ensureStaff();
    const r = await readRosterFile(file);
    tracker.roster = r.text;
    tracker.rosterShifts = r.shifts;
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

/* ---------- STAFF SCREEN: MY UPSELL ---------- */

function recapChart(rows, label) {
  if (!rows.length) return "";
  const W = 640, H = 240, pad = 28, base = H - 34;
  const max = Math.max(1, ...rows.map(r => Math.max(r.sold, r.target)));
  const gap = (W - pad * 2) / rows.length;
  const bw = Math.max(6, Math.min(34, gap / 2.8));
  let svg = "";
  rows.forEach(function (r, i) {
    const cx = pad + i * gap + gap / 2;
    const hs = (r.sold / max) * (base - 14);
    const ht = (r.target / max) * (base - 14);
    svg += '<rect class="bar-target" x="' + (cx) + '" y="' + (base - ht) + '" width="' + bw + '" height="' + ht + '"><title>Target ' + r.target + '</title></rect>';
    svg += '<rect class="bar-sold" x="' + (cx - bw) + '" y="' + (base - hs) + '" width="' + bw + '" height="' + hs + '"><title>Sold ' + r.sold + '</title></rect>';
    svg += '<text class="bar-label" x="' + (cx) + '" y="' + (H - 10) + '" text-anchor="middle">' + esc(r.label) + '</text>';
  });
  svg += '<line class="bar-axis" x1="' + pad + '" x2="' + (W - pad) + '" y1="' + base + '" y2="' + base + '"/>';
  return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' + svg + '</svg>' +
    '<div class="chart-legend"><span><i class="key-sold"></i>Sold</span><span><i class="key-target"></i>Target</span></div>';
}

function shortDay(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.getDate() + " " + MONTHS_EN[d.getMonth()];
}

function viewMyUpsell() {
  let html = '<div class="page-heading"><h2>My Upsell</h2><p>Your challenge items, targets, and how many you sold.</p></div>';
  if (!myUpsell.recap) {
    loadMyRecap();
    return html + '<div class="empty">Loading…</div>';
  }
  const days = myUpsell.recap;
  if (!days.length) return html + '<div class="empty">No results have been saved for you yet.</div>';
  if (!days.some(d => d.date === myUpsell.date)) myUpsell.date = days[days.length - 1].date;
  const day = days.find(d => d.date === myUpsell.date);
  const sumOf = (list, key) => list.reduce((a, x) => a + x[key], 0);

  html += '<label class="tracker-step">Day<select class="input" onchange="onMyUpsellDate(this.value)">' +
    days.slice().reverse().map(d => '<option value="' + esc(d.date) + '"' + (d.date === myUpsell.date ? ' selected' : '') + '>' + esc(shortDay(d.date)) + ' ' + esc(d.date.slice(0, 4)) + '</option>').join("") +
    '</select></label>';

  const dayTarget = sumOf(day.items, "target"), daySold = sumOf(day.items, "sold");
  html += '<div class="tracker-summary">' +
    '<div><strong>' + daySold + ' / ' + dayTarget + '</strong><span>sold / target this day</span></div>' +
    '</div>';

  html += '<div class="tracker-card"><strong>This day: sold vs target</strong>' +
    recapChart(day.items.map(i => ({ label: i.item.length > 14 ? i.item.slice(0, 13) + "…" : i.item, sold: i.sold, target: i.target })), "Sold vs target for the day") +
    '</div>';

  const recent = days.slice(-14);
  html += '<div class="tracker-card"><strong>Last ' + recent.length + ' saved days</strong>' +
    recapChart(recent.map(d => ({ label: shortDay(d.date), sold: sumOf(d.items, "sold"), target: sumOf(d.items, "target") })), "Daily totals") +
    '</div>';

  html += '<div class="tracker-table"><table><thead><tr><th>Challenge item</th><th class="numeric">Target</th><th class="numeric">You sold</th></tr></thead><tbody>' +
    day.items.map(r => '<tr><td>' + esc(r.item) + '</td><td class="numeric">' + r.target + '</td><td class="numeric"><strong>' + r.sold + '</strong></td></tr>').join("") +
    '</tbody></table></div>';
  return html;
}

function loadMyRecap() {
  if (myUpsell.loading) return;
  myUpsell.loading = true;
  api("getMyUpsellRecap", [sessionToken])
    .then(function (days) {
      myUpsell.recap = Array.isArray(days) ? days : [];
      myUpsell.loading = false;
      renderTab();
    })
    .catch(function (e) {
      myUpsell.loading = false;
      if (isSessionExpired(e)) return handleApiError(e);
      toast(e.message);
    });
}

function onMyUpsellDate(d) {
  myUpsell.date = d;
  renderTab();
}

/* ---------- HOME: YESTERDAY ---------- */

function upsellSummaryHtml() {
  if (!upsellSummary) {
    loadUpsellSummary();
    return "";
  }
  const d = upsellSummary;
  if (d.failed) return "";
  const day = formatSheetDate(new Date(d.date + "T00:00:00"));
  if (!d.saved) {
    return '<div class="home-upsell">Yesterday (' + esc(day) + '): no upsell results saved yet.</div>';
  }
  const mine = d.mine ? 'You sold <strong>' + d.mySold + '</strong> of <strong>' + d.myTarget + '</strong> challenge items. ' : '';
  return '<div class="home-upsell">Yesterday (' + esc(day) + '): ' + mine +
    'Team sold <strong>' + d.teamSold + '</strong> of <strong>' + d.teamTarget + '</strong>.</div>';
}

function loadUpsellSummary() {
  if (upsellSummaryLoading) return;
  upsellSummaryLoading = true;
  api("getUpsellSummary", [sessionToken])
    .then(function (s) {
      upsellSummary = s;
      upsellSummaryLoading = false;
      renderTab();
    })
    .catch(function (e) {
      upsellSummaryLoading = false;
      upsellSummary = { failed: true };
      if (isSessionExpired(e)) handleApiError(e);
    });
}
