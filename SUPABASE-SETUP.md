# Supabase Setup untuk NexSight Dashboard

## Langkah-langkah Setup

### 1. Buat Project di Supabase

1. Kunjungi [https://supabase.com](https://supabase.com)
2. Buat akun atau login
3. Klik "New Project"
4. Isi informasi project:
   - **Name**: nexsight-dashboard (atau nama yang Anda inginkan)
   - **Database Password**: Buat password yang kuat (simpan dengan aman!)
   - **Region**: Pilih region terdekat (Singapore untuk Indonesia)
5. Klik "Create new project" dan tunggu hingga selesai

### 2. Jalankan SQL Schema

1. Di Supabase Dashboard, buka **SQL Editor**
2. Klik "New query"
3. Copy seluruh isi file `supabase/schema.sql`
4. Paste ke SQL Editor
5. Klik "Run" atau tekan `Ctrl+Enter`
6. Pastikan tidak ada error

### 3. Dapatkan API Keys

1. Di Supabase Dashboard, buka **Settings** → **API**
2. Copy **Project URL** (contoh: `https://xxxxx.supabase.co`)
3. Copy **anon/public key** (untuk client-side)
4. Copy **service_role key** (untuk server-side) - **PENTING: Jangan expose key ini di client-side!**

### 4. Update Environment Variables

Tambahkan ke file `.env`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**PENTING:**
- `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` digunakan di client-side
- `SUPABASE_SERVICE_ROLE_KEY` hanya digunakan di server-side (API routes)
- Jangan commit file `.env` ke Git!

### 5. Verifikasi Setup

1. Restart development server:
   ```bash
   npm run dev
   ```

2. Buka aplikasi di browser: `http://localhost:3000`
3. Login dengan credentials: `admin` / `admin`
4. Navigate ke **Settings** → **General**
5. Coba tambah, edit, atau hapus Brand & Market Mapping

## Struktur Tabel

### `sight_general_brand_market_mapping`

Tabel untuk menyimpan Brand & Market Mapping di menu General.

**Columns:**
- `id` (BIGSERIAL, PRIMARY KEY) - Auto increment ID
- `brand` (VARCHAR(255)) - Nama brand
- `market` (VARCHAR(10)) - Market code (SGD, MYR, USC)
- `status` (VARCHAR(20)) - Status (Active, Inactive)
- `created_at` (TIMESTAMP) - Waktu dibuat
- `updated_at` (TIMESTAMP) - Waktu terakhir diupdate
- `created_by` (VARCHAR(255)) - User yang membuat
- `updated_by` (VARCHAR(255)) - User yang terakhir update

**Indexes:**
- Index pada `brand` untuk performa search
- Index pada `market` untuk filtering
- Index pada `status` untuk filtering

**Row Level Security (RLS):**
- Enabled untuk semua authenticated users
- Policies untuk SELECT, INSERT, UPDATE, DELETE

## API Endpoints

### GET `/api/settings/brand-market-mapping`
Fetch semua brand market mappings

### POST `/api/settings/brand-market-mapping`
Create new brand market mapping
```json
{
  "brand": "Brand Name",
  "market": "SGD",
  "status": "Active",
  "created_by": "admin"
}
```

### GET `/api/settings/brand-market-mapping/[id]`
Fetch single brand market mapping by ID

### PUT `/api/settings/brand-market-mapping/[id]`
Update brand market mapping
```json
{
  "brand": "Updated Brand Name",
  "market": "MYR",
  "status": "Inactive",
  "updated_by": "admin"
}
```

### DELETE `/api/settings/brand-market-mapping/[id]`
Delete brand market mapping

## Troubleshooting

### Error: "Missing Supabase environment variables"
- Pastikan file `.env` sudah dibuat
- Pastikan semua environment variables sudah diisi
- Restart development server setelah menambahkan env variables

### Error: "Failed to fetch brand market mappings"
- Pastikan SQL schema sudah dijalankan di Supabase
- Cek apakah tabel `sight_general_brand_market_mapping` sudah ada
- Cek Supabase Dashboard → Table Editor untuk melihat tabel

### Error: "Row Level Security policy violation"
- Pastikan RLS policies sudah dibuat (ada di schema.sql)
- Cek Supabase Dashboard → Authentication → Policies

### Error: "relation does not exist"
- Pastikan SQL schema sudah dijalankan
- Cek nama tabel di Supabase Dashboard → Table Editor

### `sight_user_management`

Tabel untuk menyimpan User Management di menu Settings.

**Columns:**
- `id` (BIGSERIAL, PRIMARY KEY) - Auto increment ID
- `name` (VARCHAR(255)) - Nama lengkap user
- `email` (VARCHAR(255), UNIQUE) - Email user (unique)
- `username` (VARCHAR(255), UNIQUE) - Username user (unique)
- `password_hash` (VARCHAR(255)) - Password yang sudah di-hash
- `role` (VARCHAR(50)) - Role user (Admin, Manager, User)
- `status` (VARCHAR(20)) - Status (Active, Inactive)
- `last_login` (TIMESTAMP) - Waktu terakhir login
- `created_at` (TIMESTAMP) - Waktu dibuat
- `updated_at` (TIMESTAMP) - Waktu terakhir diupdate
- `created_by` (VARCHAR(255)) - User yang membuat
- `updated_by` (VARCHAR(255)) - User yang terakhir update

**Indexes:**
- Index pada `email` untuk performa search
- Index pada `username` untuk performa search
- Index pada `role` untuk filtering
- Index pada `status` untuk filtering

**Row Level Security (RLS):**
- Enabled untuk semua authenticated users
- Policies untuk SELECT, INSERT, UPDATE, DELETE

**Catatan Penting:**
- Password saat ini disimpan sebagai plain text (TIDAK AMAN untuk production!)
- Untuk production, gunakan bcrypt atau library hashing lainnya untuk hash password sebelum disimpan

## API Endpoints

### Brand Market Mapping

### GET `/api/settings/brand-market-mapping`
Fetch semua brand market mappings

### POST `/api/settings/brand-market-mapping`
Create new brand market mapping
```json
{
  "brand": "Brand Name",
  "market": "SGD",
  "status": "Active",
  "created_by": "admin"
}
```

### GET `/api/settings/brand-market-mapping/[id]`
Fetch single brand market mapping by ID

### PUT `/api/settings/brand-market-mapping/[id]`
Update brand market mapping
```json
{
  "brand": "Updated Brand Name",
  "market": "MYR",
  "status": "Inactive",
  "updated_by": "admin"
}
```

### DELETE `/api/settings/brand-market-mapping/[id]`
Delete brand market mapping

### User Management

### GET `/api/settings/user-management`
Fetch semua users

### POST `/api/settings/user-management`
Create new user
```json
{
  "fullName": "John Doe",
  "email": "john.doe@example.com",
  "username": "johndoe",
  "password": "password123",
  "role": "User",
  "status": "Active",
  "created_by": "admin"
}
```

### GET `/api/settings/user-management/[id]`
Fetch single user by ID

### PUT `/api/settings/user-management/[id]`
Update user
```json
{
  "fullName": "John Doe Updated",
  "email": "john.doe@example.com",
  "username": "johndoe",
  "password": "newpassword123",
  "role": "Admin",
  "status": "Active",
  "updated_by": "admin"
}
```

### DELETE `/api/settings/user-management/[id]`
Delete user

## Next Steps

Untuk menu Settings lainnya (Profile Setting, Activity Log), buat tabel dengan prefix `sight_` sesuai menu:
- Profile Setting → `sight_profile_*`
- Activity Log → `sight_activity_*`

Contoh:
- `sight_profile_settings`
- `sight_activity_log`
