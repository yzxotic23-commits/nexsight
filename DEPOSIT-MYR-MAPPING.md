# Deposit Monitor - MYR Data Mapping

## Database Information
- **Supabase Instance**: Supabase Data (Secondary)
- **Table Name**: `deposit`
- **Currency**: MYR (untuk SGD & USC akan menyusul)

## Column Mapping

| Frontend Metric | Supabase Column | Description | Calculation |
|----------------|-----------------|-------------|-------------|
| **Total Transaction** | - | Jumlah semua row | `COUNT(*)` dengan filter date range dan brand |
| **Total Trans Automation** | `operator_group` | Transaksi dengan automation | `COUNT(*)` WHERE `operator_group` LIKE '%automation%' |
| **Avg Processing Time** | `process_time` | Rata-rata waktu proses automation | `AVG(process_time)` untuk automation transactions |
| **Overdue > 60s** | `process_time` | Transaksi automation > 60 detik | `COUNT(*)` WHERE automation AND `process_time > 60` |
| **Coverage Rate** | `operator_group` | Persentase coverage | `((total - staff_count) / total) * 100` |
| **Date Filter** | `date` | Filter tanggal | Format: `YYYY-MM-DD` |
| **Brand Filter** | `line` | Filter brand | Exact match (optional) |

## Detailed Logic

### 1. Total Transaction
```sql
SELECT COUNT(*) FROM deposit
WHERE date >= :startDate 
  AND date <= :endDate
  AND line = :brand (if not 'ALL')
```

### 2. Total Trans Automation
```sql
SELECT COUNT(*) FROM deposit
WHERE date >= :startDate 
  AND date <= :endDate
  AND line = :brand (if not 'ALL')
  AND LOWER(operator_group) LIKE '%automation%'
```

### 3. Avg Processing Time
```sql
SELECT AVG(process_time) FROM deposit
WHERE date >= :startDate 
  AND date <= :endDate
  AND line = :brand (if not 'ALL')
  AND LOWER(operator_group) LIKE '%automation%'
```

### 4. Overdue > 60s
```sql
SELECT COUNT(*) FROM deposit
WHERE date >= :startDate 
  AND date <= :endDate
  AND line = :brand (if not 'ALL')
  AND LOWER(operator_group) LIKE '%automation%'
  AND process_time > 60
```

### 5. Coverage Rate
```sql
-- Count staff transactions
SELECT COUNT(*) FROM deposit
WHERE date >= :startDate 
  AND date <= :endDate
  AND line = :brand (if not 'ALL')
  AND LOWER(operator_group) LIKE '%staff%'

-- Calculate coverage rate
coverage_rate = ((total_transaction - staff_count) / total_transaction) * 100
```

## API Endpoint

### GET `/api/deposit/data`

**Query Parameters:**
- `startDate` (required): Start date in `YYYY-MM-DD` format
- `endDate` (required): End date in `YYYY-MM-DD` format
- `currency` (required): Currency code (`MYR`, `SGD`, `USC`)
- `brand` (optional): Brand name (default: `ALL`)

**Example Request:**
```
GET /api/deposit/data?startDate=2026-01-01&endDate=2026-01-31&currency=MYR&brand=ALL
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "totalTransaction": 1250,
    "totalTransAutomation": 1100,
    "avgProcessingTime": 42.5,
    "overdueOver60s": 85,
    "coverageRate": 92.3,
    "dailyData": [
      { "date": "2026-01-01", "count": 45 },
      { "date": "2026-01-02", "count": 52 }
    ],
    "chartData": {
      "overdueTrans": {
        "2026-01-01": 3,
        "2026-01-02": 4
      },
      "avgProcessingTime": {
        "2026-01-01": 40.2,
        "2026-01-02": 43.8
      },
      "coverageRate": {
        "2026-01-01": 91.5,
        "2026-01-02": 93.1
      },
      "transactionVolume": {
        "2026-01-01": 45,
        "2026-01-02": 52
      }
    }
  }
}
```

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_DATA_URL=<your_supabase_data_url>
NEXT_PUBLIC_SUPABASE_DATA_ANON_KEY=<your_anon_key>
SUPABASE_DATA_SERVICE_ROLE_KEY=<your_service_role_key>
```

## Implementation Status

- ✅ API Route created (`app/api/deposit/data/route.js`)
- ✅ Supabase Data client (`lib/supabase/data-client.js`)
- ✅ Supabase Data server (`lib/supabase/data-server.js`)
- ✅ Frontend integration for MYR (Deposit Monitor page)
- ⏳ SGD & USC implementation (using mock data for now)
- ⏳ Brand Comparison tab integration
- ⏳ Slow Transaction tab integration
- ⏳ Case Volume tab integration

## Testing

1. Add Supabase Data credentials to `.env`
2. Restart development server
3. Navigate to Deposit Monitor
4. Select **MYR** currency
5. Check console for API logs
6. Verify KPI metrics display real data from Supabase

## Notes

- Currently only **MYR** is fetching real data from Supabase
- **SGD** and **USC** still use mock data (will be implemented later)
- **Overview tab** only - other tabs still use mock data
- Brand filter works with the API
