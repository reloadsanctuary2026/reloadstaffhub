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

/** Servers are the only ones in the Upsell Tracker and My Upsell. */
function isServerTitle(title) {
  return /waiter|waitress|server/i.test(String(title || ""));
}

/** Upsell Tracker counts servers, waiters, waitresses, and runners. */
function isTrackerStaffTitle(title) {
  return /waiter|waitress|server|runner/i.test(String(title || ""));
}

/** Staff whose job title is a counted role. The tracker only works with these people. */
function serverStaff() {
  return (tracker.staff || []).filter(s => isTrackerStaffTitle(s.jobTitle));
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
  const staff = serverStaff();
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
/** Which dates do have Upsell Today items, so a wrong date is easy to spot. */
function upsellDatesHint() {
  const dates = [...new Set((appData.upsell || []).map(r => isoFromSheetDate(r.date)).filter(Boolean))].sort();
  if (!dates.length) return " Tab 11_UpsellToday has no rows at all.";
  return " Dates that do have items: " + dates.slice(-5).map(x => formatSheetDate(new Date(x + "T00:00:00"))).join(", ") + ".";
}

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

/** Name for matching: lower case, no accents, single spaces, and no tags in brackets such as (PACKAGE) or (PROMO). */
function menuKey(s) {
  return String(s == null ? "" : s)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/–/g, "-")
    .toLowerCase()
    .replace(/(\s*\([^()]*\))+\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** A POS menu counts for a challenge item when the names are the same once tags and accents are ignored.
 *  "CAULIFLOWER 80G" matches "CAULIFLOWER 80G (PACKAGE)". "Coke" does not match "Coke Zero". */
function matchesItem(line, item) {
  const it = menuKey(item);
  if (!it) return false;
  return menuKey(line.menu) === it || menuKey(line.custom) === it;
}

/** Protein Bar and PB are another outlet. Their menus are not used for the server upsell. */
function isOtherOutlet(name) {
  return /\(\s*(protein bar|pb)\s*\)/i.test(String(name || ""));
}

/** Menu name for the dropdown: without (PACKAGE), and each name once. */
function dropdownName(s) {
  return String(s == null ? "" : s).replace(/\s*\(package\)\s*$/i, "").replace(/\s+/g, " ").trim();
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
  const hits = serverStaff().filter(s => trackerNorm(s.nickname) === w || trackerNorm(s.name.split(" ")[0]) === w);
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
    if (nik === "-") return;   // marked as not a server
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
      : '<p class="muted small">No challenge list for ' + esc(tracker.date) + ' in tab 11_UpsellToday yet.' + upsellDatesHint() + '</p>') +
    '</div>';

  if (!items.length) return html;
  if (!tracker.staff) return html + '<div class="empty">Loading staff list…</div>';

  const res = trackerResults(tracker.date, items);
  const servers = serverStaff();
  const serverNik = {};
  servers.forEach(s => { serverNik[s.nik] = true; });
  const onDuty = tracker.roster ? onDutyNiks(servers, tracker.roster) : [];
  const nikList = {};
  onDuty.forEach(n => { nikList[n] = true; });
  Object.keys(res.people).filter(n => serverNik[n]).forEach(n => { nikList[n] = true; });
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
  html += '<div class="tracker-save"><button class="button-primary" type="button" onclick="saveTrackerDay()">Save results for this day</button> <button class="button-secondary" type="button" onclick="downloadTrackerReport()">Download PDF report</button>' +
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
        const opts = '<option value="">Choose a server…</option>' + servers.slice().sort((a, b) => a.name.localeCompare(b.name)).map(s =>
          '<option value="' + esc(s.nik) + '"' + (s.nik === sugg ? ' selected' : '') + '>' + esc(s.name) + '</option>').join("") +
          '<option value="__ignore__">Not a server (ignore this name)</option>';
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
      rows.push({ nik: r.nik, name: r.name, shift: r.shift, item: it.item, sold: r.items[it.item] || 0, target: r.targets[it.item] || 0 });
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
    saveMenuNamesFromLines(tracker.lines);
    const dates = trackerDates();
    tracker.date = dates.length ? dates[dates.length - 1] : "";
  } catch (e) {
    tracker.lines = null;
    toast(e.message);
  }
  tracker.busy = "";
  renderTab();
}

/** Menu names from the POS report go to 16_PosMenus, so the Upsell item dropdown can use them. */
function saveMenuNamesFromLines(lines) {
  const names = [];
  lines.forEach(function (l) {
    const name = dropdownName(l.menu);
    if (name && !isOtherOutlet(l.menu) && names.indexOf(name) === -1) names.push(name);
  });
  if (!names.length) return;
  api("saveMenuNames", [sessionToken, names])
    .then(function (r) { if (r.added) toast(r.added + " new menu name(s) added to the item list."); })
    .catch(function (e) { if (!isSessionExpired(e)) toast(e.message); });
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
  if (nik === "__ignore__") {
    try {
      await api("addRow", [sessionToken, "posMap", { pos: posName, nik: "-", name: "Not a server" }]);
      toast("Ignored: " + posName);
      refreshSheet("posMap");
    } catch (e) {
      if (isSessionExpired(e)) return handleApiError(e);
      toast(e.message);
    }
    return;
  }
  const staff = serverStaff().find(s => s.nik === nik);
  if (!staff) return toast("Choose a server first.");
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
  if (myUpsell.error) return html + '<div class="empty">Could not load your results: ' + esc(myUpsell.error) + '<br><small>If this keeps happening, the backend (Code.gs) may need to be updated to 2.34.0 and redeployed.</small></div>';
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
      myUpsell.error = e.message;   // show it instead of loading again and again
      renderTab();
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


/* ---------- DAILY PDF REPORT (editors) ----------
 * The report is built from the saved day. A new tab opens with a print-ready page (A4, brand colours).
 * The browser's "Save as PDF" in the print dialog makes the file. */

const REPORT_LOGO_SVG = '<svg viewBox="0 0 953 958" aria-hidden="true"><path d="M0 0H620A292 295 0 0 1 660 592L950 955H725L455 620H258L155 480H560A170 170 0 0 0 570 142H0Z"/></svg>';
const REPORT_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function buildUpsellReportHtml(rep) {
  const staff = rep.staff || [];
  const sold = staff.filter(s => s.sold > 0).length;
  const notSold = staff.length - sold;
  const totalSold = staff.reduce((a, s) => a + s.sold, 0);
  const totalTarget = staff.reduce((a, s) => a + s.target, 0);
  const pct = totalTarget ? Math.round((totalSold / totalTarget) * 100) : 0;

  // per menu: sold and target over all staff
  const byItem = {};
  const itemOrder = [];
  staff.forEach(function (s) {
    s.items.forEach(function (i) {
      if (!byItem[i.item]) { byItem[i.item] = { item: i.item, sold: 0, target: 0 }; itemOrder.push(i.item); }
      byItem[i.item].sold += i.sold;
      byItem[i.item].target += i.target;
    });
  });

  const d = new Date(rep.date + "T00:00:00");
  const dateLabel = REPORT_DAYS[d.getDay()] + ", " + formatSheetDate(d);

  const itemRows = itemOrder.map(function (k) {
    const r = byItem[k];
    const p = r.target ? Math.round((r.sold / r.target) * 100) : 0;
    return '<tr><td>' + esc(r.item) + '</td><td class="num">' + r.sold + '</td><td class="num">' + r.target + '</td><td class="num">' + p + '%</td></tr>';
  }).join("");

  const staffRows = staff.map(function (s) {
    const chips = s.items.map(i => '<span class="chip">' + esc(i.item) + ' <b>' + i.sold + '/' + i.target + '</b></span>').join("");
    const status = s.sold > 0 ? '<span class="pill sold">Sold</span>' : '<span class="pill none">Not sold yet</span>';
    return '<tr><td><strong>' + esc(s.name) + '</strong></td><td>' + esc(s.shift || "—") + '</td><td>' + status + '</td><td>' + (chips || '—') + '</td><td class="num">' + s.sold + ' / ' + s.target + '</td></tr>';
  }).join("");

  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>Upsell Report ' + esc(rep.date) + '</title>' +
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap">' +
    '<style>' +
    '@page { size: A4; margin: 0; }' +
    '* { box-sizing: border-box; }' +
    'body { margin: 0; font-family: Poppins, "Segoe UI", Arial, sans-serif; color: #2b211b; background: #f3ede6; }' +
    '.page { width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; }' +
    '.band { background: #030303; color: #DECAB8; padding: 26px 30px; display: flex; align-items: center; gap: 16px; }' +
    '.band svg { width: 44px; height: 44px; fill: #DECAB8; flex: none; }' +
    '.band h1 { margin: 0; font-size: 22px; font-weight: 700; }' +
    '.band .tag { color: #AA7655; font-size: 11px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; margin-top: 3px; }' +
    '.band .date { margin-left: auto; text-align: right; font-size: 13px; }' +
    '.body { padding: 22px 30px; }' +
    '.cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }' +
    '.card { background: #faf6f1; border-top: 3px solid #AA7655; border-radius: 6px; padding: 12px 14px; }' +
    '.card b { display: block; font-size: 24px; color: #2b211b; }' +
    '.card span { font-size: 11px; color: #7a6a5e; text-transform: uppercase; letter-spacing: .06em; }' +
    'h2 { font-size: 13px; color: #AA7655; text-transform: uppercase; letter-spacing: .12em; margin: 18px 0 8px; }' +
    'table { width: 100%; border-collapse: collapse; font-size: 12px; }' +
    'th { background: #030303; color: #DECAB8; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .08em; padding: 8px 10px; }' +
    'td { padding: 8px 10px; border-bottom: 1px solid #eadfd3; vertical-align: top; }' +
    'tr { break-inside: avoid; }' +
    '.num { text-align: right; white-space: nowrap; }' +
    '.chip { display: inline-block; background: #f6ece3; color: #5b4636; border-radius: 999px; padding: 2px 8px; margin: 2px 4px 2px 0; font-size: 11px; }' +
    '.chip b { color: #AA7655; }' +
    '.pill { display: inline-block; border-radius: 999px; padding: 3px 10px; font-size: 11px; font-weight: 600; }' +
    '.pill.sold { background: #AA7655; color: #fff; }' +
    '.pill.none { background: #ece6e0; color: #6b5a4e; }' +
    '.foot { margin-top: 22px; padding-top: 10px; border-top: 1px solid #eadfd3; font-size: 10px; color: #8a7a6e; display: flex; justify-content: space-between; }' +
    '.noprint { text-align: center; padding: 14px; }' +
    '.noprint button { font-family: inherit; background: #AA7655; color: #fff; border: 0; border-radius: 999px; padding: 10px 22px; font-size: 14px; cursor: pointer; }' +
    '@media print { body { background: #fff; } .noprint { display: none; } .page { margin: 0; width: auto; min-height: 0; } }' +
    '</style></head><body>' +
    '<div class="noprint"><button onclick="window.print()">Print / Save as PDF</button></div>' +
    '<div class="page">' +
    '<div class="band">' + REPORT_LOGO_SVG + '<div><h1>Reload Staff Hub</h1><div class="tag">Upsell Report</div></div>' +
    '<div class="date"><strong>' + esc(dateLabel) + '</strong><br>Challenge items · servers</div></div>' +
    '<div class="body">' +
    '<div class="cards">' +
    '<div class="card"><b>' + staff.length + '</b><span>Servers on report</span></div>' +
    '<div class="card"><b>' + sold + '</b><span>Sold</span></div>' +
    '<div class="card"><b>' + notSold + '</b><span>Not sold yet</span></div>' +
    '<div class="card"><b>' + totalSold + ' / ' + totalTarget + '</b><span>Items sold / target (' + pct + '%)</span></div>' +
    '</div>' +
    '<h2>By challenge item</h2>' +
    '<table><thead><tr><th>Item</th><th class="num">Sold</th><th class="num">Target</th><th class="num">Achieved</th></tr></thead><tbody>' + (itemRows || '<tr><td colspan="4">No items</td></tr>') + '</tbody></table>' +
    '<h2>By server</h2>' +
    '<table><thead><tr><th>Server</th><th>Shift</th><th>Status</th><th>Items (sold / target)</th><th class="num">Total</th></tr></thead><tbody>' + (staffRows || '<tr><td colspan="5">No results</td></tr>') + '</tbody></table>' +
    '<div class="foot"><span>Saved by ' + esc(rep.savedBy || "—") + ' · Printed by ' + esc(rep.generatedBy) + ' · ' + esc(rep.generatedAt) + '</span><span>Reload Staff Hub</span></div>' +
    '</div></div></body></html>';
}

async function downloadTrackerReport() {
  if (!tracker.date) return toast("Choose a date first.");
  try {
    const rep = await api("getUpsellDayReport", [sessionToken, tracker.date]);
    if (!rep.staff.length) return toast("No saved results for this date yet. Save the results first.");
    const w = window.open("", "_blank");
    if (!w) return toast("Allow pop-ups to open the report.");
    w.document.open();
    w.document.write(buildUpsellReportHtml(rep));
    w.document.close();
  } catch (e) {
    if (isSessionExpired(e)) return handleApiError(e);
    toast(e.message);
  }
}

/* ---------- SCHEDULE (all staff read; editors edit in a draft, then save all at once) ---------- */

let schedule = {
  tabs: null, tab: "", data: null, loadingTabs: false, loadingTab: "", error: "",
  editing: false, countDay: null,
  pending: {}, pendingOrder: [], saving: false, lastBatch: null,
  winStart: null, winTab: "", showLeave: false, leave: null, mobileDay: null
};

/** Month names as the schedule tabs write them (English or Indonesian, e.g. "MEI 2026" for May). */
const SCHEDULE_MONTHS = [["JAN"], ["FEB"], ["MAR"], ["APR"], ["MEI", "MAY"], ["JUN"], ["JUL"], ["AUG", "AGU"], ["SEP"], ["OCT", "OKT"], ["NOV"], ["DEC", "DES"]];
const SCHEDULE_ROLE_ORDER = ["Manager", "SPV", "Server", "Runner", "Checker", "Hostess", "Cashier"];
const SCHEDULE_SHIFT_ORDER = ["M6", "M6.30", "M7", "M8", "M9", "M10", "M11", "MD12", "MD13", "E2"];
const SCHEDULE_CODE_OPTIONS = ["M6", "M6.30", "M7", "M8", "M9", "M10", "M11", "MD12", "MD13", "E2", "OFF", "OFF/R", "PH", "DP", "AL", "EO", "DC", "NPL", "RS"];

/** This month's tab, or the last tab if this month has none. */
function defaultScheduleTab(tabs) {
  const now = new Date();
  const names = SCHEDULE_MONTHS[now.getMonth()];
  const year = String(now.getFullYear());
  const hit = tabs.find(t => names.some(n => t.toUpperCase().indexOf(n) === 0) && t.indexOf(year) !== -1);
  return hit || tabs[tabs.length - 1] || "";
}

function loadScheduleTabs() {
  if (schedule.loadingTabs) return;
  schedule.loadingTabs = true;
  api("getScheduleTabs", [sessionToken])
    .then(function (tabs) {
      schedule.tabs = tabs;
      schedule.loadingTabs = false;
      renderTab();
    })
    .catch(function (e) {
      schedule.loadingTabs = false;
      schedule.error = e.message;
      if (isSessionExpired(e)) handleApiError(e);
      renderTab();
    });
}

function loadSchedule(tab) {
  if (schedule.loadingTab === tab) return;
  schedule.loadingTab = tab;
  api("getSchedule", [sessionToken, tab])
    .then(function (d) {
      schedule.data = d;
      schedule.loadingTab = "";
      renderTab();
    })
    .catch(function (e) {
      schedule.loadingTab = "";
      schedule.error = e.message;
      if (isSessionExpired(e)) handleApiError(e);
      renderTab();
    });
}

function onScheduleTab(tab) {
  if (scheduleHasChanges() && !confirm("Discard " + schedule.pendingOrder.length + " unsaved change(s)?")) {
    renderTab();
    return;
  }
  schedule.tab = tab;
  schedule.data = null;
  schedule.error = "";
  schedule.editing = false;
  clearSchedulePending();
  renderTab();
}

/** Matches the schedule name ("Rohendi F", "Ali Reza") to the logged-in name word by word. */
function isMySchedule(name) {
  const a = String(name || "").toLowerCase().split(/\s+/).filter(Boolean);
  const b = String(currentName || "").toLowerCase().split(/\s+/).filter(Boolean);
  if (a.length < 2 || a.length > b.length) return false;
  return a.every((t, i) => b[i].indexOf(t) === 0);
}

function scheduleCellClass(c) {
  if (c.unknown) return "sch-unknown";
  if (c.shift) return "sch-shift" + (c.rs ? " sch-rs" : "");
  if (c.rs) return "sch-rs-only";
  if (c.code) return "sch-off";
  return "";
}

/* ----- counts ----- */

/** Working people per role and shift for one day. RS on its own is not a shift, so it is not counted. */
function scheduleCounts(d, dayIdx) {
  const out = {};
  d.people.forEach(p => {
    const c = p.cells[dayIdx];
    if (!c || !c.shift || !p.role) return;
    out[p.role] = out[p.role] || {};
    out[p.role][c.shift] = (out[p.role][c.shift] || 0) + 1;
  });
  return out;
}

function sumCounts(obj) {
  return Object.values(obj || {}).reduce((a, b) => a + b, 0);
}

/** Per-day totals under the grid: one row per role, and a total row. */
function scheduleFooterHtml(d) {
  const roles = SCHEDULE_ROLE_ORDER.filter(r => d.people.some(p => p.role === r));
  const perDay = d.days.map((_, i) => scheduleCounts(d, i));
  const divider = '<tr class="sch-foot-head"><td colspan="' + (d.days.length + 2) + '">Working per day</td></tr>';
  const rows = divider + roles.map(r => '<tr class="sch-foot"><td class="sch-name">Working: ' + esc(r) + '</td><td></td>' +
    perDay.map(c => '<td>' + (sumCounts(c[r]) || "") + '</td>').join("") + '</tr>').join("");
  const totals = '<tr class="sch-foot sch-foot-total"><td class="sch-name"><strong>Working: total</strong></td><td></td>' +
    perDay.map(c => '<td><strong>' + (roles.reduce((a, r) => a + sumCounts(c[r]), 0) || "") + '</strong></td>').join("") + '</tr>';
  return rows + totals;
}

/** Count per shift for the day picked in the header: who works which hour, by role. */
function countPanelHtml(d) {
  const i = schedule.countDay;
  if (i === null || i === undefined || !d.days[i]) {
    return '';
  }
  const day = d.days[i];
  const counts = scheduleCounts(d, i);
  const roles = SCHEDULE_ROLE_ORDER.filter(r => counts[r]);
  if (!roles.length) {
    return '<div class="sch-count"><strong>' + day.day + ' ' + esc(day.weekday) + '</strong><p class="muted">Nobody is working this day.</p></div>';
  }
  const rows = SCHEDULE_SHIFT_ORDER.map(s => {
    const total = roles.reduce((a, r) => a + (counts[r][s] || 0), 0);
    if (!total) return "";
    return '<tr><td class="sch-name">' + s + '</td>' + roles.map(r => '<td>' + (counts[r][s] || "–") + '</td>').join("") +
      '<td><strong>' + total + '</strong></td></tr>';
  }).join("");
  const totals = roles.map(r => '<td><strong>' + sumCounts(counts[r]) + '</strong></td>').join("");
  const grand = roles.reduce((a, r) => a + sumCounts(counts[r]), 0);
  return '<div class="sch-count"><strong>' + day.day + ' ' + esc(day.weekday) + ' · per shift</strong>' +
    '<div class="sch-wrap"><table class="sch sch-count-table"><thead><tr><th class="sch-name">Shift</th>' +
    roles.map(r => '<th>' + esc(r) + '</th>').join("") + '<th>Total</th></tr></thead><tbody>' + rows +
    '</tbody><tfoot><tr class="sch-foot-total"><td class="sch-name"><strong>Total</strong></td>' + totals +
    '<td><strong>' + grand + '</strong></td></tr></tfoot></table></div></div>';
}

/* ----- draft (pending) changes ----- */

function scheduleKey(row, dayIdx) {
  return row + "|" + dayIdx;
}

function scheduleHasChanges() {
  return schedule.pendingOrder.length > 0;
}

function clearSchedulePending() {
  schedule.pending = {};
  schedule.pendingOrder = [];
}

/** A pending code shown like a saved cell, so counts and shading update at once. */
function pendingCell(code) {
  const base = code.split("/")[0];
  return {
    code: code,
    shift: SCHEDULE_SHIFT_ORDER.indexOf(base) !== -1 ? base : "",
    rs: code === "RS" || /\/RS$/.test(code),
    unknown: false
  };
}

/** The schedule as it would look after the draft is saved. Used for shading, counts, and totals. */
function scheduleEffective(d) {
  if (!scheduleHasChanges()) return d;
  return Object.assign({}, d, {
    people: d.people.map(p => Object.assign({}, p, {
      cells: p.cells.map((c, i) => {
        const k = scheduleKey(p.row, i);
        return schedule.pending[k] !== undefined ? pendingCell(schedule.pending[k]) : c;
      })
    }))
  });
}

/** Adds, changes, or removes one draft change. Nothing is sent to the server here. */
function setSchedulePending(row, dayIdx, code) {
  const k = scheduleKey(row, dayIdx);
  const person = schedule.data.people.find(p => p.row === row);
  const saved = person.cells[dayIdx].code || "";
  if (code === saved) {
    delete schedule.pending[k];
    schedule.pendingOrder = schedule.pendingOrder.filter(x => x !== k);
  } else {
    if (schedule.pending[k] === undefined) schedule.pendingOrder.push(k);
    schedule.pending[k] = code;
  }
  renderTab();
}

function undoLastScheduleChange() {
  const k = schedule.pendingOrder.pop();
  if (k !== undefined) delete schedule.pending[k];
  renderTab();
}

function discardScheduleChanges() {
  if (scheduleHasChanges() && !confirm("Discard " + schedule.pendingOrder.length + " unsaved change(s)?")) return;
  clearSchedulePending();
  schedule.editing = false;
  renderTab();
}

function saveScheduleChanges() {
  if (!scheduleHasChanges() || schedule.saving) return;
  const tab = schedule.tab;
  const changes = schedule.pendingOrder.map(k => {
    const parts = k.split("|");
    return { row: Number(parts[0]), dayIndex: Number(parts[1]), code: schedule.pending[k] };
  });
  schedule.saving = true;
  renderTab();
  api("saveScheduleCells", [sessionToken, tab, changes])
    .then(function (res) {
      schedule.saving = false;
      schedule.lastBatch = { tab: tab, batch: res.batch };
      clearSchedulePending();
      schedule.editing = false;
      schedule.data = null;
      toast("Saved " + res.saved + " change(s). You can undo them below.");
      renderTab();
    })
    .catch(function (e) {
      schedule.saving = false;
      if (isSessionExpired(e)) return handleApiError(e);
      alert("Not saved. Nothing was changed.\n\n" + e.message);
      renderTab();
    });
}

function undoLastScheduleSave() {
  const last = schedule.lastBatch;
  if (!last || !confirm("Undo the last save (" + last.tab + ")?")) return;
  api("undoScheduleBatch", [sessionToken, last.batch])
    .then(function () {
      schedule.lastBatch = null;
      schedule.data = null;
      toast("Last save undone.");
      renderTab();
    })
    .catch(function (e) {
      if (isSessionExpired(e)) return handleApiError(e);
      alert(e.message);
      renderTab();
    });
}

function toggleScheduleEdit() {
  if (schedule.editing && scheduleHasChanges()) return discardScheduleChanges();
  schedule.editing = !schedule.editing;
  renderTab();
}

function setScheduleCountDay(i) {
  schedule.countDay = schedule.countDay === i ? null : i;
  renderTab();
}

/* ----- the page ----- */

function schedulePendingBarHtml() {
  const n = schedule.pendingOrder.length;
  if (schedule.saving) return '<div class="sch-pending-bar"><span>Saving…</span></div>';
  if (!schedule.editing) return "";
  return '<div class="sch-pending-bar">' +
    '<span>' + (n ? n + ' unsaved change' + (n > 1 ? 's' : '') : 'No changes yet. Click a cell to change it.') + '</span>' +
    '<span class="sch-pending-actions">' +
      (n ? '<button type="button" class="ghost small" onclick="undoLastScheduleChange()">Undo last change</button>' : '') +
      '<button type="button" class="ghost small" onclick="discardScheduleChanges()">Cancel</button>' +
      '<button type="button" class="add-btn" ' + (n ? '' : 'disabled ') + 'onclick="saveScheduleChanges()">Save ' + (n || "") + ' change' + (n === 1 ? '' : 's') + '</button>' +
    '</span></div>';
}

const SCHEDULE_WINDOW_DAYS = 14;

/** Editors see two weeks at a time. Staff see the whole month. */
function scheduleWindow(n) {
  if (!canEdit()) return { a: 0, b: n };
  if (schedule.winStart === null || schedule.winStart === undefined || schedule.winTab !== schedule.tab) {
    const today = new Date().getDate();
    schedule.winStart = Math.max(0, Math.min(today - 1, n - SCHEDULE_WINDOW_DAYS));
    schedule.winTab = schedule.tab;
  }
  const a = Math.max(0, Math.min(schedule.winStart, n - SCHEDULE_WINDOW_DAYS));
  return { a: a, b: Math.min(n, a + SCHEDULE_WINDOW_DAYS) };
}

function shiftScheduleWindow(step) {
  schedule.winStart += step * SCHEDULE_WINDOW_DAYS;
  renderTab();
}

function toggleScheduleLeave() {
  schedule.showLeave = !schedule.showLeave;
  if (schedule.showLeave && !schedule.leave) loadScheduleLeave();
  renderTab();
}

function loadScheduleLeave() {
  const tab = schedule.tab;
  api("getLeaveSummary", [sessionToken, tab])
    .then(function (rows) {
      schedule.leave = { tab: tab, rows: rows };
      renderTab();
    })
    .catch(function (e) {
      if (isSessionExpired(e)) return handleApiError(e);
      schedule.leave = { tab: tab, rows: [], error: e.message };
      renderTab();
    });
}

/** Credits for each person: EO left this month, AL left, and DP left with its expiry dates. */
function leavePanelHtml() {
  if (!schedule.showLeave) return "";
  if (!schedule.leave || schedule.leave.tab !== schedule.tab) {
    return '<div class="sch-count"><p class="muted">Loading credits…</p></div>';
  }
  if (schedule.leave.error) return '<div class="sch-count"><p class="muted">Could not load credits: ' + esc(schedule.leave.error) + '</p></div>';
  const rows = schedule.leave.rows.map(r =>
    '<tr' + (r.matched ? '' : ' class="sch-unmatched"') + '><td class="sch-name">' + esc(r.name) + (r.matched ? '' : ' <small>(not in HR)</small>') + '</td>' +
    '<td>' + esc(r.role) + '</td><td>' + r.eoLeft + '</td><td>' + r.alLeft + '</td><td>' + r.dpLeft + '</td>' +
    '<td class="sch-left">' + esc(r.dpExpires.join(", ") || "–") + '</td>' +
    '<td class="sch-left">' + esc(r.recent.map(x => x[0] + " " + x[1]).join(" · ") || "–") + '</td></tr>').join("");
  return '<div class="sch-count"><strong>Leave credits</strong>' +
    '<div class="sch-wrap"><table class="sch sch-leave"><thead><tr><th class="sch-name">Name</th><th>Role</th>' +
    '<th>EO left (this month)</th><th>AL left</th><th>DP left</th><th class="sch-left">DP expires</th><th class="sch-left">Recent</th></tr></thead>' +
    '<tbody>' + rows + '</tbody></table></div></div>';
}

/** Phones get a day-by-day list. Editing is for the computer. */
function isPhoneWidth() {
  return !!(window.matchMedia && window.matchMedia("(max-width: 560px)").matches);
}

function setScheduleMobileDay(i) {
  schedule.mobileDay = i;
  renderTab();
}

function viewScheduleMobile(saved) {
  const n = saved.days.length;
  let idx = schedule.mobileDay;
  if (idx === null || idx === undefined || idx >= n) idx = Math.max(0, Math.min(new Date().getDate() - 1, n - 1));
  const day = saved.days[idx];
  const counts = scheduleCounts(saved, idx);
  const roles = SCHEDULE_ROLE_ORDER.filter(r => counts[r]);
  const strip = '<div class="sm-days">' + saved.days.map((x, i) =>
    '<button type="button" class="sm-day' + (i === idx ? ' active' : '') + '" onclick="setScheduleMobileDay(' + i + ')"><small>' + esc(x.weekday) + '</small>' + x.day + '</button>').join("") + '</div>';
  const summary = '<p class="sm-summary">' + (roles.length ? roles.map(r => esc(r) + ' ' + sumCounts(counts[r])).join(" · ") : 'Nobody is working this day.') + '</p>';
  let list = "", block = "";
  saved.people.forEach(p => {
    const c = p.cells[idx];
    if (p.block !== block) {
      block = p.block;
      list += '<div class="sm-block sch-block-' + block.toLowerCase() + '">' + esc(block) + '</div>';
    }
    list += '<div class="sm-row' + (isMySchedule(p.name) ? ' mine' : '') + '"><div class="sm-who"><strong>' + esc(p.name) +
      '</strong><small>' + esc(p.role || p.position) + '</small></div><span class="sm-code ' + scheduleCellClass(c) + '">' + esc(c.code || "–") + '</span></div>';
  });
  return strip + '<div class="sm-head"><strong>' + day.day + ' ' + esc(day.weekday) + '</strong></div>' + summary +
    '<div class="sm-list">' + list + '</div>' +
    '<p class="sch-legend">Read-only on phone. Open the Schedule on a computer to edit.</p>';
}

function viewSchedule() {
  const edit = canEdit() && !isPhoneWidth();
  let html = '<div class="page-heading"><h2>Schedule</h2><p>Restaurant, Host, and Cashier shifts. Your row is highlighted.</p></div>';
  if (schedule.error) return html + '<div class="empty">Could not load the schedule: ' + esc(schedule.error) + '</div>';
  if (!schedule.tabs) {
    loadScheduleTabs();
    return html + '<div class="empty">Loading…</div>';
  }
  if (!schedule.tab) schedule.tab = defaultScheduleTab(schedule.tabs);

  html += '<div class="sch-toolbar"><select class="input sch-month" onchange="onScheduleTab(this.value)">' +
    schedule.tabs.map(t => '<option value="' + esc(t) + '"' + (t === schedule.tab ? ' selected' : '') + '>' + esc(t) + '</option>').join("") +
    '</select>' +
    (edit && !schedule.editing ? '<button type="button" class="ghost small" onclick="toggleScheduleEdit()">Edit schedule</button>' : '') +
    (edit && schedule.lastBatch && schedule.lastBatch.tab === schedule.tab && !scheduleHasChanges() && !schedule.editing
      ? '<button type="button" class="ghost small" onclick="undoLastScheduleSave()">Undo last save</button>' : '') +
    (edit ? '<button type="button" class="ghost small" onclick="toggleScheduleLeave()">' + (schedule.showLeave ? 'Hide credits' : 'Credits') + '</button>' : '') +
    '</div>';
  if (!isPhoneWidth()) html += schedulePendingBarHtml();

  if (!schedule.data || schedule.data.tab !== schedule.tab) {
    loadSchedule(schedule.tab);
    return html + '<div class="empty">Loading…</div>';
  }

  const saved = schedule.data;
  if (isPhoneWidth()) return html + viewScheduleMobile(saved);
  const full = scheduleEffective(saved);
  const n = full.days.length;
  const w = scheduleWindow(n);
  const d = {
    days: full.days.slice(w.a, w.b),
    people: full.people.map(p => Object.assign({}, p, { cells: p.cells.slice(w.a, w.b) }))
  };
  if (edit) {
    html += '<div class="sch-toolbar sch-window"><button type="button" class="ghost small" title="Previous 2 weeks" onclick="shiftScheduleWindow(-1)">◀</button>' +
      '<span class="muted">' + d.days[0].day + '–' + d.days[d.days.length - 1].day + ' of ' + n + '</span>' +
      '<button type="button" class="ghost small" title="Next 2 weeks" onclick="shiftScheduleWindow(1)">▶</button></div>';
  }
  html += leavePanelHtml();

  const editing = edit && schedule.editing && !schedule.saving;
  const head = '<tr><th class="sch-name">Name</th><th class="sch-role">Role</th>' +
    d.days.map((x, i) => '<th class="sch-day' + (schedule.countDay === i + w.a ? ' picked' : '') + '" onclick="setScheduleCountDay(' + (i + w.a) + ')">' +
      x.day + '<small>' + esc(x.weekday) + '</small></th>').join("") + '</tr>';
  let body = "", block = "";
  d.people.forEach(p => {
    if (p.block !== block) {
      block = p.block;
      const count = d.people.filter(x => x.block === block).length;
      body += '<tr class="sch-block sch-block-' + block.toLowerCase() + '"><td colspan="' + (d.days.length + 2) + '">' +
        esc(block) + '<span>' + count + ' staff</span></td></tr>';
    }
    body += '<tr class="sch-row' + (isMySchedule(p.name) ? ' mine' : '') + '">' +
      '<td class="sch-name">' + esc(p.name) + '</td><td class="sch-role">' + esc(p.role || p.position) + '</td>' +
      p.cells.map((c, i) => {
        const full_i = i + w.a;
        const isPending = schedule.pending[scheduleKey(p.row, full_i)] !== undefined;
        return '<td class="' + scheduleCellClass(c) + (editing ? ' sch-edit' : '') + (isPending ? ' sch-pending' : '') + '"' +
          (editing ? ' onclick="openScheduleCell(' + p.row + ',' + full_i + ')"' : '') + '>' + esc(c.code) + '</td>';
      }).join("") + '</tr>';
  });

  const editHint = editing ? 'Changes stay in draft until you press Save. PH, DP, EO, and AL rules are checked on save. ' : '';
  return html + countPanelHtml(full) +
    '<div class="sch-wrap"><table class="sch sch-grid" style="width:' + (210 + 104 + 60 * d.days.length) + 'px"><colgroup><col class="c-name"><col class="c-role">' + d.days.map(() => '<col class="c-day">').join("") + '</colgroup><thead>' + head + '</thead><tbody>' + body + '</tbody><tfoot>' + scheduleFooterHtml(d) + '</tfoot></table></div>' +
    '<p class="sch-legend">' + editHint + 'Shaded = shift. RS = Reload Social event duty. OFF, OFF/R, DC (sick), EO (extra off), NPL (unpaid leave), DP, AL (annual leave), and PH = no floor shift.</p>';
}

/* ----- picking a code ----- */

function openScheduleCell(row, dayIdx) {
  if (!canEdit() || !schedule.editing) return;
  const person = schedule.data && schedule.data.people.find(p => p.row === row);
  const day = schedule.data && schedule.data.days[dayIdx];
  if (!person || !day) return toast("Refresh the page and try again.");
  const current = schedule.pending[scheduleKey(row, dayIdx)] !== undefined
    ? schedule.pending[scheduleKey(row, dayIdx)] : (person.cells[dayIdx].code || "");
  let box = document.getElementById("schedPicker");
  if (!box) {
    box = document.createElement("div");
    box.id = "schedPicker";
    box.className = "sch-picker";
    document.body.appendChild(box);
  }
  const hasPending = schedule.pending[scheduleKey(row, dayIdx)] !== undefined;
  box.innerHTML = '<div class="sch-picker-card">' +
    '<strong>' + esc(person.name) + '</strong>' +
    '<small class="muted">' + day.day + ' ' + esc(day.weekday) + ' · now: ' + esc(current || "-") + '</small>' +
    '<div class="sch-picker-grid">' +
      SCHEDULE_CODE_OPTIONS.map(c => '<button type="button" class="sch-pick' + (c === current ? ' current' : '') + '" onclick="pickScheduleCode(' + row + ',' + dayIdx + ',\'' + c + '\')">' + esc(c) + '</button>').join("") +
    '</div>' +
    '<div class="sch-picker-foot">' +
      (hasPending ? '<button type="button" class="ghost small" onclick="revertScheduleCell(' + row + ',' + dayIdx + ')">Back to saved</button>' : '') +
      '<button type="button" class="ghost small" onclick="closeSchedulePicker()">Close</button>' +
    '</div></div>';
  box.classList.add("show");
}

function closeSchedulePicker() {
  const box = document.getElementById("schedPicker");
  if (box) box.classList.remove("show");
}

function pickScheduleCode(row, dayIdx, code) {
  closeSchedulePicker();
  setSchedulePending(row, dayIdx, code);
}

function revertScheduleCell(row, dayIdx) {
  closeSchedulePicker();
  const k = scheduleKey(row, dayIdx);
  delete schedule.pending[k];
  schedule.pendingOrder = schedule.pendingOrder.filter(x => x !== k);
  renderTab();
}
