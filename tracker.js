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
    '<p>Lihat siapa yang sudah menjual menu tantangan. Hasil dibuat dari file yang diupload dan tidak disimpan.</p></div>' +
    '<div class="tracker-steps">' +
    '<label class="tracker-step">Tanggal<input type="date" class="input" value="' + esc(tracker.date) + '" onchange="onTrackerDate(this.value)"></label>' +
    '<label class="tracker-step">Laporan penjualan (.xlsx)<input type="file" accept=".xlsx" onchange="onTrackerSales(this)">' +
      '<small>' + esc(tracker.salesName || "Belum ada file") + (tracker.lines ? " · " + dates.length + " hari, " + tracker.lines.length + " baris" : "") + '</small></label>' +
    '<label class="tracker-step">Roster / section board (.pdf, opsional)<input type="file" accept=".pdf" onchange="onTrackerRoster(this)">' +
      '<small>' + esc(tracker.rosterName || "Belum ada file. Tanpa roster, hanya staff yang menjual yang ditampilkan.") + '</small></label>' +
    '</div>';

  if (tracker.busy) return html + '<div class="empty">' + esc(tracker.busy) + '</div>';
  if (!tracker.lines) return html + '<div class="empty">Upload laporan penjualan untuk mulai.</div>';

  html += '<div class="tracker-card"><strong>Menu tantangan tanggal ini</strong>' +
    (items.length
      ? '<div class="tracker-items">' + items.map(it =>
          '<span class="tracker-item">' + esc(it.item) + ' <small>target ' + it.target + ' ' + esc(it.unit) + '</small></span>').join("") + '</div>'
      : '<p class="muted small">Belum ada daftar tantangan untuk tanggal ini di tab 11_UpsellToday.</p>') +
    '</div>';

  if (!items.length) return html;
  if (!tracker.staff) return html + '<div class="empty">Memuat daftar staff…</div>';

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
    '<div><strong>' + soldCount + '</strong><span>sudah menjual</span></div>' +
    (tracker.roster ? '<div><strong>' + rows.filter(r => r.total === 0).length + '</strong><span>belum menjual</span></div>' : '') +
    items.map(it => '<div><strong>' + rows.reduce((a, r) => a + (r.items[it.item] || 0), 0) + '</strong><span>' + esc(it.item) + '</span></div>').join("") +
    '</div>';

  if (unlinkedCount) {
    html += '<div class="tracker-warn">' + unlinkedCount + ' nama POS belum terhubung ke staff, jadi hasil ini belum lengkap. Hubungkan di bawah tabel.</div>';
  }
  html += '<div class="tracker-filter">' +
    '<button class="' + (tracker.filter === "all" ? "button-primary" : "button-secondary") + '" type="button" onclick="setTrackerFilter(\'all\')">Semua</button>' +
    '<button class="' + (tracker.filter === "sold" ? "button-primary" : "button-secondary") + '" type="button" onclick="setTrackerFilter(\'sold\')">Sudah menjual</button>' +
    (tracker.roster ? '<button class="' + (tracker.filter === "none" ? "button-primary" : "button-secondary") + '" type="button" onclick="setTrackerFilter(\'none\')">Belum menjual</button>' : '') +
    '</div>';

  html += '<div class="tracker-table"><table><thead><tr><th>Staff</th><th>Status</th><th>Menu tantangan</th><th class="numeric">Jumlah</th></tr></thead><tbody>' +
    (shown.length ? shown.map(function (r) {
      const chips = Object.keys(r.items).map(k => '<span class="tracker-chip">' + esc(k) + ' <b>' + r.items[k] + '</b></span>').join("");
      return '<tr><td><strong>' + esc(r.name) + '</strong>' + (r.pos.length ? '<br><small class="muted">POS: ' + esc(r.pos.join(", ")) + '</small>' : '') + '</td>' +
        '<td>' + (r.total > 0 ? '<span class="badge ok">Sudah menjual</span>' : '<span class="badge off">Belum menjual</span>') +
        (r.onRoster || !tracker.roster ? '' : '<br><small class="muted">tidak di roster</small>') + '</td>' +
        '<td>' + (chips || '<span class="muted">—</span>') + '</td>' +
        '<td class="numeric">' + r.total + '</td></tr>';
    }).join("") : '<tr><td colspan="4" class="muted">Tidak ada data untuk filter ini.</td></tr>') +
    '</tbody></table></div>';

  const unlinkedNames = Object.keys(res.unlinked);
  tracker.unlinkedNames = unlinkedNames;
  if (unlinkedNames.length) {
    html += '<div class="tracker-card tracker-link"><strong>Nama POS yang belum terhubung ke staff</strong>' +
      '<p class="muted small">Hubungkan sekali. Setelah itu nama ini otomatis masuk ke hasil di hari-hari berikutnya.</p>' +
      unlinkedNames.map(function (w, i) {
        const sugg = suggestStaff(w);
        const opts = '<option value="">Pilih staff…</option>' + tracker.staff.slice().sort((a, b) => a.name.localeCompare(b.name)).map(s =>
          '<option value="' + esc(s.nik) + '"' + (s.nik === sugg ? ' selected' : '') + '>' + esc(s.name) + '</option>').join("");
        return '<div class="tracker-link-row"><span><strong>' + esc(w) + '</strong> <small class="muted">' + sumItems(res.unlinked[w].items) + ' menu tantangan' + (sugg ? ' · saran' : '') + '</small></span>' +
          '<select id="map-' + i + '">' + opts + '</select>' +
          '<button class="button-secondary" type="button" onclick="saveWaiterMap(' + i + ')">Simpan</button></div>';
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
  tracker.busy = "Membaca laporan penjualan… (file besar bisa butuh beberapa detik)";
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
  tracker.busy = "Membaca roster…";
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
  if (!staff) return toast("Pilih staff dulu.");
  try {
    await api("addRow", [sessionToken, "posMap", { pos: posName, nik: nik, name: staff.name }]);
    toast("Tersimpan: " + posName + " → " + staff.name);
    refreshSheet("posMap");
  } catch (e) {
    if (isSessionExpired(e)) return handleApiError(e);
    toast(e.message);
  }
}
