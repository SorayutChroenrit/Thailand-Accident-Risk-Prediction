"""
Add Missing Columns to Supabase traffic_events Table
------------------------------------------------------
This script adds casualties and weather columns to the traffic_events table
"""

import os

from dotenv import load_dotenv
from supabase import Client, create_client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Initialize Supabase client
client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def add_columns():
    """Add missing columns to traffic_events table"""

    print("🔧 Adding columns to traffic_events table...")
    print(f"🗄️  Database: {SUPABASE_URL}")
    print()

    # SQL statement to add columns
    sql_statements = [
        """
        ALTER TABLE traffic_events
        ADD COLUMN IF NOT EXISTS casualties_fatal INTEGER DEFAULT 0;
        """,
        """
        ALTER TABLE traffic_events
        ADD COLUMN IF NOT EXISTS casualties_serious INTEGER DEFAULT 0;
        """,
        """
        ALTER TABLE traffic_events
        ADD COLUMN IF NOT EXISTS casualties_minor INTEGER DEFAULT 0;
        """,
        """
        ALTER TABLE traffic_events
        ADD COLUMN IF NOT EXISTS temperature FLOAT;
        """,
        """
        ALTER TABLE traffic_events
        ADD COLUMN IF NOT EXISTS humidity FLOAT;
        """,
        """
        ALTER TABLE traffic_events
        ADD COLUMN IF NOT EXISTS wind_speed FLOAT;
        """,
        """
        ALTER TABLE traffic_events
        ADD COLUMN IF NOT EXISTS pressure FLOAT;
        """,
        """
        ALTER TABLE traffic_events
        ADD COLUMN IF NOT EXISTS cloud_cover FLOAT;
        """,
    ]

    print("📝 SQL Statements to execute:")
    print("-" * 60)
    for stmt in sql_statements:
        print(stmt.strip())
    print("-" * 60)
    print()

    # Note: Supabase Python client doesn't directly support DDL
    # We need to use the SQL editor in Supabase Dashboard

    print("⚠️  IMPORTANT:")
    print("   The Supabase Python client doesn't support ALTER TABLE directly.")
    print("   Please run the SQL statements above in Supabase Dashboard:")
    print()
    print("   1. Go to: https://app.supabase.com/")
    print("   2. Select your project")
    print("   3. Click 'SQL Editor' in the left menu")
    print("   4. Paste the SQL statements above")
    print("   5. Click 'Run'")
    print()
    print("   Alternatively, I can create a migration file for you.")
    print()

    # Save SQL to file for easy copy-paste
    with open("add_columns.sql", "w") as f:
        f.write("-- Add Missing Columns to traffic_events Table\n")
        f.write("-- Run this in Supabase SQL Editor\n\n")
        for stmt in sql_statements:
            f.write(stmt.strip() + "\n\n")

    print("✅ SQL statements saved to: add_columns.sql")
    print("   You can copy-paste from this file to Supabase Dashboard")
    print()


if __name__ == "__main__":
    add_columns()
    print("🎉 Done!")
    print()
    print("Next steps:")
    print("1. Run the SQL in Supabase Dashboard")
    print("2. Run: python upload_accident_data.py")
    print("   (It will skip already uploaded records and upload the 858 remaining)")
