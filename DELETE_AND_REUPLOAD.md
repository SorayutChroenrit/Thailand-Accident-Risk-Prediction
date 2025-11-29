# 🔄 How to Delete Old Data and Re-upload All 144k Records

## ปัญหา
- Supabase มี 122k records
- CSV file มี 144k records
- ต้องการลบข้อมูลเก่าและอัพโหลดใหม่ทั้งหมด

## วิธีที่เร็วที่สุด (แนะนำ!)

### Step 1: ลบข้อมูลเก่าทั้งหมดผ่าน Supabase SQL Editor

1. ไปที่ Supabase Dashboard: https://supabase.com/dashboard
2. เลือก Project ของคุณ
3. ไปที่ **SQL Editor** (เมนูซ้าย)
4. รัน SQL นี้:

```sql
-- Delete all records from accident_records table
DELETE FROM accident_records;

-- Verify deletion
SELECT COUNT(*) FROM accident_records;
-- Should return 0
```

⏱️ ใช้เวลาประมาณ **5-10 วินาที** (เร็วมาก!)

### Step 2: อัพโหลดข้อมูลใหม่ผ่าน Python Script

```bash
cd backend
source venv/bin/activate
python reupload_all_data_auto.py
```

หรือถ้าต้องการ confirmation:
```bash
python reupload_all_data.py
# พิมพ์ "DELETE" เพื่อยืนยัน
```

⏱️ ใช้เวลาประมาณ **10-15 นาที** สำหรับอัพโหลด 144k records

## ทางเลือกอื่น: ใช้ Supabase CSV Import

### Step 1: ลบข้อมูลเก่า (เหมือนข้างบน)

```sql
DELETE FROM accident_records;
```

### Step 2: Import CSV ผ่าน Supabase Dashboard

1. ไปที่ **Table Editor**
2. เลือกตาราง `accident_records`
3. คลิก **Import data via spreadsheet** (ปุ่มด้านบน)
4. เลือกไฟล์ `accident_2019_2025_with_weather.csv`
5. Map columns:
   - `timestamp` → `accident_datetime`
   - `ลักษณะการเกิดเหตุ` → `accident_type`
   - `จังหวัด` → `province`
   - `ผู้เสียชีวิต` → `casualties_fatal`
   - `ผู้บาดเจ็บสาหัส` → `casualties_serious`
   - `ผู้บาดเจ็บเล็กน้อย` → `casualties_minor`
6. คลิก **Import**

⏱️ อาจเร็วกว่า แต่ขึ้นอยู่กับ Supabase dashboard performance

## ทางเลือก 3: ใช้ SQL COPY (เร็วที่สุด แต่ต้องมี database access)

ถ้ามี direct PostgreSQL access:

```bash
# 1. Export CSV to server
psql "postgresql://..." -c "DELETE FROM accident_records;"

# 2. Import CSV
psql "postgresql://..." -c "\COPY accident_records(accident_datetime, accident_type, province, casualties_fatal, casualties_serious, casualties_minor) FROM 'accident_2019_2025_with_weather.csv' WITH CSV HEADER;"
```

⏱️ ใช้เวลาแค่ **1-2 นาที**!

## การเตรียม CSV File (ถ้าจำเป็น)

ถ้า columns ไม่ตรงกับ Supabase schema ให้สร้าง cleaned CSV:

```python
import pandas as pd

# Load original CSV
df = pd.read_csv('data/accident_2019_2025_with_weather.csv')

# Select and rename columns
df_clean = df[[
    'timestamp',
    'ลักษณะการเกิดเหตุ',
    'จังหวัด',
    'ผู้เสียชีวิต',
    'ผู้บาดเจ็บสาหัส',
    'ผู้บาดเจ็บเล็กน้อย'
]].copy()

df_clean.columns = [
    'accident_datetime',
    'accident_type',
    'province',
    'casualties_fatal',
    'casualties_serious',
    'casualties_minor'
]

# Fill missing values
df_clean['casualties_fatal'] = df_clean['casualties_fatal'].fillna(0).astype(int)
df_clean['casualties_serious'] = df_clean['casualties_serious'].fillna(0).astype(int)
df_clean['casualties_minor'] = df_clean['casualties_minor'].fillna(0).astype(int)

# Save cleaned CSV
df_clean.to_csv('data/accident_clean.csv', index=False)

print(f"Saved {len(df_clean):,} records to accident_clean.csv")
```

## การตรวจสอบหลังอัพโหลด

### ใน Supabase SQL Editor:

```sql
-- Count total records
SELECT COUNT(*) FROM accident_records;
-- Should be 144,858

-- Check casualties distribution
SELECT 
    SUM(casualties_fatal) as total_fatal,
    SUM(casualties_serious) as total_serious,
    SUM(casualties_minor) as total_minor
FROM accident_records;

-- Check date range
SELECT 
    MIN(accident_datetime) as earliest,
    MAX(accident_datetime) as latest,
    COUNT(*) as total
FROM accident_records;

-- Check provinces
SELECT province, COUNT(*) as count
FROM accident_records
GROUP BY province
ORDER BY count DESC
LIMIT 10;
```

### ใน Backend:

```bash
curl "http://localhost:8000/dashboard/stats?province=all" | python -m json.tool
```

ควรเห็น:
```json
{
  "summary": {
    "total_accidents": 144858
  }
}
```

## Troubleshooting

### ปัญหา: Upload ช้ามาก

**วิธีแก้:**
- ใช้ batch size ใหญ่ขึ้น (แก้ใน script: `batch_size = 2000`)
- ใช้ Supabase CSV import แทน
- ใช้ SQL COPY ถ้ามี direct database access

### ปัญหา: Error "column does not exist"

**วิธีแก้:**
- ตรวจสอบว่า column names ตรงกับ schema
- ดู schema: `SELECT column_name FROM information_schema.columns WHERE table_name = 'accident_records';`

### ปัญหา: Some records failed to upload

**วิธีแก้:**
1. Check error messages
2. Validate data types (datetime format, integer values)
3. Check for NULL values in required fields

### ปัญหา: จำนวน records ไม่ตรง

**วิธีตรวจสอบ:**
```bash
# Count in CSV (excluding header)
wc -l data/accident_2019_2025_with_weather.csv
# 144859 lines = 144858 records + 1 header

# Count in Supabase
psql "..." -c "SELECT COUNT(*) FROM accident_records;"
```

## Summary

**แนะนำ: วิธีที่ 1 (SQL DELETE + Python Upload)**
- ⚡ เร็ว: ลบ 10 วินาที, อัพโหลด 10-15 นาที
- ✅ ง่าย: แค่ run SQL และ Python script
- 🔒 ปลอดภัย: มี error handling

**เร็วที่สุด: SQL COPY (ถ้ามี access)**
- ⚡⚡⚡ ใช้เวลาแค่ 1-2 นาที ทั้งหมด!

**ง่ายที่สุด: Supabase CSV Import**
- 🖱️ Point and click
- ❓ ความเร็วขึ้นอยู่กับ Supabase
