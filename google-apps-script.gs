// =========================================================================
// BACKEND GOOGLE APPS SCRIPT UNTUK SIM WARGA
// Cara pakai:
// 1. Buat Google Spreadsheet baru.
// 2. Buka menu Ekstensi (Extensions) -> Apps Script.
// 3. Hapus kode lama, tempel seluruh kode ini, lalu simpan.
// 4. Klik Terapkan (Deploy) -> Deployment baru (New deployment) -> Web app.
//    - Jalankan sebagai (Execute as): Saya (Me)
//    - Yang memiliki akses (Who has access): Siapa saja (Anyone)
// 5. Salin URL Web App yang muncul dan tempel ke tab "Koneksi Cloud" di web.
// =========================================================================

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const schemas = {
    Warga: ["id", "nik", "nama", "alamat", "hp", "status"],
    Kas: ["id", "tanggal", "nama", "periode", "nominal", "status"],
    Surat: ["id", "tanggal", "nama", "alamat", "jenis", "keperluan", "status"]
  };

  Object.keys(schemas).forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(schemas[name]);
    }
  });
}

function doGet(e) {
  setupSheets();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const data = {
    warga: sheetToObjects(ss.getSheetByName("Warga")),
    kas: sheetToObjects(ss.getSheetByName("Kas")),
    surat: sheetToObjects(ss.getSheetByName("Surat"))
  };

  return ContentService
    .createTextOutput(JSON.stringify({ status: "success", data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  setupSheets();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const payload = JSON.parse(e.postData.contents);
  const action = payload.action;

  if (action === "saveWarga") {
    upsertRow(ss.getSheetByName("Warga"), payload.data, ["id", "nik", "nama", "alamat", "hp", "status"]);
  } else if (action === "deleteWarga") {
    deleteRowById(ss.getSheetByName("Warga"), payload.id);
  } else if (action === "saveKas") {
    upsertRow(ss.getSheetByName("Kas"), payload.data, ["id", "tanggal", "nama", "periode", "nominal", "status"]);
  } else if (action === "deleteKas") {
    deleteRowById(ss.getSheetByName("Kas"), payload.id);
  } else if (action === "saveSurat") {
    upsertRow(ss.getSheetByName("Surat"), payload.data, ["id", "tanggal", "nama", "alamat", "jenis", "keperluan", "status"]);
  } else if (action === "updateSurat") {
    updateFieldById(ss.getSheetByName("Surat"), payload.id, 7, payload.status);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function sheetToObjects(sheet) {
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  }).reverse();
}

function upsertRow(sheet, obj, keys) {
  const rows = sheet.getDataRange().getValues();
  const rowValues = keys.map(k => obj[k] !== undefined ? obj[k] : "");
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(obj.id)) {
      sheet.getRange(i + 1, 1, 1, keys.length).setValues([rowValues]);
      return;
    }
  }
  sheet.appendRow(rowValues);
}

function deleteRowById(sheet, id) {
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return;
    }
  }
}

function updateFieldById(sheet, id, colIndex, value) {
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      sheet.getRange(i + 1, colIndex).setValue(value);
      return;
    }
  }
}
