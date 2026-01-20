# nexxpay

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
NEXTAUTH_SECRET=nexflow-dashboard-secret-key-change-in-production-2024
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

Untuk demo, gunakan email dan password apapun untuk login.

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

Di Vercel, set environment variables:
- `NEXTAUTH_SECRET` - Secret key untuk NextAuth.js (generate dengan: `openssl rand -base64 32`)
- `NEXTAUTH_URL` - URL aplikasi (otomatis di Vercel)

## Troubleshooting

### Error: [next-auth][error][NO_SECRET]

Pastikan file `.env.local` sudah dibuat dengan `NEXTAUTH_SECRET` dan `NEXTAUTH_URL`.

### Error: [next-auth][warn][NEXTAUTH_URL]

Set `NEXTAUTH_URL` di `.env.local` sesuai environment Anda.

## License

Private project
