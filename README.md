# SIM Warga RT — Web App (GitHub + Google Sheets)

Aplikasi web pendataan warga, transparansi iuran kas RT, dan layanan pengajuan surat pengantar. Dibangun menggunakan **HTML, Tailwind CSS, dan Vanilla JavaScript** sehingga dapat langsung di-deploy gratis melalui **GitHub Pages, Netlify, atau Vercel**, serta terhubung ke **Google Sheets** sebagai database cloud.

## Struktur File
- `index.html` — Antarmuka utama (Dashboard, Data Warga, Iuran Kas, Layanan Surat, Pengaturan Cloud).
- `style.css` — Styling tambahan untuk navigasi tab.
- `app.js` — Logika CRUD, penyamaran NIK otomatis untuk publik, login pengurus, dan sinkronisasi data.
- `google-apps-script.gs` — Kode backend yang ditempel ke Google Apps Script untuk menyimpan data ke Google Sheets.

## Cara Upload ke GitHub & Online-kan (Deploy)
1. Buat repositori baru di GitHub (misalnya `sim-warga-rt`).
2. Unggah seluruh file di folder ini (`index.html`, `style.css`, `app.js`, `google-apps-script.gs`, `README.md`) ke repositori tersebut.
3. Aktifkan **GitHub Pages** (Settings -> Pages -> Branch `main` -> Save) atau hubungkan repositori GitHub Anda ke **Netlify / Vercel**.
4. Untuk menghubungkan database online:
   - Buka Google Sheets baru -> **Ekstensi** -> **Apps Script**.
   - Salin isi file `google-apps-script.gs`, tempel ke editor Apps Script, lalu klik **Terapkan (Deploy) -> Web app** (Akses: *Siapa saja / Anyone*).
   - Salin URL Web App yang dihasilkan, lalu masukkan di menu **Koneksi Cloud** pada aplikasi web (atau isi variabel `DEFAULT_API_URL` di `app.js`).

## Akses Pengurus (Admin)
- Klik tombol **Login Pengurus** di pojok kanan atas.
- PIN default: `123456` (dapat diubah pada variabel `ADMIN_PIN` di baris ke-6 file `app.js`).
