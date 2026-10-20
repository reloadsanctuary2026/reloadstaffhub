/************************************************
 * SETUP TAB — jalankan manual dari editor Apps Script
 *
 * setupTabs() memastikan setiap tab punya header yang benar:
 * - Tab yang belum ada: dibuat, lengkap dengan header dari SHEETS.
 * - Tab yang kosong total (baris 1 kosong): header ditulis.
 * - Tab yang header-nya kurang atau beda, dan TIDAK punya data di bawahnya:
 *   header baris 1 diganti dengan yang benar.
 * - Tab yang header-nya kurang tapi SUDAH ada data: TIDAK diubah, hanya dilaporkan.
 *   (supaya data tidak terbaca di kolom yang salah)
 *
 * Aman dijalankan berkali-kali. Hasilnya ada di Execution log.
 ************************************************/

function setupTabs() {
  const report = [];
  const targets = Object.values(SHEETS).concat([{ suffix: CHANGELOG_TAB, cols: CHANGELOG_COLS }]);

  targets.forEach(def => {
    const headers = Object.keys(def.cols).map(k => def.cols[k][0]);
    const sheet = findSheetOrNull_(def.suffix);

    if (!sheet) {
      const created = ss.insertSheet(def.suffix);
      writeHeaders_(created, headers);
      report.push("CREATED: " + def.suffix + " (" + headers.join(" | ") + ")");
      return;
    }

    const width = Math.max(sheet.getLastColumn(), 1);
    const current = sheet.getRange(1, 1, 1, width).getDisplayValues()[0].map(h => clean_(h));
    const missing = Object.keys(def.cols)
      .filter(k => findColumn_(current, def.cols[k]) === -1)
      .map(k => def.cols[k][0]);

    if (!missing.length) {
      report.push("OK: " + sheet.getName());
      return;
    }

    if (current.every(h => h === "")) {
      writeHeaders_(sheet, headers);
      report.push("HEADER WRITTEN: " + sheet.getName() + " (" + headers.join(" | ") + ")");
      return;
    }

    if (!hasData_(sheet)) {
      writeHeaders_(sheet, headers);
      report.push("HEADER UPDATED: " + sheet.getName() + " (" + headers.join(" | ") + ")");
      return;
    }

    report.push("MISSING HEADER in " + sheet.getName() + ": " + missing.join(", ") +
      ". This tab already has data, so it was not changed automatically. Check it manually.");
  });

  Logger.log(report.join("\n"));
  return report;
}

function writeHeaders_(sheet, headers) {
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
  sheet.setFrozenRows(1);
}

/** Ada data di bawah baris header? */
function hasData_(sheet) {
  const last = sheet.getLastRow();
  if (last < 2) return false;
  const width = Math.max(sheet.getLastColumn(), 1);
  return sheet.getRange(2, 1, last - 1, width).getDisplayValues()
    .some(row => row.some(c => clean_(c) !== ""));
}

/**
 * Menghangatkan cache daftar karyawan HR. Pasang sebagai trigger waktu (setiap 5 menit),
 * supaya login selalu cepat. Bisa juga dijalankan manual sekali.
 */
function warmHrCache() {
  CacheService.getScriptCache().remove("hr_index");
  const count = getHrIndex_().length;
  Logger.log("HR cache refreshed: " + count + " employees");
  return count;
}
