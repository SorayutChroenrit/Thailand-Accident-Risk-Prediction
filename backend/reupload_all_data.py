#!/usr/bin/env python3
"""
Script to delete old data and re-upload all 144k accident records to Supabase

This script will:
1. Delete all existing records from accident_records table
2. Upload all 144,858 records from CSV file
3. Verify the upload was successful
"""

import os
import sys
from datetime import datetime

import pandas as pd
from supabase_traffic_client import get_supabase_traffic_client


def main():
    print("=" * 80)
    print("🗑️  DELETE & RE-UPLOAD ALL ACCIDENT DATA TO SUPABASE")
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

    # Step 2: Confirm deletion
    if existing_count > 0:
        print(
            f"\n⚠️  WARNING: This will DELETE all {existing_count:,} existing records!"
        )
        confirm = input("   Type 'DELETE' to confirm: ")
        if confirm != "DELETE":
            print("❌ Aborted. No data was deleted.")
            return

        print(f"\n🗑️  Deleting all {existing_count:,} records...")
        try:
            # Delete in batches to avoid timeout
            batch_size = 1000
            deleted = 0

            while True:
                # Delete up to 1000 records at a time
                response = (
                    client.client.table("accident_records")
                    .delete()
                    .limit(batch_size)
                    .execute()
                )

                if not response.data:
                    break

                deleted += len(response.data)
                print(f"   Deleted {deleted:,} records so far...")

                if len(response.data) < batch_size:
                    break

            print(f"✅ Deleted all {deleted:,} records successfully!")

        except Exception as e:
            print(f"❌ Error deleting records: {e}")
            print("   You may need to delete manually via Supabase Dashboard:")
            print("   1. Go to Table Editor")
            print("   2. Select accident_records table")
            print("   3. Click 'Delete all rows'")
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
        print(f"   Columns: {list(df.columns)}")
    except Exception as e:
        print(f"❌ Error loading CSV: {e}")
        return

    # Step 4: Prepare data for upload
    print("\n🔧 Preparing data for upload...")

    # Check if columns match the expected schema
    expected_columns = [
        "accident_datetime",
        "accident_type",
        "province",
        "casualties_fatal",
        "casualties_serious",
        "casualties_minor",
    ]

    # Map Thai column names to English
    column_mapping = {
        "timestamp": "accident_datetime",
        "ลักษณะการเกิดเหตุ": "accident_type",
        "จังหวัด": "province",
        "ผู้เสียชีวิต": "casualties_fatal",
        "ผู้บาดเจ็บสาหัส": "casualties_serious",
        "ผู้บาดเจ็บเล็กน้อย": "casualties_minor",
    }

    # Rename columns if they are in Thai
    df_renamed = df.copy()
    for thai_name, eng_name in column_mapping.items():
        if thai_name in df_renamed.columns:
            df_renamed.rename(columns={thai_name: eng_name}, inplace=True)

    # Select only the columns we need
    available_cols = [col for col in expected_columns if col in df_renamed.columns]
    df_upload = df_renamed[available_cols].copy()

    print(f"   Selected columns: {available_cols}")

    # Handle missing values
    df_upload["casualties_fatal"] = df_upload["casualties_fatal"].fillna(0).astype(int)
    df_upload["casualties_serious"] = (
        df_upload["casualties_serious"].fillna(0).astype(int)
    )
    df_upload["casualties_minor"] = df_upload["casualties_minor"].fillna(0).astype(int)

    # Convert to records
    records = df_upload.to_dict("records")
    print(f"✅ Prepared {len(records):,} records for upload")

    # Step 5: Upload in batches
    print(f"\n📤 Uploading {len(records):,} records to Supabase...")
    print("   This may take several minutes...")

    batch_size = 1000  # Supabase recommends batches of 1000
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
                f"   Batch {batch_num}/{total_batches}: Uploaded {total_uploaded:,}/{len(records):,} records "
                f"({progress:.1f}%) - {records_per_sec:.0f} records/sec - ETA: {eta_seconds:.0f}s"
            )

        except Exception as e:
            error_msg = f"Batch {batch_num} failed: {str(e)[:100]}"
            errors.append(error_msg)
            print(f"   ❌ {error_msg}")

            # Ask if we should continue
            if len(errors) >= 3:
                print(f"\n⚠️  Too many errors ({len(errors)}). Stopping upload.")
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
        print(f"✅ Upload complete!")
        print(f"   Total records in Supabase: {final_count:,}")
        print(f"   Expected records: {len(records):,}")
        print(
            f"   Upload time: {elapsed_total:.1f} seconds ({elapsed_total / 60:.1f} minutes)"
        )
        print(f"   Upload speed: {total_uploaded / elapsed_total:.0f} records/second")

        if final_count == len(records):
            print("\n🎉 SUCCESS! All records uploaded successfully!")
        else:
            print(f"\n⚠️  WARNING: Record count mismatch!")
            print(f"   Missing {len(records) - final_count:,} records")

    except Exception as e:
        print(f"❌ Error verifying upload: {e}")

    if errors:
        print(f"\n⚠️  Encountered {len(errors)} errors during upload:")
        for error in errors[:5]:  # Show first 5 errors
            print(f"   - {error}")

    print("\n" + "=" * 80)
    print("✅ DONE!")
    print("=" * 80)


if __name__ == "__main__":
    main()
