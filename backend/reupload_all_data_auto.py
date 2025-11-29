#!/usr/bin/env python3
"""
Script to delete old data and re-upload all 144k accident records to Supabase
AUTO VERSION - No confirmation needed
"""

import os
import sys
from datetime import datetime

import pandas as pd
from supabase_traffic_client import get_supabase_traffic_client


def main():
    print("=" * 80)
    print("🗑️  DELETE & RE-UPLOAD ALL ACCIDENT DATA TO SUPABASE (AUTO)")
    print("=" * 80)

    # Get Supabase client
    print("\n📡 Connecting to Supabase...")
    client = get_supabase_traffic_client()

    # Step 1: Count existing records
    print("\n📊 Counting existing records...")
    try:
        response = (
            client.client.table("accident_records")
            .select("*", count="exact")
            .limit(0)
            .execute()
        )
        existing_count = response.count
        print(f"   Found {existing_count:,} existing records in Supabase")
    except Exception as e:
        print(f"   ⚠️  Could not count existing records: {e}")
        existing_count = 0

    # Step 2: Delete all records
    if existing_count > 0:
        print(f"\n🗑️  Deleting all {existing_count:,} records...")
        try:
            # Use truncate for faster deletion
            print("   Attempting to truncate table...")
            # Supabase doesn't support TRUNCATE via API, so we delete in large batches

            deleted_total = 0
            while True:
                # Delete 1000 records at a time
                try:
                    # Get IDs of records to delete
                    response = (
                        client.client.table("accident_records")
                        .select("id")
                        .limit(1000)
                        .execute()
                    )

                    if not response.data or len(response.data) == 0:
                        break

                    # Delete these records
                    ids = [record["id"] for record in response.data]
                    for record_id in ids:
                        try:
                            client.client.table("accident_records").delete().eq(
                                "id", record_id
                            ).execute()
                            deleted_total += 1
                        except:
                            pass

                    if deleted_total % 5000 == 0:
                        print(f"   Deleted {deleted_total:,} records so far...")

                except Exception as e:
                    print(f"   Error in batch: {e}")
                    break

            print(f"✅ Deleted {deleted_total:,} records!")

        except Exception as e:
            print(f"❌ Error deleting records: {e}")
            print("\n⚠️  ALTERNATIVE: Delete via Supabase SQL Editor:")
            print("   Run: DELETE FROM accident_records;")
            return

    # Step 3: Load CSV file
    csv_file = "data/accident_2019_2025_with_weather.csv"
    print(f"\n📁 Loading CSV file: {csv_file}")

    if not os.path.exists(csv_file):
        print(f"❌ Error: CSV file not found: {csv_file}")
        return

    try:
        df = pd.read_csv(csv_file)
        print(f"✅ Loaded {len(df):,} records from CSV")
        print(f"   Columns: {list(df.columns)[:10]}...")
    except Exception as e:
        print(f"❌ Error loading CSV: {e}")
        return

    # Step 4: Prepare data for upload
    print("\n🔧 Preparing data for upload...")

    # Map columns
    column_mapping = {
        "timestamp": "accident_datetime",
        "ลักษณะการเกิดเหตุ": "accident_type",
        "จังหวัด": "province",
        "ผู้เสียชีวิต": "casualties_fatal",
        "ผู้บาดเจ็บสาหัส": "casualties_serious",
        "ผู้บาดเจ็บเล็กน้อย": "casualties_minor",
    }

    # Rename columns
    df_renamed = df.copy()
    for old_name, new_name in column_mapping.items():
        if old_name in df_renamed.columns:
            df_renamed.rename(columns={old_name: new_name}, inplace=True)

    # Select only needed columns
    required_cols = [
        "accident_datetime",
        "accident_type",
        "province",
        "casualties_fatal",
        "casualties_serious",
        "casualties_minor",
    ]
    available_cols = [col for col in required_cols if col in df_renamed.columns]

    if len(available_cols) < len(required_cols):
        print(f"⚠️  Warning: Some columns missing!")
        print(f"   Required: {required_cols}")
        print(f"   Available: {available_cols}")

    df_upload = df_renamed[available_cols].copy()

    # Handle missing values
    df_upload["casualties_fatal"] = df_upload["casualties_fatal"].fillna(0).astype(int)
    df_upload["casualties_serious"] = (
        df_upload["casualties_serious"].fillna(0).astype(int)
    )
    df_upload["casualties_minor"] = df_upload["casualties_minor"].fillna(0).astype(int)

    # Convert to records
    records = df_upload.to_dict("records")
    print(f"✅ Prepared {len(records):,} records for upload")
    print(f"   Sample: {records[0]}")

    # Step 5: Upload in batches
    print(f"\n📤 Uploading {len(records):,} records to Supabase...")
    print("   This will take several minutes. Please wait...")

    batch_size = 1000
    total_uploaded = 0
    errors = []

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
            records_per_sec = total_uploaded / elapsed if elapsed > 0 else 0
            eta_seconds = (
                (len(records) - total_uploaded) / records_per_sec
                if records_per_sec > 0
                else 0
            )

            print(
                f"   [{batch_num:3d}/{total_batches}] {total_uploaded:6,}/{len(records):,} records "
                f"({progress:5.1f}%) | {records_per_sec:4.0f} rec/s | ETA: {int(eta_seconds / 60):2d}m {int(eta_seconds % 60):2d}s"
            )

        except Exception as e:
            error_msg = f"Batch {batch_num} failed: {str(e)[:80]}"
            errors.append(error_msg)
            print(f"   ❌ {error_msg}")

            if len(errors) >= 5:
                print(f"\n⚠️  Too many errors ({len(errors)}). Stopping.")
                break

    elapsed_total = (datetime.now() - start_time).total_seconds()

    # Step 6: Verify upload
    print(f"\n📊 Verifying upload...")
    try:
        response = (
            client.client.table("accident_records")
            .select("*", count="exact")
            .limit(0)
            .execute()
        )
        final_count = response.count
        print(f"\n✅ Upload complete!")
        print(f"   Total in Supabase: {final_count:,}")
        print(f"   Expected: {len(records):,}")
        print(f"   Upload time: {int(elapsed_total / 60)}m {int(elapsed_total % 60)}s")
        print(f"   Upload speed: {total_uploaded / elapsed_total:.0f} records/second")

        if final_count == len(records):
            print("\n🎉 SUCCESS! All records uploaded!")
        else:
            print(f"\n⚠️  WARNING: Missing {len(records) - final_count:,} records")

    except Exception as e:
        print(f"❌ Error verifying: {e}")

    if errors:
        print(f"\n⚠️  Errors: {len(errors)}")
        for error in errors[:3]:
            print(f"   - {error}")

    print("\n" + "=" * 80)
    print("✅ DONE!")
    print("=" * 80)


if __name__ == "__main__":
    main()
