# nexsight

Modern, production-ready KPI Dashboard untuk monitoring finansial dan transaksi.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: JavaScript (JSX)
- **State Management**: Zustand
- **Authentication**: NextAuth.js (Auth.js)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Font**: Poppins (Google Fonts)

## Features

### Dashboard Modules

1. **Market Processing Monitor** - Monitoring transaksi per market (MYR/SGD/USC)
2. **Deposit Transaction Monitor** - Analisis deposit bulanan dengan currency filter
3. **Withdraw Transaction Monitor** - Analisis withdrawal bulanan dengan currency filter
4. **Wealth+ Account Production Monitor** - Tracking produksi akun baru
5. **Wealth+ Account Status/Output** - Status dan output volume akun
6. **Bank Account Rental & Usage Monitor** - Monitoring rental dan usage bank account

### Design Features

- **Dark/Light Mode** - Toggle theme dengan smooth transitions
- **Gold Accents** - Warna gold sebagai accent color untuk executive look
- **Responsive Design** - Desktop-first, fully responsive
- **Modern UI** - Clean, executive-friendly interface

## Getting Started

### Installation

```bash
npm install
```

### Environment Setup

**PENTING**: Buat file `.env.local` di root project dengan isi:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=nexsight-dashboard-secret-key-change-in-production-2024
```

Atau copy dari `.env.example`:
```bash
cp .env.example .env.local
```

### Development

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

### Login

**Default Credentials:**
- Username: `admin`
- Password: `admin`

### Build

```bash
npm run build
npm start
```

## Project Structure

```
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── api/
│   │   └── auth/
│   ├── dashboard/
│   │   ├── market/
│   │   ├── deposit/
│   │   ├── withdraw/
│   │   ├── wealth/
│   │   └── bank/
│   ├── layout.jsx
│   └── page.jsx
├── components/
│   ├── ChartContainer.jsx
│   ├── FilterBar.jsx
│   ├── Header.jsx
│   ├── KPICard.jsx
│   ├── Sidebar.jsx
│   ├── ThemeProvider.jsx
│   └── ThemeToggle.jsx
├── lib/
│   ├── stores/
│   │   ├── dashboardStore.js
│   │   ├── filterStore.js
│   │   ├── themeStore.js
│   │   └── uiStore.js
│   └── utils/
│       ├── formatters.js
│       └── mockData.js
└── middleware.js
```

## State Management

Zustand stores:
- `themeStore` - Theme mode (dark/light)
- `filterStore` - Global filters (month, currency, date range)
- `dashboardStore` - Shared dashboard data dan loading states
- `uiStore` - UI state (sidebar, notifications)

## Data

Saat ini menggunakan mock data dengan nilai finansial yang realistis. Data di-generate berdasarkan:
- Month filter
- Currency filter (untuk Deposit & Withdraw)
- H+1 data (yesterday's data)

## Deployment

Project siap untuk deployment di Vercel. File `vercel.json` sudah dikonfigurasi.

### Environment Variables untuk Production

**PENTING**: Di Vercel, set environment variables berikut:

#### 1. NEXTAUTH_SECRET (Required)
Secret key untuk encrypt JWT token. Untuk aplikasi demo/dummy, Anda bisa menggunakan:

**Option 1: Generate baru (Recommended)**
```bash
openssl rand -base64 32
```

**Option 2: Gunakan default (untuk demo saja)**
```
nexsight-dashboard-secret-key-change-in-production-2024
```

**Option 3: Online generator**
- Kunjungi: https://generate-secret.vercel.app/32
- Copy hasilnya

#### 2. NEXTAUTH_URL (Required)
URL production aplikasi Anda. Untuk project ini:
```
https://nexsight.vercel.app
```

**PENTING**: Ganti dengan URL Vercel Anda jika berbeda.

**Cara set di Vercel:**
1. Buka project di Vercel Dashboard
2. Go to **Settings** → **Environment Variables**
3. Klik **Add New**
4. Tambahkan variable pertama:
   - **Name**: `NEXTAUTH_SECRET`
   - **Value**: (paste secret key yang sudah di-generate atau gunakan default di atas)
   - **Environment**: Pilih **Production**, **Preview**, dan **Development** (semua)
5. Klik **Add New** lagi
6. Tambahkan variable kedua:
   - **Name**: `NEXTAUTH_URL`
   - **Value**: `https://nexsight.vercel.app` (atau URL Vercel Anda)
   - **Environment**: Pilih **Production**, **Preview**, dan **Development** (semua)
7. Klik **Save**
8. **Redeploy** aplikasi (go to Deployments → klik 3 dots → Redeploy)

**Catatan:**
- Setelah menambahkan environment variables, **WAJIB redeploy** agar perubahan berlaku
- Untuk aplikasi demo/dummy, bisa menggunakan default secret key di atas
- Untuk production real, **WAJIB generate secret key baru** yang unik

## Troubleshooting

### Error: [next-auth][error][NO_SECRET]

Pastikan file `.env.local` sudah dibuat dengan `NEXTAUTH_SECRET` dan `NEXTAUTH_URL`.

### Error: [next-auth][warn][NEXTAUTH_URL]

Set `NEXTAUTH_URL` di `.env.local` sesuai environment Anda.

## License

Private project
