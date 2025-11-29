"""
Upload Accident Data from CSV to Supabase
-------------------------------------------
This script reads accident_with_severity.csv and uploads to Supabase traffic_events table
"""

import os
from datetime import datetime

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


def parse_thai_date(date_str, time_str):
    """Parse Thai date format to ISO format"""
    try:
        # Combine date and time
        datetime_str = f"{date_str} {time_str}"
        # Try multiple date formats
        for fmt in ["%Y-%m-%d %H:%M", "%m/%d/%Y %H:%M", "%Y-%m-%d %H:%M:%S"]:
            try:
                dt = datetime.strptime(datetime_str, fmt)
                return dt.isoformat()
            except:
                continue
        return None
    except Exception as e:
        print(f"Error parsing date: {date_str} {time_str} - {e}")
        return None


def map_severity(severity_text):
    """Map Thai severity text to English"""
    if pd.isna(severity_text):
        return "low"

    severity_map = {"เสียชีวิต": "high", "บาดเจ็บสาหัส": "medium", "บาดเจ็บเล็กน้อย": "low"}
    return severity_map.get(severity_text, "low")


def calculate_severity_score(fatal, serious, minor):
    """Calculate severity score (0-10)"""
    # Fatal = 10 points, Serious = 5 points, Minor = 1 point
    score = (fatal * 10) + (serious * 5) + (minor * 1)
    # Normalize to 0-10 scale
    return min(10, score)


def map_weather(weather_text):
    """Map Thai weather to English"""
    if pd.isna(weather_text):
        return "unknown"

    weather_map = {
        "แจ่มใส": "clear",
        "ฝนตก": "rain",
        "ฝนตกหนัก": "heavy_rain",
        "หมอก": "fog",
        "มีเมฆมาก": "cloudy",
        "ไม่ทราบ": "unknown",
    }

    for thai, eng in weather_map.items():
        if thai in str(weather_text):
            return eng

    return "unknown"


def map_road_condition(location_text):
    """Infer road condition from location text"""
    if pd.isna(location_text):
        return "unknown"

    text = str(location_text).lower()

    if "เปียก" in text or "ลื่น" in text:
        return "wet"
    elif "แห้ง" in text:
        return "dry"
    else:
        return "unknown"


def upload_accidents_batch(csv_path, batch_size=1000):
    """Upload accidents to Supabase in batches"""

    print(f"📖 Reading CSV file: {csv_path}")
    df = pd.read_csv(csv_path)
    print(f"✅ Loaded {len(df)} records")

    # Show column names
    print(f"\n📋 Columns: {df.columns.tolist()}")

    # Process data
    print(f"\n🔄 Processing data...")

    records_to_upload = []
    skipped = 0

    for idx, row in tqdm(df.iterrows(), total=len(df), desc="Processing"):
        try:
            # Parse date
            event_date = parse_thai_date(row["วันที่เกิดเหตุ"], row["เวลา"])
            if not event_date:
                skipped += 1
                continue

            # Get coordinates
            lat = row.get("LATITUDE")
            lon = row.get("LONGITUDE")

            if pd.isna(lat) or pd.isna(lon):
                skipped += 1
                continue

            # Parse casualties
            fatal = int(row.get("ผู้เสียชีวิต", 0)) if not pd.isna(row.get("ผู้เสียชีวิต")) else 0
            serious = (
                int(row.get("ผู้บาดเจ็บสาหัส", 0))
                if not pd.isna(row.get("ผู้บาดเจ็บสาหัส"))
                else 0
            )
            minor = (
                int(row.get("ผู้บาดเจ็บเล็กน้อย", 0))
                if not pd.isna(row.get("ผู้บาดเจ็บเล็กน้อย"))
                else 0
            )

            # Map severity
            severity = map_severity(row.get("y"))
            severity_score = calculate_severity_score(fatal, serious, minor)

            # Extract year
            year = int(row.get("ปีที่เกิดเหตุ", 2019))

            # Get weather data (from the new columns)
            temperature = row.get("temperature")
            humidity = row.get("humidity")
            wind_speed = row.get("wind_speed")
            pressure = row.get("pressure")
            cloud_cover = row.get("cloud_cover")

            # Create record
            record = {
                "event_id": f"thai_accident_{year}_{idx}",
                "event_date": event_date,
                "year": year,
                "latitude": float(lat),
                "longitude": float(lon),
                "event_type": "accident",
                "severity": severity,
                "severity_score": severity_score,
                "title_th": f"อุบัติเหตุ {row.get('บริเวณที่เกิดเหตุ', 'ไม่ระบุ')}",
                "description_th": f"มูลเหตุ: {row.get('มูลเหตุสันนิษฐาน', 'ไม่ทราบ')} | ลักษณะ: {row.get('ลักษณะการเกิดเหตุ', 'ไม่ทราบ')}",
                "location_name": f"{row.get('บริเวณที่เกิดเหตุ', '')} {row.get('สายทาง', '')} {row.get('จังหวัด', '')}".strip(),
                "province": row.get("จังหวัด", ""),
                "weather": map_weather(row.get("สภาพอากาศ")),
                "road_condition": map_road_condition(row.get("บริเวณที่เกิดเหตุ")),
                "casualties_fatal": fatal,
                "casualties_serious": serious,
                "casualties_minor": minor,
                "source": "thai_accident_data",
                "created_at": datetime.utcnow().isoformat(),
            }

            # Add weather data if available
            if not pd.isna(temperature):
                record["temperature"] = float(temperature)
            if not pd.isna(humidity):
                record["humidity"] = float(humidity)
            if not pd.isna(wind_speed):
                record["wind_speed"] = float(wind_speed)
            if not pd.isna(pressure):
                record["pressure"] = float(pressure)
            if not pd.isna(cloud_cover):
                record["cloud_cover"] = float(cloud_cover)

            records_to_upload.append(record)

            # Upload in batches
            if len(records_to_upload) >= batch_size:
                print(f"\n📤 Uploading batch of {len(records_to_upload)} records...")
                try:
                    response = (
                        client.table("traffic_events")
                        .insert(records_to_upload)
                        .execute()
                    )
                    print(f"✅ Batch uploaded successfully!")
                    records_to_upload = []
                except Exception as e:
                    print(f"❌ Error uploading batch: {e}")
                    print(f"First record sample: {records_to_upload[0]}")
                    # Continue with next batch
                    records_to_upload = []

        except Exception as e:
            print(f"❌ Error processing row {idx}: {e}")
            skipped += 1
            continue

    # Upload remaining records
    if records_to_upload:
        print(f"\n📤 Uploading final batch of {len(records_to_upload)} records...")
        try:
            response = (
                client.table("traffic_events").insert(records_to_upload).execute()
            )
            print(f"✅ Final batch uploaded successfully!")
        except Exception as e:
            print(f"❌ Error uploading final batch: {e}")

    print(f"\n✅ Upload complete!")
    print(f"   Total processed: {len(df)}")
    print(f"   Skipped: {skipped}")
    print(f"   Successfully uploaded: {len(df) - skipped}")


if __name__ == "__main__":
    csv_file = "data/accident_2019_2025_with_weather.csv"

    if not os.path.exists(csv_file):
        print(f"❌ File not found: {csv_file}")
        exit(1)

    print("🚀 Starting accident data upload to Supabase...")
    print(f"📁 File: {csv_file}")
    print(f"🗄️  Database: {SUPABASE_URL}")
    print()

    # Confirm before proceeding
    response = input(
        "⚠️  This will upload ~145,000 records with weather data. Continue? (yes/no): "
    )
    if response.lower() != "yes":
        print("❌ Upload cancelled.")
        exit(0)

    upload_accidents_batch(csv_file, batch_size=1000)

    print("\n🎉 Done!")
