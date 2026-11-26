// =========================================================================
// KONFIGURASI UTAMA APLIKASI WARGA
// Tempel URL Web App Google Apps Script di bawah ini jika sudah dideploy:
// =========================================================================
const DEFAULT_API_URL = "https://script.google.com/macros/s/AKfycbx7gblxLH_xEUrm1p0oKXno3wffth6CicVuPEGvG2CjtYHHEwU0WNLjczlkwbMdaUQoZw/exec";
const ADMIN_PIN = "123456"; // Ubah PIN sesuai kebutuhan pengurus

let state = {
  isAdmin: sessionStorage.getItem("sim_warga_admin") === "true",
  apiUrl: localStorage.getItem("sim_warga_api_url") || DEFAULT_API_URL,
  warga: [],
  kas: [],
  surat: []
};

// Data awal contoh untuk mode lokal
const SEED_DATA = {
  warga: [
    { id: "W-1", nik: "3275011205850001", nama: "Ahmad Hidayat", alamat: "Blok A1 No. 01", hp: "081234567890", status: "Tetap" },
    { id: "W-2", nik: "3275012408900004", nama: "Siti Rahmawati", alamat: "Blok A1 No. 04", hp: "081398765432", status: "Tetap" },
    { id: "W-3", nik: "3275010911940002", nama: "Rizky Pratama", alamat: "Blok B2 No. 12", hp: "085711223344", status: "Kontrak" }
  ],
  kas: [
    { id: "K-1", tanggal: "2026-11-02", nama: "Ahmad Hidayat (Blok A1/01)", periode: "2026-11", nominal: 50000, status: "Lunas" },
    { id: "K-2", tanggal: "2026-11-05", nama: "Siti Rahmawati (Blok A1/04)", periode: "2026-11", nominal: 50000, status: "Lunas" }
  ],
  surat: [
    { id: "S-1", tanggal: "2026-11-20", nama: "Rizky Pratama", alamat: "Blok B2 No. 12", jenis: "Surat Keterangan Domisili", keperluan: "Administrasi pekerjaan", status: "Selesai" },
    { id: "S-2", tanggal: "2026-11-24", nama: "Ahmad Hidayat", alamat: "Blok A1 No. 01", jenis: "Surat Pengantar KTP / KK", keperluan: "Pembaruan kartu keluarga", status: "Menunggu" }
  ]
};

// Inisialisasi saat halaman dimuat
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("inputApiUrl").value = state.apiUrl;
  const now = new Date();
  document.getElementById("kasPeriode").value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  updateAdminUI();
  loadAllData();
});

function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 3000);
}

function switchTab(tabName) {
  document.querySelectorAll(".tab-view").forEach(v => v.classList.add("hidden"));
  document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active-tab"));

  document.getElementById(`view-${tabName}`).classList.remove("hidden");
  document.getElementById(`tab-${tabName}`).classList.add("active-tab");
}

// =========================================================================
// AUTH PENGURUS (ADMIN)
// =========================================================================
function toggleAdminModal() {
  if (state.isAdmin) {
    state.isAdmin = false;
    sessionStorage.removeItem("sim_warga_admin");
    updateAdminUI();
    renderAll();
    showToast("Berhasil keluar dari mode pengurus.");
    return;
  }
  document.getElementById("adminModal").classList.toggle("hidden");
}

function loginAdmin() {
  const pin = document.getElementById("adminPinInput").value.trim();
  if (pin === ADMIN_PIN) {
    state.isAdmin = true;
    sessionStorage.setItem("sim_warga_admin", "true");
    document.getElementById("adminPinInput").value = "";
    document.getElementById("adminModal").classList.add("hidden");
    updateAdminUI();
    renderAll();
    showToast("Login pengurus berhasil.");
  } else {
    alert("PIN salah!");
  }
}

function updateAdminUI() {
  const btn = document.getElementById("btnAdminToggle");
  const roleText = document.getElementById("statRoleText");
  document.querySelectorAll(".admin-only").forEach(el => {
    el.classList.toggle("hidden", !state.isAdmin);
  });

  if (state.isAdmin) {
    btn.textContent = "Logout Pengurus";
    btn.classList.replace("bg-white", "bg-amber-300");
    roleText.textContent = "Pengurus (Admin)";
  } else {
    btn.textContent = "Login Pengurus";
    btn.classList.replace("bg-amber-300", "bg-white");
    roleText.textContent = "Mode Warga";
  }

  const badge = document.getElementById("modeBadge");
  if (state.apiUrl) {
    badge.textContent = "Cloud: Google Sheets";
    badge.className = "text-xs px-2.5 py-1 rounded-full bg-emerald-900/60 text-emerald-100 border border-emerald-400/40";
  } else {
    badge.textContent = "Mode Lokal (Browser)";
    badge.className = "text-xs px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-100 border border-amber-300/30";
  }
}

// =========================================================================
// PENYIMPANAN DATA (CLOUD GOOGLE SHEETS ATAU LOCALSTORAGE)
// =========================================================================
async function loadAllData() {
  if (state.apiUrl) {
    try {
      const res = await fetch(`${state.apiUrl}?action=getAll`);
      const json = await res.json();
      if (json.status === "success") {
        state.warga = json.data.warga || [];
        state.kas = json.data.kas || [];
        state.surat = json.data.surat || [];
        renderAll();
        return;
      }
    } catch (err) {
      console.error("Gagal memuat dari cloud:", err);
      showToast("Gagal terhubung ke Google Sheets, beralih ke data lokal.");
    }
  }

  const saved = localStorage.getItem("sim_warga_data_v1");
  if (saved) {
    const parsed = JSON.parse(saved);
    state.warga = parsed.warga || [];
    state.kas = parsed.kas || [];
    state.surat = parsed.surat || [];
  } else {
    state.warga = [...SEED_DATA.warga];
    state.kas = [...SEED_DATA.kas];
    state.surat = [...SEED_DATA.surat];
    persistLocal();
  }
  renderAll();
}

function persistLocal() {
  localStorage.setItem("sim_warga_data_v1", JSON.stringify({
    warga: state.warga,
    kas: state.kas,
    surat: state.surat
  }));
}

async function syncToCloud(payload) {
  if (!state.apiUrl) return;
  try {
    await fetch(state.apiUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error("Sync error:", err);
  }
}

function saveApiConfig() {
  const url = document.getElementById("inputApiUrl").value.trim();
  state.apiUrl = url;
  localStorage.setItem("sim_warga_api_url", url);
  updateAdminUI();
  loadAllData();
  showToast("Konfigurasi koneksi disimpan.");
}

function resetApiConfig() {
  state.apiUrl = "";
  localStorage.removeItem("sim_warga_api_url");
  document.getElementById("inputApiUrl").value = "";
  updateAdminUI();
  loadAllData();
  showToast("Beralih ke penyimpanan lokal.");
}

// =========================================================================
// MODUL 1: DATA WARGA
// =========================================================================
function maskNik(nik) {
  if (state.isAdmin || !nik || nik.length < 8) return nik;
  return nik.substring(0, 4) + "********" + nik.substring(nik.length - 4);
}

function openWargaForm(item = null) {
  document.getElementById("wargaFormBox").classList.remove("hidden");
  if (item) {
    document.getElementById("wargaFormTitle").textContent = "Edit Data Warga";
    document.getElementById("wargaId").value = item.id;
    document.getElementById("wargaNik").value = item.nik;
    document.getElementById("wargaNama").value = item.nama;
    document.getElementById("wargaAlamat").value = item.alamat;
    document.getElementById("wargaHp").value = item.hp;
    document.getElementById("wargaStatus").value = item.status;
  } else {
    document.getElementById("wargaFormTitle").textContent = "Tambah Data Warga";
    document.getElementById("formWarga").reset();
    document.getElementById("wargaId").value = "";
  }
}

function closeWargaForm() {
  document.getElementById("wargaFormBox").classList.add("hidden");
  document.getElementById("formWarga").reset();
}

async function saveWarga(e) {
  e.preventDefault();
  const id = document.getElementById("wargaId").value;
  const record = {
    id: id || "W-" + Date.now(),
    nik: document.getElementById("wargaNik").value.trim(),
    nama: document.getElementById("wargaNama").value.trim(),
    alamat: document.getElementById("wargaAlamat").value.trim(),
    hp: document.getElementById("wargaHp").value.trim(),
    status: document.getElementById("wargaStatus").value
  };

  if (id) {
    const idx = state.warga.findIndex(w => w.id === id);
    if (idx > -1) state.warga[idx] = record;
  } else {
    state.warga.unshift(record);
  }

  persistLocal();
  renderAll();
  closeWargaForm();
  showToast("Data warga berhasil disimpan.");
  await syncToCloud({ action: "saveWarga", data: record });
}

async function deleteWarga(id) {
  if (!confirm("Hapus data warga ini?")) return;
  state.warga = state.warga.filter(w => w.id !== id);
  persistLocal();
  renderAll();
  showToast("Data warga dihapus.");
  await syncToCloud({ action: "deleteWarga", id });
}

function renderWarga() {
  const q = document.getElementById("searchWarga").value.toLowerCase();
  const filtered = state.warga.filter(w =>
    w.nama.toLowerCase().includes(q) || w.alamat.toLowerCase().includes(q)
  );

  const tbody = document.getElementById("tbodyWarga");
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-4 py-6 text-center text-slate-400">Tidak ada data warga ditemukan.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(w => `
    <tr class="hover:bg-slate-50">
      <td class="px-4 py-3 font-mono text-xs">${maskNik(w.nik)}</td>
      <td class="px-4 py-3 font-medium text-slate-800">${w.nama}</td>
      <td class="px-4 py-3">${w.alamat}</td>
      <td class="px-4 py-3">${w.hp || "-"}</td>
      <td class="px-4 py-3">
        <span class="px-2 py-0.5 text-xs rounded-full ${w.status === 'Tetap' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
          ${w.status}
        </span>
      </td>
      <td class="px-4 py-3 admin-only ${state.isAdmin ? '' : 'hidden'} space-x-2">
        <button onclick='openWargaForm(${JSON.stringify(w)})' class="text-sky-600 hover:underline text-xs font-medium">Edit</button>
        <button onclick="deleteWarga('${w.id}')" class="text-rose-600 hover:underline text-xs font-medium">Hapus</button>
      </td>
    </tr>
  `).join("");
}

// =========================================================================
// MODUL 2: IURAN KAS
// =========================================================================
function openKasForm() {
  document.getElementById("kasFormBox").classList.remove("hidden");
}

async function saveKas(e) {
  e.preventDefault();
  const record = {
    id: "K-" + Date.now(),
    tanggal: new Date().toISOString().split("T")[0],
    nama: document.getElementById("kasNama").value.trim(),
    periode: document.getElementById("kasPeriode").value,
    nominal: Number(document.getElementById("kasNominal").value),
    status: "Lunas"
  };

  state.kas.unshift(record);
  persistLocal();
  renderAll();
  document.getElementById("formKas").reset();
  document.getElementById("kasFormBox").classList.add("hidden");
  showToast("Pembayaran kas tercatat.");
  await syncToCloud({ action: "saveKas", data: record });
}

async function deleteKas(id) {
  if (!confirm("Hapus catatan kas ini?")) return;
  state.kas = state.kas.filter(k => k.id !== id);
  persistLocal();
  renderAll();
  showToast("Catatan kas dihapus.");
  await syncToCloud({ action: "deleteKas", id });
}

function renderKas() {
  const tbody = document.getElementById("tbodyKas");
  if (state.kas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-4 py-6 text-center text-slate-400">Belum ada catatan iuran kas.</td></tr>`;
    return;
  }

  tbody.innerHTML = state.kas.map(k => `
    <tr class="hover:bg-slate-50">
      <td class="px-4 py-3 text-xs text-slate-500">${k.tanggal}</td>
      <td class="px-4 py-3 font-medium text-slate-800">${k.nama}</td>
      <td class="px-4 py-3">${k.periode}</td>
      <td class="px-4 py-3 font-semibold text-emerald-700">Rp ${Number(k.nominal).toLocaleString("id-ID")}</td>
      <td class="px-4 py-3"><span class="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-800">${k.status}</span></td>
      <td class="px-4 py-3 admin-only ${state.isAdmin ? '' : 'hidden'}">
        <button onclick="deleteKas('${k.id}')" class="text-rose-600 hover:underline text-xs font-medium">Hapus</button>
      </td>
    </tr>
  `).join("");
}

// =========================================================================
// MODUL 3: LAYANAN SURAT
// =========================================================================
async function saveSurat(e) {
  e.preventDefault();
  const record = {
    id: "S-" + Date.now(),
    tanggal: new Date().toISOString().split("T")[0],
    nama: document.getElementById("suratNama").value.trim(),
    alamat: document.getElementById("suratAlamat").value.trim(),
    jenis: document.getElementById("suratJenis").value,
    keperluan: document.getElementById("suratKeperluan").value.trim(),
    status: "Menunggu"
  };

  state.surat.unshift(record);
  persistLocal();
  renderAll();
  document.getElementById("formSurat").reset();
  showToast("Pengajuan surat berhasil dikirim.");
  await syncToCloud({ action: "saveSurat", data: record });
}

async function updateStatusSurat(id, newStatus) {
  const item = state.surat.find(s => s.id === id);
  if (!item) return;
  item.status = newStatus;
  persistLocal();
  renderAll();
  showToast(`Status surat diubah menjadi ${newStatus}.`);
  await syncToCloud({ action: "updateSurat", id, status: newStatus });
}

function renderSurat() {
  const tbody = document.getElementById("tbodySurat");
  if (state.surat.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="px-4 py-6 text-center text-slate-400">Belum ada pengajuan surat.</td></tr>`;
    return;
  }

  const badgeColor = (st) => {
    if (st === "Selesai") return "bg-emerald-100 text-emerald-800";
    if (st === "Diproses") return "bg-sky-100 text-sky-800";
    return "bg-amber-100 text-amber-800";
  };

  tbody.innerHTML = state.surat.map(s => `
    <tr class="hover:bg-slate-50">
      <td class="px-4 py-3 text-xs text-slate-500">${s.tanggal}</td>
      <td class="px-4 py-3">
        <p class="font-medium text-slate-800">${s.nama}</p>
        <p class="text-xs text-slate-500">${s.alamat}</p>
      </td>
      <td class="px-4 py-3">
        <p class="font-medium">${s.jenis}</p>
        <p class="text-xs text-slate-500">${s.keperluan || "-"}</p>
      </td>
      <td class="px-4 py-3">
        <span class="px-2 py-0.5 text-xs rounded-full font-medium ${badgeColor(s.status)}">${s.status}</span>
      </td>
      <td class="px-4 py-3 admin-only ${state.isAdmin ? '' : 'hidden'}">
        <select onchange="updateStatusSurat('${s.id}', this.value)" class="text-xs border border-slate-300 rounded px-2 py-1 bg-white">
          <option value="Menunggu" ${s.status === "Menunggu" ? "selected" : ""}>Menunggu</option>
          <option value="Diproses" ${s.status === "Diproses" ? "selected" : ""}>Diproses</option>
          <option value="Selesai" ${s.status === "Selesai" ? "selected" : ""}>Selesai</option>
        </select>
      </td>
    </tr>
  `).join("");
}

// =========================================================================
// DASHBOARD SUMMARY
// =========================================================================
function renderDashboard() {
  document.getElementById("statTotalWarga").textContent = state.warga.length;
  const tetap = state.warga.filter(w => w.status === "Tetap").length;
  const kontrak = state.warga.filter(w => w.status === "Kontrak").length;
  document.getElementById("statStatusWarga").textContent = `${tetap} Tetap • ${kontrak} Kontrak`;

  const totalKas = state.kas.reduce((sum, item) => sum + Number(item.nominal || 0), 0);
  document.getElementById("statTotalKas").textContent = `Rp ${totalKas.toLocaleString("id-ID")}`;
  document.getElementById("statKasLunas").textContent = `${state.kas.length} transaksi tercatat`;

  document.getElementById("statTotalSurat").textContent = state.surat.length;
  const pending = state.surat.filter(s => s.status !== "Selesai").length;
  document.getElementById("statSuratPending").textContent = `${pending} dalam proses`;

  const recentBox = document.getElementById("recentSuratList");
  const recent = state.surat.slice(0, 3);
  if (recent.length === 0) {
    recentBox.innerHTML = `<p class="text-slate-400 text-xs">Belum ada pengajuan surat.</p>`;
  } else {
    recentBox.innerHTML = recent.map(s => `
      <div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
        <div>
          <p class="font-medium text-slate-800 text-xs">${s.nama} — ${s.jenis}</p>
          <p class="text-[11px] text-slate-500">${s.alamat} • ${s.tanggal}</p>
        </div>
        <span class="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">${s.status}</span>
      </div>
    `).join("");
  }
}

function renderAll() {
  renderDashboard();
  renderWarga();
  renderKas();
  renderSurat();
}
