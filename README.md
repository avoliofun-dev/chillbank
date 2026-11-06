# 🌿 Chill Bank Family — Modern NFC & QR Savings App

Aplikasi pencatatan tabungan mandiri keluarga berbasis tap NFC tag atau pemindaian QR code / barcode. Dibangun menggunakan arsitektur modern **React + Vite + Tailwind CSS**, terhubung langsung ke **Supabase** (Auth, Postgres, Row Level Security), dan siap dideploy ke **Vercel** dengan protokol HTTPS.

---

## 🚀 Fitur Utama

### 1. Peran Pengguna (Role-Based Access Control)
- **Member:**
  - Registrasi & Login (Email & Password via Supabase Auth).
  - Mengajukan pesanan kantong tabungan baru (nama tabungan, target nominal, catatan).
  - Dashboard ringkasan total saldo, tabungan aktif, dan 10 transaksi terakhir.
  - Buka tabungan via **Web NFC** (tap kartu/stiker) atau **Kamera Scan QR / Input Token**.
  - Catat setoran dan penarikan langsung di halaman `/t/:token`.
  - Riwayat mutasi lengkap seluruh tabungan.
- **Admin:**
  - Panel kendali `/admin` yang diproteksi RLS (tidak dapat diakses oleh member biasa).
  - Review pesanan tabungan: Setujui (otomatis membuat token acak 32-karakter unik) atau Tolak dengan alasan.
  - Halaman **Tulis Tag NFC** via Web NFC API (`NDEFReader.write`) & generator **Cetak QR Code**.
  - Audit dan pembatalan mutasi transaksi (soft-cancel dengan alasan, saldo tabungan otomatis dikalkulasi ulang oleh database).
  - Manajemen anggota keluarga terdaftar.

### 2. Keamanan & Integritas Data
- **Row Level Security (RLS)** aktif di semua tabel (`profiles`, `pesanan_tabungan`, `tabungan`, `transaksi`).
- **Saldo Terkalkulasi Otomatis:** Saldo tidak pernah dipercayai dari input klien, melainkan dikalkulasi oleh trigger PostgreSQL dari akumulasi transaksi berstatus `sah`.
- **Validasi Penarikan:** Penarikan yang melebihi saldo tabungan akan ditolak secara otomatis di level database.
- **Enkripsi & Token:** Tag NFC hanya menyimpan URL dengan token acak 32-karakter tanpa data saldo atau data sensitif.

---

## 🛠️ Tech Stack
- **Frontend:** React 19, Vite, React Router 7, Tailwind CSS, Lucide React
- **NFC & QR:** Web NFC API (`NDEFReader`), `qrcode.react`, `html5-qrcode`
- **Backend / Database:** Supabase (Auth, PostgreSQL, Row Level Security, Triggers & Stored Procedures)
- **Hosting / Deployment:** Vercel (SPA rewrite fallback via `vercel.json`)

---

## 📂 Struktur Folder Proyek

```
chillbank/
├── .env.example                     # Contoh konfigurasi environment variable Supabase
├── index.html                       # Entry HTML
├── package.json                     # Dependensi dan script node
├── postcss.config.js                # Konfigurasi PostCSS
├── tailwind.config.js               # Konfigurasi tema warna Chill Bank
├── vercel.json                      # Konfigurasi SPA rewrite untuk Vercel
├── vite.config.js                   # Konfigurasi Vite
├── supabase/
│   └── migrations/
│       └── 20261107_init_chillbank.sql # Skema SQL lengkap (tabel, trigger, RLS, RPC)
└── src/
    ├── main.jsx                     # Entry React
    ├── App.jsx                      # Router & route protection
    ├── index.css                    # Styling utama & print friendly stylesheet
    ├── context/
    │   └── AuthContext.jsx          # Context otentikasi & role user
    ├── lib/
    │   └── supabase.js              # Inisialisasi Supabase client
    ├── utils/
    │   └── format.js                # Format mata uang Rupiah & tanggal Indonesia
    ├── components/
    │   ├── Navbar.jsx               # Header navigasi & status akun
    │   ├── Sidebar.jsx              # Navigasi desktop & mobile
    │   ├── Layout.jsx               # Layout pembungkus aplikasi
    │   └── ProtectedRoute.jsx       # Guard proteksi login & role admin
    └── pages/
        ├── Login.jsx                # Halaman masuk
        ├── Register.jsx             # Halaman registrasi member
        ├── Dashboard.jsx            # Dashboard member
        ├── PesanTabungan.jsx        # Formulir pengajuan tabungan
        ├── TabunganDetail.jsx       # Detail tabungan (/t/:token)
        ├── ScanTag.jsx              # Pemindai NFC & QR (/scan)
        ├── Riwayat.jsx              # Riwayat mutasi transaksi (/riwayat)
        ├── NotFound.jsx             # Halaman 404
        └── admin/
            ├── AdminDashboard.jsx   # Ringkasan statistik admin (/admin)
            ├── PesananList.jsx      # Review pesanan tabungan (/admin/pesanan)
            ├── TabunganList.jsx     # Daftar tabungan (/admin/tabungan)
            ├── TulisTag.jsx         # Tulis NFC & cetak QR (/admin/tulis-tag/:id)
            ├── TransaksiList.jsx    # Audit transaksi (/admin/transaksi)
            └── MemberList.jsx       # Kelola anggota keluarga (/admin/member)
```

---

## ⚡ Langkah Setup & Menjalankan Proyek

### 1. Setup Supabase
1. Buat proyek baru di [Supabase Dashboard](https://supabase.com).
2. Buka menu **SQL Editor** di dashboard proyek Anda.
3. Buka file `supabase/migrations/20261107_init_chillbank.sql`, salin seluruh isinya, tempel ke SQL Editor Supabase, lalu tekan tombol **Run**.
4. Buka menu **Project Settings** -> **API**, lalu salin:
   - **Project URL**
   - **anon / public key**

### 2. Konfigurasi Environment Variables
Buat file `.env` di root folder proyek (atau salin dari `.env.example`):
```bash
cp .env.example .env
```
Isi variabel berikut:
```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Menjadikan Akun Anda Sebagai Admin
1. Jalankan aplikasi lalu daftarkan akun pertama Anda melalui menu **Daftar** (misal: `admin@keluarga.com`).
2. Masuk ke **SQL Editor** Supabase, lalu jalankan perintah berikut untuk memberikan hak akses Admin:
```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@keluarga.com');
```
3. Refresh aplikasi. Header akun Anda sekarang akan menampilkan badge **Mode Admin** dan menu panel `/admin` terbuka.

---

### 4. Menjalankan di Komputer Lokal (Development)
```bash
# Jalankan server development
npm run dev
```
Akses di browser: `http://localhost:5173`

---

## 🌐 Deploy ke Vercel (Produksi)

1. Push folder proyek ini ke repositori **GitHub / GitLab / Bitbucket** Anda.
2. Buka [Vercel Dashboard](https://vercel.com) dan pilih **Add New Project**.
3. Hubungkan repositori GitHub proyek ini.
4. Pada bagian **Environment Variables**, tambahkan:
   - `VITE_SUPABASE_URL` = URL proyek Supabase Anda
   - `VITE_SUPABASE_ANON_KEY` = Anon key Supabase Anda
5. Klik tombol **Deploy**. Vercel akan otomatis mendeteksi konfigurasi Vite dan file `vercel.json`.

---

## 📱 Catatan Penting Mengenai Web NFC API
- **Dukungan Perangkat:** Web NFC API (`NDEFReader`) saat ini didukung secara resmi pada **Google Chrome di perangkat Android**.
- **Kewajiban HTTPS:** Web NFC dan akses kamera **hanya dapat berjalan di lingkungan HTTPS yang aman** (atau `localhost` saat pengembangan).
- **Rekomendasi Operasional Admin:** Admin sebaiknya membuka halaman **Tulis Tag** dari browser Google Chrome di ponsel Android yang mendukung NFC saat menempelkan kartu tag NFC baru. Untuk perangkat lain (iOS/Laptop), gunakan tombol **Cetak Kode QR**.

