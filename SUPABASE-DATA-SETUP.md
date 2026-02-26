# Supabase Environment Variables Setup

## Struktur Environment Variables

Project ini menggunakan **2 Supabase instance**:

### 1. **Supabase Main** (SGD/USC, Settings, User Management)
```env
NEXT_PUBLIC_SUPABASE_URL=https://qsbbemeeykpqxakhwmal.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Digunakan untuk:**
- User authentication (`sight_user_management`)
- Brand market mapping (`sight_general_brand_market_mapping`)
- Bank price data (`bank_price`)
- Wealths+ data (`jira_issues`)

### 2. **Supabase Data** (MYR Deposit Monitor & Other Data)
```env
NEXT_PUBLIC_SUPABASE_DATA_URL=<YOUR_SUPABASE_DATA_URL>
NEXT_PUBLIC_SUPABASE_DATA_ANON_KEY=<YOUR_SUPABASE_DATA_ANON_KEY>
SUPABASE_DATA_SERVICE_ROLE_KEY=<YOUR_SUPABASE_DATA_SERVICE_ROLE_KEY>
```

**Digunakan untuk:**
- MYR Deposit Monitor data
- Additional data sources

## Cara Mendapatkan Credentials Supabase Data

1. **Login ke Supabase Dashboard**: https://app.supabase.com
2. **Pilih project** untuk MYR data
3. **Klik Settings** (sidebar kiri)
4. **Klik API**
5. **Copy credentials**:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_DATA_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_DATA_ANON_KEY`
   - **service_role key** → `SUPABASE_DATA_SERVICE_ROLE_KEY`

## File Structure

```
lib/supabase/
├── client.js           # Supabase Main (client-side)
├── server.js           # Supabase Main (server-side)
├── data-client.js      # Supabase Data (client-side)
└── data-server.js      # Supabase Data (server-side)
```

## Usage Example

### Using Supabase Main
```javascript
import { supabaseClient } from '@/lib/supabase/client'
import { supabaseServer } from '@/lib/supabase/server'

// Fetch from main database
const { data } = await supabaseClient
  .from('sight_user_management')
  .select('*')
```

### Using Supabase Data (MYR)
```javascript
import { supabaseDataClient } from '@/lib/supabase/data-client'
import { supabaseDataServer } from '@/lib/supabase/data-server'

// Fetch from data database
const { data } = await supabaseDataServer
  .from('your_myr_table')
  .select('*')
```

## Langkah Selanjutnya

1. ✅ Tambahkan credentials Supabase Data ke file `.env`
2. ⏳ Share informasi tabel MYR (nama tabel & kolom-kolomnya)
3. ⏳ Buat API route untuk fetch data MYR
4. ⏳ Update Deposit Monitor page untuk consume data real

## Need Help?

Jika ada error terkait Supabase credentials, cek:
- File `.env` sudah dibuat dan berisi credentials yang benar
- Restart development server setelah menambahkan env variables
- Credentials di Supabase Dashboard → Settings → API
