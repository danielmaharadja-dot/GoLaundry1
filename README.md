# GoLaundry — Aplikasi Laundry Antar Jemput

Aplikasi full-stack untuk layanan laundry antar jemput, responsif di HP, tablet, dan desktop.

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** MySQL

## Fitur

**Customer**
- Daftar & login
- Pesan laundry (pilih layanan, jumlah, alamat jemput, jadwal)
- Tracking status pesanan (dipesan → dijemput → dicuci → siap antar → diantar)
- Riwayat pesanan & status pembayaran
- Kelola alamat tersimpan

**Admin**
- Lihat & filter semua pesanan
- Ubah status pesanan & tandai pembayaran lunas
- Kelola layanan (tambah, edit, nonaktifkan, atur harga)

Tampilan otomatis menyesuaikan ukuran layar: navigasi bawah di HP, sidebar di tablet/desktop.

---

## 1. Menyiapkan Database

Pastikan MySQL (versi 8+) sudah terpasang dan berjalan, lalu import skema (perintah ini otomatis membuat database `golaundry`):

```bash
mysql -u root -p < backend/schema.sql
```

## 2. Menjalankan Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env, sesuaikan DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, dan JWT_SECRET

npm run seed   # membuat akun admin default (admin@golaundry.com / admin123)
npm run dev    # server berjalan di http://localhost:4000
```

## 3. Menjalankan Frontend

Buka terminal baru:

```bash
cd frontend
npm install
npm run dev    # aplikasi berjalan di http://localhost:5173
```

Buka `http://localhost:5173` di browser. Untuk uji tampilan mobile/tablet, gunakan mode responsif di DevTools browser (F12 → toggle device toolbar).

## 4. Build untuk Produksi

```bash
cd frontend
npm run build   # hasil build ada di frontend/dist, siap di-deploy (Vercel, Netlify, dll)
```

Backend dapat di-deploy ke layanan seperti Railway, Render, atau VPS biasa. Pastikan environment variable `DATABASE_URL`, `JWT_SECRET`, dan `CLIENT_ORIGIN` diatur sesuai domain produksi.

## Struktur Proyek

```
golaundry/
├── backend/
│   ├── routes/          # auth, services, orders, addresses
│   ├── middleware/       # autentikasi JWT
│   ├── db.js
│   ├── schema.sql        # skema database PostgreSQL
│   ├── seed.js           # membuat akun admin default
│   └── server.js
└── frontend/
    └── src/
        ├── pages/         # halaman customer & admin
        ├── components/    # AppShell (navigasi responsif), StatusTracker
        ├── context/       # AuthContext (login state)
        └── api.js         # client untuk memanggil backend
```

## Catatan Keamanan

- Ganti `JWT_SECRET` dengan string acak yang panjang sebelum deploy ke produksi.
- Segera ganti password akun admin default setelah login pertama kali.
- Aplikasi ini belum mengimplementasikan gateway pembayaran online (mis. Midtrans/Xendit) — status pembayaran saat ini ditandai manual oleh admin. Bisa dikembangkan lebih lanjut sesuai kebutuhan.
