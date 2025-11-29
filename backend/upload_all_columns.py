#!/usr/bin/env python3
"""
Upload ALL columns from CSV to Supabase
Simple version - just upload everything!
"""

from datetime import datetime

import pandas as pd
from supabase_traffic_client import get_supabase_traffic_client

print("=" * 80)
print("📤 UPLOAD ALL CSV DATA TO SUPABASE")
print("=" * 80)

# Load CSV
print("\n📁 Loading CSV...")
df = pd.read_csv("data/accident_2019_2025_with_weather.csv")
print(f"✅ Loaded {len(df):,} records")
print(f"   Columns ({len(df.columns)}): {list(df.columns)[:5]}...")

# Map Thai column names to English for Supabase
print("\n🔧 Mapping column names...")
column_mapping = {
    "timestamp": "accident_datetime",
    "ลักษณะการเกิดเหตุ": "accident_type",
    "จังหวัด": "province",
    "ผู้เสียชีวิต": "casualties_fatal",
    "ผู้บาดเจ็บสาหัส": "casualties_serious",
    "ผู้บาดเจ็บเล็กน้อย": "casualties_minor",
    "LATITUDE": "latitude",
    "LONGITUDE": "longitude",
    "ปีที่เกิดเหตุ": "accident_year",
    "วันที่เกิดเหตุ": "accident_date",
    "เวลา": "accident_time",
    "ACC_CODE": "acc_code",
    "หน่วยงาน": "agency",
    "สายทาง": "route",
    "KM": "km",
    "บริเวณที่เกิดเหตุ": "location_area",
    "มูลเหตุสันนิษฐาน": "cause",
    "สภาพอากาศ": "weather_condition",
    "รถที่เกิดเหตุ": "vehicles_involved",
    "hour": "hour",
    "temperature": "temperature",
    "dewpoint": "dewpoint",
    "humidity": "humidity",
    "wind_speed": "wind_speed",
    "wind_direction": "wind_direction",
    "pressure": "pressure",
    "cloud_cover": "cloud_cover",
}

# Rename columns
df_renamed = df.rename(columns=column_mapping)
print(f"✅ Renamed {len([k for k in column_mapping if k in df.columns])} columns")

# Convert to dict records
print("\n📦 Converting to records...")

# Fill NaN values
df_renamed = df_renamed.fillna(
    {
        "latitude": 0.0,
        "longitude": 0.0,
        "casualties_fatal": 0,
        "casualties_serious": 0,
        "casualties_minor": 0,
        "temperature": 0.0,
        "humidity": 0.0,
        "wind_speed": 0.0,
        "pressure": 0.0,
    }
)

# Replace remaining NaN with None for database
df_renamed = df_renamed.where(pd.notna(df_renamed), None)

records = df_renamed.to_dict("records")
print(f"✅ Prepared {len(records):,} records")
print(f"   Sample record columns: {list(records[0].keys())[:10]}...")

# Connect to Supabase
print("\n📡 Connecting to Supabase...")
client = get_supabase_traffic_client()

# Upload in batches
print(f"\n📤 Uploading {len(records):,} records...")
print("   This will take 10-15 minutes. Please wait...")

batch_size = 1000
total_uploaded = 0
start_time = datetime.now()

for i in range(0, len(records), batch_size):
    batch = records[i : i + batch_size]
    batch_num = (i // batch_size) + 1
    total_batches = (len(records) + batch_size - 1) // batch_size

    try:
        response = client.client.table("accident_records").insert(batch).execute()
        total_uploaded += len(batch)

        # Progress
        progress = (total_uploaded / len(records)) * 100
        elapsed = (datetime.now() - start_time).total_seconds()
        speed = total_uploaded / elapsed if elapsed > 0 else 0
        eta = (len(records) - total_uploaded) / speed if speed > 0 else 0

        print(
            f"   [{batch_num:3d}/{total_batches}] {total_uploaded:6,}/{len(records):,} "
            f"({progress:5.1f}%) | {speed:4.0f} rec/s | ETA: {int(eta / 60):2d}m{int(eta % 60):02d}s"
        )

    except Exception as e:
        print(f"   ❌ Batch {batch_num} error: {str(e)[:100]}")
        # Try to continue with next batch
        continue

# Verify
print(f"\n📊 Verifying...")
response = (
    client.client.table("accident_records")
    .select("*", count="exact")
    .limit(0)
    .execute()
)
final_count = response.count

elapsed_total = (datetime.now() - start_time).total_seconds()

print(f"\n✅ UPLOAD COMPLETE!")
print(f"   Records in Supabase: {final_count:,}")
print(f"   Expected: {len(records):,}")
print(f"   Time: {int(elapsed_total / 60)}m {int(elapsed_total % 60)}s")
print(f"   Speed: {total_uploaded / elapsed_total:.0f} records/second")

if final_count == len(records):
    print("\n🎉 SUCCESS! All records uploaded!")
elif final_count > 0:
    print(f"\n⚠️  Partial success: {final_count:,} / {len(records):,} records uploaded")
else:
    print(f"\n❌ FAILED: No records uploaded")

print("\n" + "=" * 80)
