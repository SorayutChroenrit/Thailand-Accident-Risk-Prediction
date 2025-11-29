#!/usr/bin/env python3
"""
Apply Database Indexes for Performance Optimization
This script will create indexes on the accident_records table to improve dashboard performance
"""

import os

from supabase_traffic_client import get_supabase_traffic_client


def apply_indexes():
    """Apply database indexes to accident_records table"""

    print("=" * 60)
    print("🚀 Applying Database Indexes for Performance Optimization")
    print("=" * 60)

    client = get_supabase_traffic_client()

    # Read SQL file
    sql_file = "add_database_indexes.sql"

    if not os.path.exists(sql_file):
        print(f"❌ SQL file not found: {sql_file}")
        return

    with open(sql_file, "r", encoding="utf-8") as f:
        sql_content = f.read()

    # Split SQL into individual statements
    sql_statements = [
        stmt.strip()
        for stmt in sql_content.split(";")
        if stmt.strip() and not stmt.strip().startswith("--")
    ]

    print(f"\n📝 Found {len(sql_statements)} SQL statements to execute\n")

    success_count = 0
    failed_count = 0

    for i, statement in enumerate(sql_statements, 1):
        # Skip comments and empty statements
        if not statement or statement.startswith("--"):
            continue

        # Extract index name for display
        index_name = "Unknown"
        if "CREATE INDEX" in statement:
            try:
                index_name = statement.split("idx_")[1].split()[0]
                index_name = f"idx_{index_name}"
            except:
                pass

        print(f"[{i}/{len(sql_statements)}] Executing: {index_name}")

        try:
            # Execute via Supabase RPC or direct SQL
            # Note: Supabase Python client doesn't support direct SQL execution
            # You need to run this via Supabase Dashboard SQL Editor
            # This script is for documentation and can be adapted

            print(f"  ✅ {index_name} - Ready to apply")
            success_count += 1

        except Exception as e:
            print(f"  ❌ {index_name} - Error: {e}")
            failed_count += 1

    print("\n" + "=" * 60)
    print("📊 Summary:")
    print(f"  ✅ Success: {success_count}")
    print(f"  ❌ Failed: {failed_count}")
    print("=" * 60)

    print(
        "\n"
        + "⚠️  IMPORTANT: Supabase Python client doesn't support direct SQL execution"
    )
    print("📋 To apply these indexes:")
    print("   1. Open Supabase Dashboard")
    print("   2. Go to SQL Editor")
    print("   3. Copy the content of 'add_database_indexes.sql'")
    print("   4. Paste and run the SQL")
    print("   5. Verify in Table Editor > Indexes tab")
    print("\n🔗 Or use the Supabase CLI:")
    print("   supabase db push")
    print("\n")


if __name__ == "__main__":
    apply_indexes()
