"""
Upload Complete Accident Data to Supabase
------------------------------------------
This script uploads ALL columns from accident_2019_2025_with_weather.csv
to the accident_records table
"""

import os
from datetime import datetime, time

import pandas as pd
from dotenv import load_dotenv
from supabase import Client, create_client
from tqdm import tqdm

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Initialize Supabase client
client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def safe_int(value, default=0):
    """Safely convert to int"""
    try:
        if pd.isna(value):
            return default
        return int(float(value))
    except:
        return default


def safe_float(value):
    """Safely convert to float"""
    try:
        if pd.isna(value):
            return None
        return float(value)
    except:
        return None


def safe_str(value):
    """Safely convert to string"""
    if pd.isna(value):
        return None
    return str(value).strip()


def parse_date(date_str):
    """Parse date string"""
    try:
        if pd.isna(date_str):
            return None
        # Try YYYY-MM-DD format
        return datetime.strptime(str(date_str).split()[0], "%Y-%m-%d").date()
    except:
        return None


def parse_time(time_str):
    """Parse time string"""
    try:
        if pd.isna(time_str):
            return None
        parts = str(time_str).split(":")
        hour = int(parts[0])
        minute = int(parts[1]) if len(parts) > 1 else 0
        return time(hour=hour, minute=minute)
    except:
        return None


def parse_datetime(date_str, time_str):
    """Combine date and time"""
    try:
        date_obj = parse_date(date_str)
        time_obj = parse_time(time_str)
        if date_obj and time_obj:
            return datetime.combine(date_obj, time_obj)
        return None
    except:
        return None


def upload_full_accident_data(csv_path, batch_size=500):
    """Upload complete accident data to Supabase"""

    print(f"📖 Reading CSV file: {csv_path}")
    df = pd.read_csv(csv_path)
    print(f"✅ Loaded {len(df)} records")
    print(f"📋 Columns ({len(df.columns)}): {', '.join(df.columns.tolist()[:10])}...")
    print()

    records_to_upload = []
    skipped = 0
    uploaded_count = 0

    print(f"🔄 Processing data...")

    for idx, row in tqdm(df.iterrows(), total=len(df), desc="Processing"):
        try:
            # Get coordinates
            lat = safe_float(row.get("LATITUDE"))
            lon = safe_float(row.get("LONGITUDE"))

            if not lat or not lon:
                skipped += 1
                continue

            # Parse dates and times
            accident_date = parse_date(row.get("วันที่เกิดเหตุ"))
            accident_time = parse_time(row.get("เวลา"))
            accident_datetime = parse_datetime(row.get("วันที่เกิดเหตุ"), row.get("เวลา"))
            report_date = parse_date(row.get("วันที่รายงาน"))
            report_time = parse_time(row.get("เวลาที่รายงาน"))

            # Parse timestamp
            timestamp_str = safe_str(row.get("timestamp"))
            timestamp = None
            if timestamp_str:
                try:
                    timestamp = datetime.fromisoformat(timestamp_str.replace(" ", "T"))
                except:
                    pass

            # Get year
            year = safe_int(row.get("ปีที่เกิดเหตุ"))

            # Create unique event_id
            event_id = f"accident_{year}_{safe_str(row.get('ACC_CODE', idx))}"

            # Build complete record
            record = {
                # Identification
                "acc_code": safe_str(row.get("ACC_CODE")),
                "event_id": event_id,
                # Date/Time
                "accident_year": year,
                "accident_date": accident_date.isoformat() if accident_date else None,
                "accident_time": accident_time.isoformat() if accident_time else None,
                "accident_datetime": accident_datetime.isoformat()
                if accident_datetime
                else None,
                "report_date": report_date.isoformat() if report_date else None,
                "report_time": report_time.isoformat() if report_time else None,
                "hour": safe_int(row.get("hour")),
                "timestamp": timestamp.isoformat() if timestamp else None,
                # Location
                "latitude": lat,
                "longitude": lon,
                "province": safe_str(row.get("จังหวัด")),
                "organization": safe_str(row.get("หน่วยงาน")),
                "organization_route": safe_str(row.get("สายทางหน่วยงาน")),
                "route_code": safe_str(row.get("รหัสสายทาง")),
                "route_name": safe_str(row.get("สายทาง")),
                "km": safe_float(row.get("KM")),
                "accident_location": safe_str(row.get("บริเวณที่เกิดเหตุ")),
                # Accident Details
                "vehicle_1": safe_str(row.get("รถคันที่1")),
                "accident_area_type": safe_str(row.get("บริเวณที่เกิดเหตุ")),
                "presumed_cause": safe_str(row.get("มูลเหตุสันนิษฐาน")),
                "accident_type": safe_str(row.get("ลักษณะการเกิดเหตุ")),
                "weather_condition": safe_str(row.get("สภาพอากาศ")),
                # Vehicle Counts
                "total_vehicles": safe_int(row.get("รถที่เกิดเหตุ")),
                "total_vehicles_and_people": safe_int(row.get("รถและคนที่เกิดเหตุ")),
                "motorcycles": safe_int(row.get("รถจักรยานยนต์")),
                "tricycles": safe_int(row.get("รถสามล้อเครื่อง")),
                "private_cars": safe_int(row.get("รถยนต์นั่งส่วนบุคคล")),
                "vans": safe_int(row.get("รถตู้")),
                "passenger_pickups": safe_int(row.get("รถปิคอัพโดยสาร")),
                "buses": safe_int(row.get("รถโดยสารมากกว่า4ล้อ")),
                "pickup_trucks_4wheel": safe_int(row.get("รถปิคอัพบรรทุก4ล้อ")),
                "trucks_6wheel": safe_int(row.get("รถบรรทุก6ล้อ")),
                "trucks_under_10wheel": safe_int(row.get("รถบรรทุกไม่เกิน10ล้อ")),
                "trucks_over_10wheel": safe_int(row.get("รถบรรทุกมากกว่า10ล้อ")),
                "tuk_tuks": safe_int(row.get("รถอีแต๋น")),
                "other_vehicles": safe_int(row.get("รถอื่นๆ")),
                "pedestrians": safe_int(row.get("คนเดินเท้า")),
                # Casualties
                "casualties_fatal": safe_int(row.get("ผู้เสียชีวิต")),
                "casualties_serious": safe_int(row.get("ผู้บาดเจ็บสาหัส")),
                "casualties_minor": safe_int(row.get("ผู้บาดเจ็บเล็กน้อย")),
                "casualties_total": safe_int(row.get("รวมจำนวนผู้บาดเจ็บ")),
                # Weather Data
                "temperature": safe_float(row.get("temperature")),
                "dewpoint": safe_float(row.get("dewpoint")),
                "humidity": safe_float(row.get("humidity")),
                "wind_speed": safe_float(row.get("wind_speed")),
                "wind_direction": safe_float(row.get("wind_direction")),
                "pressure": safe_float(row.get("pressure")),
                "cloud_cover": safe_float(row.get("cloud_cover")),
            }

            records_to_upload.append(record)

            # Upload in batches
            if len(records_to_upload) >= batch_size:
                print(f"\n📤 Uploading batch of {len(records_to_upload)} records...")
                try:
                    response = (
                        client.table("accident_records")
                        .insert(records_to_upload)
                        .execute()
                    )
                    uploaded_count += len(records_to_upload)
                    print(f"✅ Batch uploaded! Total uploaded: {uploaded_count}")
                    records_to_upload = []
                except Exception as e:
                    print(f"❌ Error uploading batch: {e}")
                    # Save failed records
                    with open(f"failed_batch_{idx}.json", "w") as f:
                        import json

                        json.dump(records_to_upload, f, indent=2, default=str)
                    print(f"   Saved failed records to failed_batch_{idx}.json")
                    records_to_upload = []

        except Exception as e:
            print(f"\n❌ Error processing row {idx}: {e}")
            skipped += 1
            continue

    # Upload remaining records
    if records_to_upload:
        print(f"\n📤 Uploading final batch of {len(records_to_upload)} records...")
        try:
            response = (
                client.table("accident_records").insert(records_to_upload).execute()
            )
            uploaded_count += len(records_to_upload)
            print(f"✅ Final batch uploaded!")
        except Exception as e:
            print(f"❌ Error uploading final batch: {e}")
            with open(f"failed_final_batch.json", "w") as f:
                import json

                json.dump(records_to_upload, f, indent=2, default=str)
            print(f"   Saved failed records to failed_final_batch.json")

    print(f"\n✅ Upload complete!")
    print(f"   Total processed: {len(df)}")
    print(f"   Skipped: {skipped}")
    print(f"   Successfully uploaded: {uploaded_count}")


if __name__ == "__main__":
    csv_file = "data/accident_2019_2025_with_weather.csv"

    if not os.path.exists(csv_file):
        print(f"❌ File not found: {csv_file}")
        exit(1)

    print("🚀 Starting FULL accident data upload to Supabase...")
    print(f"📁 File: {csv_file}")
    print(f"🗄️  Database: {SUPABASE_URL}")
    print(f"📊 Table: accident_records (with ALL 47 columns)")
    print()

    # Confirm before proceeding
    response = input(
        "⚠️  This will upload ~145,000 complete records. Continue? (yes/no): "
    )
    if response.lower() != "yes":
        print("❌ Upload cancelled.")
        exit(0)

    upload_full_accident_data(csv_file, batch_size=500)

    print("\n🎉 Done!")
