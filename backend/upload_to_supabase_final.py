#!/usr/bin/env python3
"""
Upload CSV data to Supabase with correct schema mapping
"""

from datetime import datetime

import pandas as pd
from supabase_traffic_client import get_supabase_traffic_client

print("=" * 80)
print("📤 UPLOAD CSV TO SUPABASE (FINAL VERSION)")
print("=" * 80)

# Load CSV
print("\n📁 Loading CSV...")
df = pd.read_csv("data/accident_2019_2025_with_weather.csv")
print(f"✅ Loaded {len(df):,} records")

# Map CSV columns to Supabase schema
print("\n🔧 Mapping columns to Supabase schema...")
column_mapping = {
    # Core accident info
    "ACC_CODE": "acc_code",
    "ปีที่เกิดเหตุ": "accident_year",
    "วันที่เกิดเหตุ": "accident_date",
    "เวลา": "accident_time",
    "timestamp": "accident_datetime",
    "วันที่รายงาน": "report_date",
    "เวลาที่รายงาน": "report_time",
    "hour": "hour",
    # Location
    "LATITUDE": "latitude",
    "LONGITUDE": "longitude",
    "จังหวัด": "province",
    "KM": "km",
    "บริเวณที่เกิดเหตุ": "accident_location",
    # Organization/Route
    "หน่วยงาน": "organization",
    "สายทางหน่วยงาน": "organization_route",
    "รหัสสายทาง": "route_code",
    "สายทาง": "route_name",
    # Accident details
    "รถคันที่1": "vehicle_1",
    "บริเวณที่เกิดเหตุ": "accident_area_type",
    "มูลเหตุสันนิษฐาน": "presumed_cause",
    "ลักษณะการเกิดเหตุ": "accident_type",
    "สภาพอากาศ": "weather_condition",
    # Vehicles
    "รถที่เกิดเหตุ": "total_vehicles",
    "รถและคนที่เกิดเหตุ": "total_vehicles_and_people",
    "รถจักรยานยนต์": "motorcycles",
    "รถสามล้อเครื่อง": "tricycles",
    "รถยนต์นั่งส่วนบุคคล": "private_cars",
    "รถตู้": "vans",
    "รถปิคอัพโดยสาร": "passenger_pickups",
    "รถโดยสารมากกว่า4ล้อ": "buses",
    "รถปิคอัพบรรทุก4ล้อ": "pickup_trucks_4wheel",
    "รถบรรทุก6ล้อ": "trucks_6wheel",
    "รถบรรทุกไม่เกิน10ล้อ": "trucks_under_10wheel",
    "รถบรรทุกมากกว่า10ล้อ": "trucks_over_10wheel",
    "รถอีแต๋น": "tuk_tuks",
    "รถอื่นๆ": "other_vehicles",
    "คนเดินเท้า": "pedestrians",
    # Casualties
    "ผู้เสียชีวิต": "casualties_fatal",
    "ผู้บาดเจ็บสาหัส": "casualties_serious",
    "ผู้บาดเจ็บเล็กน้อย": "casualties_minor",
    "รวมจำนวนผู้บาดเจ็บ": "casualties_total",
    # Weather
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
print(f"✅ Mapped {len([k for k in column_mapping if k in df.columns])} columns")

# Select only columns that exist in both CSV and Supabase schema
supabase_columns = [
    "acc_code",
    "accident_year",
    "accident_date",
    "accident_time",
    "accident_datetime",
    "report_date",
    "report_time",
    "hour",
    "latitude",
    "longitude",
    "province",
    "km",
    "accident_location",
    "organization",
    "organization_route",
    "route_code",
    "route_name",
    "vehicle_1",
    "accident_area_type",
    "presumed_cause",
    "accident_type",
    "weather_condition",
    "total_vehicles",
    "total_vehicles_and_people",
    "motorcycles",
    "tricycles",
    "private_cars",
    "vans",
    "passenger_pickups",
    "buses",
    "pickup_trucks_4wheel",
    "trucks_6wheel",
    "trucks_under_10wheel",
    "trucks_over_10wheel",
    "tuk_tuks",
    "other_vehicles",
    "pedestrians",
    "casualties_fatal",
    "casualties_serious",
    "casualties_minor",
    "casualties_total",
    "temperature",
    "dewpoint",
    "humidity",
    "wind_speed",
    "wind_direction",
    "pressure",
    "cloud_cover",
]

available_cols = [col for col in supabase_columns if col in df_renamed.columns]
df_upload = df_renamed[available_cols].copy()

print(f"   Selected {len(available_cols)} columns for upload")

# Handle data types and missing values
print("\n🔧 Cleaning data...")

# Numeric columns - convert to int
int_cols = [
    "accident_year",
    "hour",
    "total_vehicles",
    "total_vehicles_and_people",
    "motorcycles",
    "tricycles",
    "private_cars",
    "vans",
    "passenger_pickups",
    "buses",
    "pickup_trucks_4wheel",
    "trucks_6wheel",
    "trucks_under_10wheel",
    "trucks_over_10wheel",
    "tuk_tuks",
    "other_vehicles",
    "pedestrians",
    "casualties_fatal",
    "casualties_serious",
    "casualties_minor",
    "casualties_total",
]

for col in int_cols:
    if col in df_upload.columns:
        df_upload[col] = (
            pd.to_numeric(df_upload[col], errors="coerce").fillna(0).astype(int)
        )

# Float columns
float_cols = [
    "latitude",
    "longitude",
    "km",
    "temperature",
    "dewpoint",
    "humidity",
    "wind_speed",
    "wind_direction",
    "pressure",
    "cloud_cover",
]

for col in float_cols:
    if col in df_upload.columns:
        df_upload[col] = (
            pd.to_numeric(df_upload[col], errors="coerce").fillna(0.0).astype(float)
        )

# Replace NaN with None for database NULL
df_upload = df_upload.where(pd.notna(df_upload), None)

# Convert to records
records = df_upload.to_dict("records")
print(f"✅ Prepared {len(records):,} records")
print(f"   Sample: {list(records[0].keys())[:10]}...")

# Connect to Supabase
print("\n📡 Connecting to Supabase...")
client = get_supabase_traffic_client()

# Upload in batches
print(f"\n📤 Uploading {len(records):,} records to Supabase...")
print("   Batch size: 1000 records")
print("   Estimated time: 10-15 minutes")
print("")

batch_size = 1000
total_uploaded = 0
failed_batches = 0
start_time = datetime.now()

for i in range(0, len(records), batch_size):
    batch = records[i : i + batch_size]
    batch_num = (i // batch_size) + 1
    total_batches = (len(records) + batch_size - 1) // batch_size

    try:
        response = client.client.table("accident_records").insert(batch).execute()
        total_uploaded += len(batch)

        # Calculate progress
        progress = (total_uploaded / len(records)) * 100
        elapsed = (datetime.now() - start_time).total_seconds()
        speed = total_uploaded / elapsed if elapsed > 0 else 0
        eta = (len(records) - total_uploaded) / speed if speed > 0 else 0

        print(
            f"   [{batch_num:3d}/{total_batches}] ✅ {total_uploaded:6,}/{len(records):,} "
            f"({progress:5.1f}%) | {speed:4.0f} rec/s | ETA: {int(eta / 60):2d}m{int(eta % 60):02d}s"
        )

    except Exception as e:
        failed_batches += 1
        error_msg = str(e)[:100]
        print(f"   [{batch_num:3d}/{total_batches}] ❌ Error: {error_msg}")

        if failed_batches >= 10:
            print(f"\n❌ Too many errors ({failed_batches}). Stopping.")
            break

elapsed_total = (datetime.now() - start_time).total_seconds()

# Verify upload
print(f"\n📊 Verifying upload...")
try:
    response = (
        client.client.table("accident_records")
        .select("*", count="exact")
        .limit(0)
        .execute()
    )
    final_count = response.count

    print(f"\n{'=' * 80}")
    print(f"✅ UPLOAD COMPLETE!")
    print(f"{'=' * 80}")
    print(f"   📊 Records in Supabase: {final_count:,}")
    print(f"   📋 Expected total: {len(records):,}")
    print(f"   ⏱️  Upload time: {int(elapsed_total / 60)}m {int(elapsed_total % 60)}s")
    print(f"   ⚡ Upload speed: {total_uploaded / elapsed_total:.0f} records/second")
    print(f"   ❌ Failed batches: {failed_batches}")

    if final_count == len(records):
        print(f"\n🎉 SUCCESS! All {final_count:,} records uploaded!")
    elif final_count > 0:
        missing = len(records) - final_count
        print(f"\n⚠️  Partial upload: Missing {missing:,} records")
    else:
        print(f"\n❌ FAILED: No records uploaded")

except Exception as e:
    print(f"❌ Error verifying: {e}")

print(f"\n{'=' * 80}")
