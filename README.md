# StokPintar - Aplikasi Manajemen Stok Gudang

Aplikasi web manajemen stok gudang (Gudang Pro) yang dibangun menggunakan React, Vite, TailwindCSS, dan Shadcn/UI, serta terintegrasi dengan backend Base44 (Database & Auth).

Proyek ini telah dirapikan dari file mentah/acak menjadi proyek web terstruktur standar yang siap diunggah ke GitHub dan dideploy ke Vercel.

## Fitur Utama

- **Dashboard:** Statistik ringkas untuk Owner, Admin, dan Staff.
- **Master Data:** Manajemen produk, kategori, pemasok (supplier), dan ekspedisi.
- **Transaksi:** Pencatatan stok masuk, stok keluar, distribusi antar gudang, penjualan grosir, retur barang, dan cashflow kasir.
- **POS (Point of Sale):** Penjualan offline, whatsapp, dan marketplace.
- **Rekonsiliasi:** Integrasi pencocokan data pesanan Shopee.
- **Persetujuan (Approval Center):** Sistem persetujuan owner untuk transaksi tertentu.

---

## Struktur Proyek

Setelah dirapikan, struktur proyek ini adalah sebagai berikut:
```text
StokPintar/
├── schemas/                # Skema data JSON database
├── src/
│   ├── api/                # Client SDK untuk backend (base44Client)
│   ├── components/         # Komponen UI custom dan tata letak (layout)
│   │   ├── ui/             # Komponen visual dasar (Shadcn/UI)
│   │   └── pos/            # Komponen Point of Sale
│   ├── hooks/              # Custom React hooks (use-mobile)
│   ├── lib/                # Helper, konteks otentikasi (AuthContext), & utils
│   ├── pages/              # Halaman-halaman utama aplikasi
│   ├── App.jsx             # Router dan pembungkus aplikasi utama
│   ├── index.css           # Global stylesheet & variabel Tailwind
│   └── main.jsx            # Entry point React
├── index.html              # Entry point HTML aplikasi
├── package.json            # Daftar dependencies & script build
├── tailwind.config.js      # Konfigurasi TailwindCSS
├── vite.config.js          # Konfigurasi bundler Vite (standard React)
└── vercel.json             # Konfigurasi routing rewrite untuk Vercel SPA
```

---

## Cara Menjalankan Lokal

### Prasyarat
- Pastikan Anda sudah menginstal [Node.js](https://nodejs.org/).

### Langkah-langkah
1. **Instal Dependensi:**
   ```bash
   npm install
   ```

2. **Konfigurasi Environment Variables:**
   Salin file `.env.example` menjadi `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Buka file `.env.local` dan masukkan ID Aplikasi dan URL backend Base44 Anda:
   ```env
   VITE_BASE44_APP_ID=your_app_id
   VITE_BASE44_APP_BASE_URL=https://your-backend.base44.app
   ```

3. **Jalankan Development Server:**
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:5173`.

---

## Panduan Deploy ke Vercel

Karena aplikasi ini adalah Single Page Application (SPA) dengan routing sisi klien (React Router), konfigurasi Vercel khusus telah ditambahkan melalui `vercel.json` agar halaman tidak menghasilkan error 404 ketika di-refresh.

### Langkah Deploy:
1. Hubungkan repositori GitHub proyek ini ke akun **Vercel** Anda.
2. Saat membuat proyek baru di Vercel, pilih framework preset: **Vite**.
3. Buka bagian **Environment Variables** di pengaturan proyek Vercel Anda, lalu tambahkan variabel berikut:
   - `VITE_BASE44_APP_ID` (Isi dengan ID aplikasi Base44 Anda)
   - `VITE_BASE44_APP_BASE_URL` (Isi dengan URL backend Base44 Anda)
4. Klik **Deploy**. Vercel akan otomatis melakukan build dan menyediakannya secara online.
